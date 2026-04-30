'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { CartItem } from '@/components/store/CartProvider'

type CheckoutPayload = {
  customer: {
    name: string
    phone: string
    notes: string
    delivery_method: string
    payment_method: string
    installments: number
    delivery_address: string
    delivery_lat: number | null
    delivery_lng: number | null
  }
  items: CartItem[]
  totalPrice: number
  totalItems: number
  couponCode?: string | null
  shippingCost?: number
  shippingZoneId?: string
  shippingZoneName?: string
  shippingZip?: string
}

export type ValidateCouponResult = {
  valid: boolean
  coupon?: {
    id: string
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
  }
  error?: string
}

function stripNonDigits(value: string) {
  return value.replace(/\D/g, '')
}

export async function calculateShipping(zipCode: string, orderTotal: number) {
  const supabase = await createClient()
  const cleanZip = stripNonDigits(zipCode)

  const { data: zones, error } = await supabase
    .from('shipping_zones')
    .select('*')
    .eq('is_active', true)

  if (error || !zones || zones.length === 0) {
    return {
      shippingCost: 0,
      estimatedDays: 0,
      zoneName: null,
      zoneId: null,
      isFree: false,
      notFound: false,
    }
  }

  const matchingZone = zones.find((zone) => {
    const start = stripNonDigits(zone.zip_code_start)
    const end = stripNonDigits(zone.zip_code_end)
    return cleanZip >= start && cleanZip <= end
  })

  if (!matchingZone) {
    return {
      shippingCost: 0,
      estimatedDays: 0,
      zoneName: null,
      zoneId: null,
      isFree: false,
      notFound: true,
    }
  }

  const basePrice = Number(matchingZone.base_price)
  const threshold = matchingZone.free_shipping_threshold ? Number(matchingZone.free_shipping_threshold) : null

  if (threshold !== null && orderTotal >= threshold) {
    return {
      shippingCost: 0,
      estimatedDays: matchingZone.estimated_days,
      zoneName: matchingZone.name,
      zoneId: matchingZone.id,
      isFree: true,
      notFound: false,
    }
  }

  return {
    shippingCost: basePrice,
    estimatedDays: matchingZone.estimated_days,
    zoneName: matchingZone.name,
    zoneId: matchingZone.id,
    isFree: false,
    notFound: false,
  }
}

function validateCheckoutPayload(payload: CheckoutPayload) {
  const errors: string[] = []

  if (!payload.customer.name?.trim()) {
    errors.push('Nome do cliente é obrigatório.')
  }

  if (!payload.customer.phone?.trim()) {
    errors.push('Telefone do cliente é obrigatório.')
  }

  if (!payload.customer.delivery_method) {
    errors.push('Método de entrega é obrigatório.')
  }

  if (!payload.customer.payment_method) {
    errors.push('Método de pagamento é obrigatório.')
  }

  if (payload.customer.delivery_method === 'delivery' && !payload.customer.delivery_address?.trim()) {
    errors.push('Endereço de entrega é obrigatório para delivery.')
  }

  if (!payload.items || payload.items.length === 0) {
    errors.push('O carrinho está vazio. Adicione itens antes de finalizar.')
  }

  return errors
}

export async function validateCoupon(code: string): Promise<ValidateCouponResult> {
  const normalizedCode = code.trim().toUpperCase()

  if (!normalizedCode) {
    return { valid: false, error: 'Informe um codigo de cupom.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store_coupons')
    .select('id, code, discount_type, discount_value, min_order_value, max_uses, current_uses, is_active, expires_at')
    .ilike('code', normalizedCode)
    .single()

  if (error || !data) {
    return { valid: false, error: 'Cupom nao encontrado.' }
  }

  if (!data.is_active) {
    return { valid: false, error: 'Este cupom nao esta mais ativo.' }
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'Este cupom expirou.' }
  }

  if (data.max_uses !== null && data.current_uses >= data.max_uses) {
    return { valid: false, error: 'Este cupom atingiu o limite de uso.' }
  }

  return {
    valid: true,
    coupon: {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
    },
  }
}

