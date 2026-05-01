import { createAdminClient } from '@/utils/supabase/admin'

export type StoreOrderItem = {
  id: string
  name: string
  sku: string | null
  color_name: string | null
  size: string | null
  price: number
  quantity: number
  image_url: string | null
}

export type StoreOrder = {
  id: string
  customer_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  delivery_address: string | null
  notes: string | null
  status: string
  total_price: number
  total_items: number
  delivery_method: string
  payment_method: string
  installments: number
  delivery_lat: number | null
  delivery_lng: number | null
  shipping_cost: number | null
  shipping_zone_name: string | null
  shipping_zip: string | null
  created_at: string
  updated_at: string
  store_order_items: StoreOrderItem[]
}

export async function getStoreOrders(page = 1, limit = 20) {
  const supabase = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { count, error: countError } = await supabase
    .from('store_orders')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('store_orders')
    .select(`
      *,
      store_order_items (
        id,
        name,
        sku,
        color_name,
        size,
        price,
        quantity,
        image_url
      )
    `)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (countError?.code === '42P01' || error?.code === '42P01') {
    return {
      orders: [],
      total: 0,
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error || !data) {
    return {
      orders: [],
      total: 0,
      setupRequired: false,
      errorMessage: error?.message ?? 'Nao foi possivel carregar os pedidos.',
    }
  }

  return {
    orders: ((data as StoreOrder[]) ?? []).map((order) => ({
      ...order,
      store_order_items: order.store_order_items ?? [],
    })),
    total: count ?? 0,
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getRecentOrderSignals(limit = 20) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('store_orders')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map((order) => ({
    id: order.id,
    createdAt: order.created_at,
  }))
}

export async function getStoreOrderById(orderId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('store_orders')
    .select(`
      *,
      store_order_items (
        id,
        name,
        sku,
        color_name,
        size,
        price,
        quantity,
        image_url
      )
    `)
    .eq('id', orderId)
    .maybeSingle()

  if (error?.code === '42P01') {
    return {
      order: null,
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error) {
    return {
      order: null,
      setupRequired: false,
      errorMessage: error.message ?? 'Nao foi possivel carregar o pedido.',
    }
  }

  if (!data) {
    return {
      order: null,
      setupRequired: false,
      errorMessage: null,
    }
  }

  return {
    order: {
      ...(data as StoreOrder),
      store_order_items: (data as StoreOrder).store_order_items ?? [],
    },
    setupRequired: false,
    errorMessage: null,
  }
}
