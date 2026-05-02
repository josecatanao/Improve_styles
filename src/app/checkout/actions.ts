'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { CartItem } from '@/components/store/CartProvider'
import {
  calculateCouponDiscountFromItems,
  getEligibleCouponItems,
} from '@/lib/store-coupons'
import { validateCouponOnServer } from '@/lib/store-coupons.server'

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
    discount_type: 'percentage' | 'fixed' | 'free_shipping'
    discount_value: number
    min_order_value: number | null
    productIds: string[]
    categories: string[]
  }
  error?: string
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
  const { coupon, error } = await validateCouponOnServer(code)

  return {
    valid: Boolean(coupon),
    coupon: coupon ?? undefined,
    error: error ?? undefined,
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
    .select('id, price, category')
    .in('id', productIds)

  const priceMap = new Map<string, number>()
  const categoryMap = new Map<string, string | null>()
  if (dbProducts) {
    for (const product of dbProducts) {
      priceMap.set(product.id, Number(product.price))
      categoryMap.set(product.id, product.category ?? null)
    }
  }

  const { data: dbVariants } = await supabase
    .from('product_variants')
    .select('product_id, color_hex, size, price')
    .in('product_id', productIds)

  const variantPriceMap = new Map<string, number>()
  if (dbVariants) {
    for (const v of dbVariants) {
      const key = `${v.product_id}:${v.color_hex || ''}:${v.size || ''}`
      if (v.price != null) {
        variantPriceMap.set(key, Number(v.price))
      }
    }
  }

  let verifiedTotalPrice = 0
  const verifiedItems = payload.items.map((item) => {
    const variantKey = `${item.productId}:${item.colorHex || ''}:${item.size || ''}`
    const verifiedPrice = variantPriceMap.get(variantKey) ?? priceMap.get(item.productId) ?? item.price
    verifiedTotalPrice += verifiedPrice * item.quantity
    return { ...item, price: verifiedPrice }
  })

  const { data: productsStock } = await supabase
    .from('products')
    .select('id, stock')
    .in('id', productIds)

  const productStockMap = new Map<string, number>()
  if (productsStock) {
    for (const p of productsStock) {
      productStockMap.set(p.id, Number(p.stock ?? 0))
    }
  }

  const { data: variantsStock } = await supabase
    .from('product_variants')
    .select('product_id, color_hex, size, stock')
    .in('product_id', productIds)

  const variantStockMap = new Map<string, number>()
  if (variantsStock) {
    for (const v of variantsStock) {
      const key = `${v.product_id}:${v.color_hex || ''}:${v.size || ''}`
      variantStockMap.set(key, Number(v.stock ?? 0))
    }
  }

  for (const item of verifiedItems) {
    const variantKey = `${item.productId}:${item.colorHex || ''}:${item.size || ''}`
    const availableStock = variantStockMap.get(variantKey) ?? productStockMap.get(item.productId) ?? 0
    if (availableStock < item.quantity) {
      throw new Error(`Estoque insuficiente para "${item.name}". Disponivel: ${availableStock}, solicitado: ${item.quantity}`)
    }
  }

  let discountAmount = 0
  let couponCode: string | null = null
  let isFreeShippingCoupon = false

  if (payload.couponCode) {
    const couponResult = await validateCoupon(payload.couponCode)
    if (!couponResult.valid || !couponResult.coupon) {
      throw new Error(couponResult.error || 'Cupom invalido.')
    }

    const coupon = couponResult.coupon

    const scopedItems = verifiedItems.map((item) => ({
      ...item,
      productCategory: categoryMap.get(item.productId) ?? null,
    }))
    const eligibleItems = getEligibleCouponItems(scopedItems, coupon)

    if (eligibleItems.length === 0) {
      throw new Error('Nenhum produto no carrinho e elegivel para este cupom.')
    }

    const eligibleTotal = eligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    if (coupon.min_order_value != null && eligibleTotal < coupon.min_order_value) {
      throw new Error(`Pedido minimo de R$ ${coupon.min_order_value.toFixed(2).replace('.', ',')} para usar este cupom`)
    }

    couponCode = coupon.code

    if (coupon.discount_type === 'fixed') {
      discountAmount = Math.min(coupon.discount_value, eligibleTotal)
    } else if (coupon.discount_type === 'free_shipping') {
      isFreeShippingCoupon = true
      discountAmount = payload.shippingCost || 0
    } else {
      discountAmount = calculateCouponDiscountFromItems(eligibleItems, coupon)
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
    shipping_cost: isFreeShippingCoupon ? 0 : (payload.shippingCost || 0),
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

  if (couponCode) {
    const { data: claimResult, error: claimError } = await supabase.rpc('claim_coupon_use', {
      input_code: couponCode,
    })

    if (claimError) {
      await supabase.from('store_order_items').delete().eq('order_id', orderId)
      await supabase.from('store_orders').delete().eq('id', orderId)
      throw new Error('Falha ao reservar o uso do cupom para este pedido.')
    }

    if (!claimResult) {
      await supabase.from('store_order_items').delete().eq('order_id', orderId)
      await supabase.from('store_orders').delete().eq('id', orderId)
      throw new Error('Este cupom atingiu o limite de uso ou nao esta mais disponivel.')
    }
  }

  const adminSupabase = createAdminClient()

  try {
    for (const item of verifiedItems) {
      const { productId, colorHex, size, quantity } = item

      if (colorHex && size) {
        const { data: variantData } = await adminSupabase
          .from('product_variants')
          .select('stock')
          .eq('product_id', productId)
          .eq('color_hex', colorHex)
          .eq('size', size)
          .maybeSingle()

        if (variantData) {
          const newStock = Math.max(0, Number(variantData.stock) - quantity)
          await adminSupabase
            .from('product_variants')
            .update({ stock: newStock })
            .eq('product_id', productId)
            .eq('color_hex', colorHex)
            .eq('size', size)
        }
      }

      const { data: productData } = await adminSupabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .maybeSingle()

      if (productData) {
        const newStock = Math.max(0, Number(productData.stock) - quantity)
        await adminSupabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productId)
      }
    }
  } catch {
    await supabase.from('store_order_items').delete().eq('order_id', orderId)
    await supabase.from('store_orders').delete().eq('id', orderId)
    throw new Error('Falha ao atualizar estoque. O pedido nao foi concluido.')
  }

  revalidatePath('/conta/pedidos')
  revalidatePath('/dashboard/pedidos')

  return { success: true, orderId, totalPrice: finalTotalPrice, discountAmount, totalItems: verifiedTotalItems, shippingCost: isFreeShippingCoupon ? 0 : (payload.shippingCost || 0), shippingZoneName: payload.shippingZoneName || null }
}
