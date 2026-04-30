import { createAdminClient } from '@/utils/supabase/admin'

export type ShippingZone = {
  id: string
  name: string
  zip_code_start: string
  zip_code_end: string
  base_price: number
  price_per_km: number | null
  free_shipping_threshold: number | null
  estimated_days: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export async function getShippingZones(): Promise<{
  zones: ShippingZone[]
  setupRequired: boolean
  errorMessage: string | null
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('shipping_zones')
    .select('*')
    .order('zip_code_start', { ascending: true })

  if (error?.code === '42P01') {
    return { zones: [], setupRequired: true, errorMessage: null }
  }

  if (error || !data) {
    return {
      zones: [],
      setupRequired: false,
      errorMessage: error?.message ?? 'Nao foi possivel carregar as zonas de entrega.',
    }
  }

  return { zones: data as ShippingZone[], setupRequired: false, errorMessage: null }
}
