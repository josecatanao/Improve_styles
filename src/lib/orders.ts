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
  created_at: string
  updated_at: string
  store_order_items: StoreOrderItem[]
}

export async function getStoreOrders() {
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
    .order('created_at', { ascending: false })

  if (error?.code === '42P01') {
    return {
      orders: [],
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error || !data) {
    return {
      orders: [],
      setupRequired: false,
      errorMessage: error?.message ?? 'Nao foi possivel carregar os pedidos.',
    }
  }

  return {
    orders: ((data as StoreOrder[]) ?? []).map((order) => ({
      ...order,
      store_order_items: order.store_order_items ?? [],
    })),
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
