'use server'

import { createClient } from '@/utils/supabase/server'

export type ShippingZone = {
  id: string
  name: string
  zip_code_start: string
  zip_code_end: string
  base_price: number
  free_shipping_threshold: number | null
  estimated_days: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export type ShippingCalculation = {
  local: {
    price: number
    days: number
    zoneName: string
    freeShippingThreshold: number | null
    isFree: boolean
  } | null
  correios: {
    pac: { price: number; minDays: number; maxDays: number }
    sedex: { price: number; minDays: number; maxDays: number }
  } | null
  error: string | null
}

function cleanCep(value: string) {
  return value.replace(/\D/g, '')
}

function calculateCorreiosByWeight(weight: number | null) {
  const w = weight && weight > 0 ? weight : 0.3

  let pac: number
  let sedex: number

  if (w <= 0.3) { pac = 15; sedex = 25 }
  else if (w <= 1) { pac = 20; sedex = 30 }
  else if (w <= 5) { pac = 30; sedex = 45 }
  else if (w <= 10) { pac = 45; sedex = 65 }
  else { pac = 60; sedex = 90 }

  return {
    pac: { price: pac, minDays: 7, maxDays: 15 },
    sedex: { price: sedex, minDays: 2, maxDays: 5 },
  }
}

export async function calculateShipping(
  cep: string,
  options?: {
    productWeight?: number | null
    orderTotal?: number
  }
): Promise<ShippingCalculation> {
  const cleanedCep = cleanCep(cep)
  if (cleanedCep.length !== 8) {
    return { local: null, correios: null, error: 'CEP invalido' }
  }

  const orderTotal = options?.orderTotal ?? 0
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('id, name, base_price, estimated_days, free_shipping_threshold, zip_code_start, zip_code_end')
      .eq('is_active', true)

    if (error) {
      if (error.code === '42P01') {
        return { local: null, correios: calculateCorreiosByWeight(options?.productWeight ?? null), error: null }
      }
      return { local: null, correios: calculateCorreiosByWeight(options?.productWeight ?? null), error: null }
    }

    const zones = data || []

    const matchingZone = zones.find((zone) => {
      const start = cleanCep(zone.zip_code_start)
      const end = cleanCep(zone.zip_code_end)
      return cleanedCep >= start && cleanedCep <= end
    })

    if (matchingZone) {
      const basePrice = Number(matchingZone.base_price)
      const threshold = matchingZone.free_shipping_threshold ? Number(matchingZone.free_shipping_threshold) : null
      const isFree = threshold !== null && orderTotal >= threshold

      return {
        local: {
          price: isFree ? 0 : basePrice,
          days: matchingZone.estimated_days,
          zoneName: matchingZone.name,
          freeShippingThreshold: threshold,
          isFree,
        },
        correios: null,
        error: null,
      }
    }

    return {
      local: null,
      correios: calculateCorreiosByWeight(options?.productWeight ?? null),
      error: null,
    }
  } catch {
    return { local: null, correios: calculateCorreiosByWeight(options?.productWeight ?? null), error: null }
  }
}

export async function getShippingZones(): Promise<{
  zones: ShippingZone[]
  setupRequired: boolean
  errorMessage: string | null
}> {
  const supabase = await createClient()

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

  return {
    zones: (data as ShippingZone[]).map((z) => ({
      ...z,
      base_price: Number(z.base_price),
      free_shipping_threshold: z.free_shipping_threshold ? Number(z.free_shipping_threshold) : null,
      estimated_days: Number(z.estimated_days),
    })),
    setupRequired: false,
    errorMessage: null,
  }
}