export async function submitOrder(payload: CheckoutPayload) {
  const validationErrors = validateCheckoutPayload(payload)

  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(' '))
  }

  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const customerId = authData.user ? authData.user.id : null

  let customerEmail = null

  try {
    if (customerId) {
      const { data: profile } = await supabase.from('customer_profiles').select('email').eq('id', customerId).single()
      if (profile) {
        customerEmail = profile.email
      }
    }
  } catch {
    // Profile fetch is non-critical; proceed without email
  }

  const productIds = payload.items.map((item) => item.productId)

  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, price')
    .in('id', productIds)

  const priceMap = new Map<string, number>()
  if (dbProducts) {
    for (const product of dbProducts) {
      priceMap.set(product.id, Number(product.price))
    }
  }

  let verifiedTotalPrice = 0
  const verifiedItems = payload.items.map((item) => {
    const verifiedPrice = priceMap.get(item.productId) ?? item.price
    verifiedTotalPrice += verifiedPrice * item.quantity
    return { ...item, price: verifiedPrice }
  })

  let discountAmount = 0
  let couponCode: string | null = null

  if (payload.couponCode) {
    const couponResult = await validateCoupon(payload.couponCode)
    if (couponResult.valid && couponResult.coupon) {
      couponCode = couponResult.coupon.code

      if (couponResult.coupon.discount_type === 'fixed') {
        discountAmount = Math.min(couponResult.coupon.discount_value, verifiedTotalPrice)
      } else {
        discountAmount = Math.round((verifiedTotalPrice * couponResult.coupon.discount_value) / 100 * 100) / 100
      }

      const { data: currentCoupon } = await supabase
        .from('store_coupons')
        .select('current_uses')
        .eq('id', couponResult.coupon.id)
        .single()

      await supabase
        .from('store_coupons')
        .update({ current_uses: (currentCoupon?.current_uses ?? 0) + 1 })
        .eq('id', couponResult.coupon.id)
    }
  }

  const finalTotalPrice = Math.max(0, verifiedTotalPrice - discountAmount)

  const verifiedTotalItems = verifiedItems.reduce((sum, item) => sum + item.quantity, 0)

  try {
    if (customerId) {
      await supabase.from('customer_profiles').update({
        default_delivery_method: payload.customer.delivery_method,
        default_payment_method: payload.customer.payment_method,
        delivery_address: payload.customer.delivery_address || null,
        delivery_lat: payload.customer.delivery_lat,
        delivery_lng: payload.customer.delivery_lng,
      }).eq('id', customerId)
    }
  } catch {
    // Profile update is non-critical
  }

  const { data: orderData, error: orderError } = await supabase.from('store_orders').insert({
    customer_id: customerId,
    customer_name: payload.customer.name,
    customer_email: customerEmail,
    customer_phone: payload.customer.phone,
    delivery_address: payload.customer.delivery_address || null,
    delivery_method: payload.customer.delivery_method,
    payment_method: payload.customer.payment_method,
    installments: payload.customer.installments,
    delivery_lat: payload.customer.delivery_lat,
    delivery_lng: payload.customer.delivery_lng,
    notes: payload.customer.notes,
    status: 'pending',
    total_price: finalTotalPrice,
    total_items: verifiedTotalItems,
    coupon_code: couponCode,
    discount_amount: discountAmount,
    shipping_cost: payload.shippingCost || 0,
    shipping_zone_name: payload.shippingZoneName || null,
    shipping_zip: payload.shippingZip || null,
  }).select('id').single()

  if (orderError || !orderData) {
    throw new Error('Falha ao registrar o pedido: ' + orderError?.message)
  }

  const orderId = orderData.id

  const itemsToInsert = verifiedItems.map(item => ({
    order_id: orderId,
    product_id: item.productId,
    name: item.name,
    sku: item.sku || null,
    color_name: item.colorName || null,
    color_hex: item.colorHex || null,
    size: item.size || null,
    price: item.price,
    quantity: item.quantity,
    image_url: item.image || null,
  }))

  const { error: itemsError } = await supabase.from('store_order_items').insert(itemsToInsert)

  if (itemsError) {
    await supabase.from('store_orders').delete().eq('id', orderId)
    throw new Error('Falha ao registrar os itens do pedido: ' + itemsError.message)
  }

  revalidatePath('/conta/pedidos')
  revalidatePath('/dashboard/pedidos')

  return { success: true, orderId, totalPrice: finalTotalPrice, discountAmount, totalItems: verifiedTotalItems, shippingCost: payload.shippingCost || 0, shippingZoneName: payload.shippingZoneName || null }
}
