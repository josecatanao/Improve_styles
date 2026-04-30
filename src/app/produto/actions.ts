'use server'

import { createClient } from '@/utils/supabase/server'

type ShippingResult = {
  local: {
    price: number
    days: number
    zoneName: string
    freeShippingThreshold: number | null
  } | null
  correios: {
    pac: { price: number; minDays: number; maxDays: number }
    sedex: { price: number; minDays: number; maxDays: number }
  } | null
  error: string | null
}

function calculateCorreiosShipping(productWeight: number | null) {
  const weight = productWeight && productWeight > 0 ? productWeight : 0.3

  let pacPrice: number
  let sedexPrice: number

  if (weight <= 0.3) {
    pacPrice = 15
    sedexPrice = 25
  } else if (weight <= 1) {
    pacPrice = 20
    sedexPrice = 30
  } else if (weight <= 5) {
    pacPrice = 30
    sedexPrice = 45
  } else if (weight <= 10) {
    pacPrice = 45
    sedexPrice = 65
  } else {
    pacPrice = 60
    sedexPrice = 90
  }

  return {
    pac: { price: pacPrice, minDays: 7, maxDays: 15 },
    sedex: { price: sedexPrice, minDays: 2, maxDays: 5 },
  }
}

export async function calculateProductShipping(
  cep: string,
  productWeight?: number | null,
  productDimensions?: { width: number; height: number; length: number } | null,
): Promise<ShippingResult> {
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    return { local: null, correios: null, error: 'CEP inválido' }
  }

  const supabase = await createClient()

  let localResult: ShippingResult['local'] = null
  let correiosResult: ShippingResult['correios'] = null

  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('base_price, estimated_days, free_shipping_threshold, name')
      .eq('is_active', true)
      .lte('zip_code_start', cleanCep)
      .gte('zip_code_end', cleanCep)
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        correiosResult = calculateCorreiosShipping(productWeight ?? null)
        return { local: null, correios: correiosResult, error: null }
      }
      correiosResult = calculateCorreiosShipping(productWeight ?? null)
      return { local: null, correios: correiosResult, error: null }
    }

    if (data) {
      localResult = {
        price: data.base_price,
        days: data.estimated_days,
        zoneName: data.name,
        freeShippingThreshold: data.free_shipping_threshold,
      }
    } else {
      correiosResult = calculateCorreiosShipping(productWeight ?? null)
    }

    return { local: localResult, correios: correiosResult, error: null }
  } catch {
    correiosResult = calculateCorreiosShipping(productWeight ?? null)
    return { local: null, correios: correiosResult, error: null }
  }
}
