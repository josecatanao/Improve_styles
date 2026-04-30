'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createShippingZone(formData: FormData) {
  const supabase = createAdminClient()

  const name = formData.get('name') as string
  const zip_code_start = formData.get('zip_code_start') as string
  const zip_code_end = formData.get('zip_code_end') as string
  const base_price = Number(formData.get('base_price') || 0)
  const price_per_km = formData.get('price_per_km') ? Number(formData.get('price_per_km')) : null
  const free_shipping_threshold = formData.get('free_shipping_threshold') ? Number(formData.get('free_shipping_threshold')) : null
  const estimated_days = Number(formData.get('estimated_days') || 7)

  if (!name?.trim()) throw new Error('Nome da zona e obrigatorio.')
  if (!zip_code_start?.trim()) throw new Error('CEP inicial e obrigatorio.')
  if (!zip_code_end?.trim()) throw new Error('CEP final e obrigatorio.')

  const { error } = await supabase.from('shipping_zones').insert({
    name: name.trim(),
    zip_code_start: zip_code_start.trim(),
    zip_code_end: zip_code_end.trim(),
    base_price,
    price_per_km,
    free_shipping_threshold,
    estimated_days,
    is_active: true,
  })

  if (error) throw new Error('Falha ao criar zona de entrega: ' + error.message)

  revalidatePath('/dashboard/entrega')
  return { success: true }
}

export async function updateShippingZone(zoneId: string, formData: FormData) {
  const supabase = createAdminClient()

  const name = formData.get('name') as string
  const zip_code_start = formData.get('zip_code_start') as string
  const zip_code_end = formData.get('zip_code_end') as string
  const base_price = Number(formData.get('base_price') || 0)
  const price_per_km = formData.get('price_per_km') ? Number(formData.get('price_per_km')) : null
  const free_shipping_threshold = formData.get('free_shipping_threshold') ? Number(formData.get('free_shipping_threshold')) : null
  const estimated_days = Number(formData.get('estimated_days') || 7)

  if (!name?.trim()) throw new Error('Nome da zona e obrigatorio.')
  if (!zip_code_start?.trim()) throw new Error('CEP inicial e obrigatorio.')
  if (!zip_code_end?.trim()) throw new Error('CEP final e obrigatorio.')

  const { error } = await supabase.from('shipping_zones').update({
    name: name.trim(),
    zip_code_start: zip_code_start.trim(),
    zip_code_end: zip_code_end.trim(),
    base_price,
    price_per_km,
    free_shipping_threshold,
    estimated_days,
    updated_at: new Date().toISOString(),
  }).eq('id', zoneId)

  if (error) throw new Error('Falha ao atualizar zona de entrega: ' + error.message)

  revalidatePath('/dashboard/entrega')
  return { success: true }
}

export async function deleteShippingZone(zoneId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('shipping_zones').delete().eq('id', zoneId)

  if (error) throw new Error('Falha ao excluir zona de entrega: ' + error.message)

  revalidatePath('/dashboard/entrega')
  return { success: true }
}

export async function toggleShippingZone(zoneId: string, isActive: boolean) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('shipping_zones').update({
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }).eq('id', zoneId)

  if (error) throw new Error('Falha ao atualizar zona de entrega: ' + error.message)

  revalidatePath('/dashboard/entrega')
  return { success: true }
}
