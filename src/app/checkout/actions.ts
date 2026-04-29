'use server'

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
}

export async function submitOrder(payload: CheckoutPayload) {
  const supabase = await createClient()

  // Verify auth
  const { data: authData } = await supabase.auth.getUser()
  const customerId = authData.user ? authData.user.id : null

  // Get email and delivery address from profile if logged in
  let customerEmail = null
  if (customerId) {
    const { data: profile } = await supabase.from('customer_profiles').select('email').eq('id', customerId).single()
    if (profile) {
      customerEmail = profile.email
    }
  }

  // Update profile with the latest preferences if customer is logged in
  if (customerId) {
    await supabase.from('customer_profiles').update({
      default_delivery_method: payload.customer.delivery_method,
      default_payment_method: payload.customer.payment_method,
      delivery_address: payload.customer.delivery_address || null,
      delivery_lat: payload.customer.delivery_lat,
      delivery_lng: payload.customer.delivery_lng,
    }).eq('id', customerId)
  }

  // Insert order
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
    total_price: payload.totalPrice,
    total_items: payload.totalItems,
  }).select('id').single()

  if (orderError || !orderData) {
    throw new Error('Falha ao registrar o pedido: ' + orderError?.message)
  }

  const orderId = orderData.id

  // Insert order items
  const itemsToInsert = payload.items.map(item => ({
    order_id: orderId,
    product_id: item.productId,
    // The cart currently doesn't store variantId. If we had it, we'd add it.
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
    // Note: If items fail, the order is left without items. We could delete the order as a rollback or use an RPC function, 
    // but for simplicity, we just throw an error.
    throw new Error('Falha ao registrar os itens do pedido: ' + itemsError.message)
  }

  return { success: true, orderId }
}
