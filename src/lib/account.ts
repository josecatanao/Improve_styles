import { createClient } from '@/utils/supabase/server'

export type AccountProfile = {
  id: string
  email: string
  full_name: string
  whatsapp: string | null
  photo_url: string | null
  delivery_address: string | null
  delivery_house_number: string | null
  delivery_complement: string | null
  delivery_neighborhood: string | null
  delivery_zip_code: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_reference: string | null
  delivery_gps_captured_at: string | null
  delivery_lat: number | null
  delivery_lng: number | null
}

export type AccountOrderItem = {
  id: string
  product_id: string
  name: string
  quantity: number
  price: number
  image_url: string | null
  color_name: string | null
  size: string | null
}

export type AccountOrder = {
  id: string
  created_at: string
  total_price: number
  total_items: number
  status: string
  delivery_method: string
  payment_method: string
  installments: number
  delivery_address: string | null
  delivery_lat: number | null
  delivery_lng: number | null
  store_order_items: AccountOrderItem[]
}

export async function getAccountProfile(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customer_profiles')
    .select(
      'id, email, full_name, whatsapp, photo_url, delivery_address, delivery_house_number, delivery_complement, delivery_neighborhood, delivery_zip_code, delivery_city, delivery_state, delivery_reference, delivery_gps_captured_at, delivery_lat, delivery_lng'
    )
    .eq('id', userId)
    .single()

  return (data ?? null) as AccountProfile | null
}

export async function getCustomerOrders(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_orders')
    .select(
      `
        id,
        created_at,
        total_price,
        total_items,
        status,
        delivery_method,
        payment_method,
        installments,
        delivery_address,
        delivery_lat,
        delivery_lng,
        store_order_items (
          id,
          product_id,
          name,
          quantity,
          price,
          image_url,
          color_name,
          size
        )
      `
    )
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })

  const orders = ((data ?? []) as AccountOrder[]).map((order) => ({
    ...order,
    total_price: Number(order.total_price),
    total_items: Number(order.total_items),
    installments: Number(order.installments),
    delivery_lat: order.delivery_lat === null ? null : Number(order.delivery_lat),
    delivery_lng: order.delivery_lng === null ? null : Number(order.delivery_lng),
    store_order_items: (order.store_order_items ?? []).map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      price: Number(item.price),
      image_url: item.image_url ?? null,
      color_name: item.color_name ?? null,
      size: item.size ?? null,
    })),
  }))

  const missingImageProductIds = Array.from(
    new Set(
      orders
        .flatMap((order) => order.store_order_items)
        .filter((item) => !item.image_url && item.product_id)
        .map((item) => item.product_id)
    )
  )

  if (missingImageProductIds.length === 0) {
    return orders
  }

  const { data: productRows } = await supabase
    .from('products')
    .select(
      `
        id,
        product_images (
          public_url,
          sort_order
        )
      `
    )
    .in('id', missingImageProductIds)

  const productImageMap = new Map<string, string | null>(
    ((productRows as Array<{ id: string; product_images?: Array<{ public_url: string | null; sort_order?: number | null }> }> | null) ?? []).map(
      (product) => [
        product.id,
        (product.product_images ?? [])
          .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
          .find((image) => image.public_url)?.public_url ?? null,
      ]
    )
  )

  return orders.map((order) => ({
    ...order,
    store_order_items: order.store_order_items.map((item) => ({
      ...item,
      image_url: item.image_url ?? productImageMap.get(item.product_id) ?? null,
    })),
  }))
}
