import { createAdminClient } from '@/utils/supabase/admin'

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
}

export async function getStoreOrders() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('store_orders')
    .select('*')
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
    orders: data as StoreOrder[],
    setupRequired: false,
    errorMessage: null,
  }
}
