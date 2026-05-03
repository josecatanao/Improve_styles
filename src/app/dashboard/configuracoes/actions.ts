'use server'

import { refresh, revalidatePath, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import type { DashboardTheme, HeaderNavigation } from '@/lib/store-settings'
import {
  isMissingStoreSettingsColumnError,
  normalizeDashboardTheme,
  normalizeHexColor,
} from '@/lib/store-settings'

function ensureSuccess(error: { message: string } | null, fallbackMessage: string) {
  if (error) {
    if (isMissingStoreSettingsColumnError(error)) {
      throw new Error('Estrutura de configuracoes da loja incompleta no banco. Execute novamente o SQL `supabase/04_marketing_and_reviews.sql` no Supabase.')
    }

    throw new Error(`${fallbackMessage}: ${error.message}`)
  }
}

export async function saveStoreAppearance(input: {
  storeName: string
  storeLogoUrl: string
  storeWhatsapp: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  storeHeaderBackgroundColor: string
  storeButtonBackgroundColor: string
  storeCardBackgroundColor: string
  storeCardBorderColor: string
  storeCartButtonColor: string
  dashboardTheme: DashboardTheme
}) {
  const supabase = createAdminClient()
  const storeName = input.storeName.trim() || 'Improve Styles'
  const storeLogoUrl = input.storeLogoUrl.trim() || null
  const storeWhatsapp = input.storeWhatsapp.trim()
  const brandPrimaryColor = normalizeHexColor(input.brandPrimaryColor, '#0f172a')
  const brandSecondaryColor = normalizeHexColor(input.brandSecondaryColor, '#e2e8f0')
  const storeHeaderBackgroundColor = normalizeHexColor(input.storeHeaderBackgroundColor, '#ffffff')
  const storeButtonBackgroundColor = normalizeHexColor(input.storeButtonBackgroundColor, '#ffffff')
  const storeCardBackgroundColor = normalizeHexColor(input.storeCardBackgroundColor, '#ffffff')
  const storeCardBorderColor = normalizeHexColor(input.storeCardBorderColor, '#e2e8f0')
  const storeCartButtonColor = normalizeHexColor(input.storeCartButtonColor, '#ffffff')
  const dashboardTheme = normalizeDashboardTheme(input.dashboardTheme)

  const { data: existing, error: existingError } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .maybeSingle()
  ensureSuccess(existingError, 'Erro ao buscar configuracoes da loja')

  if (existing) {
    const { error } = await supabase
      .from('store_settings')
      .update({
        store_name: storeName,
        store_logo_url: storeLogoUrl,
        store_whatsapp: storeWhatsapp || null,
        brand_primary_color: brandPrimaryColor,
        brand_secondary_color: brandSecondaryColor,
        store_header_background_color: storeHeaderBackgroundColor,
        store_button_background_color: storeButtonBackgroundColor,
        store_card_background_color: storeCardBackgroundColor,
        store_card_border_color: storeCardBorderColor,
        store_cart_button_color: storeCartButtonColor,
        dashboard_theme: dashboardTheme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    ensureSuccess(error, 'Erro ao atualizar configuracoes visuais da loja')
  } else {
    const { error } = await supabase.from('store_settings').insert({
      store_name: storeName,
      store_logo_url: storeLogoUrl,
      store_whatsapp: storeWhatsapp || null,
      brand_primary_color: brandPrimaryColor,
      brand_secondary_color: brandSecondaryColor,
      store_header_background_color: storeHeaderBackgroundColor,
      store_button_background_color: storeButtonBackgroundColor,
      store_card_background_color: storeCardBackgroundColor,
      store_card_border_color: storeCardBorderColor,
      store_cart_button_color: storeCartButtonColor,
      dashboard_theme: dashboardTheme,
    })
    ensureSuccess(error, 'Erro ao criar configuracoes visuais da loja')
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/configuracoes', 'layout')
  revalidatePath('/dashboard/configuracoes/loja')
  revalidateTag('store-branding', 'max')
  refresh()
  return { success: true }
}

export async function saveDashboardAppearance(input: {
  dashboardTheme: DashboardTheme
  brandPrimaryColor: string
  brandSecondaryColor: string
}) {
  const supabase = createAdminClient()
  const dashboardTheme = normalizeDashboardTheme(input.dashboardTheme)
  const brandPrimaryColor = normalizeHexColor(input.brandPrimaryColor, '#0f172a')
  const brandSecondaryColor = normalizeHexColor(input.brandSecondaryColor, '#e2e8f0')

  const { data: existing, error: existingError } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .maybeSingle()
  ensureSuccess(existingError, 'Erro ao buscar configuracoes do dashboard')

  if (existing) {
    const { error } = await supabase
      .from('store_settings')
      .update({
        dashboard_theme: dashboardTheme,
        brand_primary_color: brandPrimaryColor,
        brand_secondary_color: brandSecondaryColor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    ensureSuccess(error, 'Erro ao atualizar configuracoes do dashboard')
  } else {
    const { error } = await supabase.from('store_settings').insert({
      dashboard_theme: dashboardTheme,
      brand_primary_color: brandPrimaryColor,
      brand_secondary_color: brandSecondaryColor,
    })
    ensureSuccess(error, 'Erro ao criar configuracoes do dashboard')
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/configuracoes', 'layout')
  revalidatePath('/dashboard/configuracoes/dashboard')
  revalidateTag('store-branding', 'max')
  refresh()
  return { success: true }
}

export async function saveDeliverySettings(input: {
  deliveryEnabled: boolean
  pickupEnabled: boolean
  storeAddress: string
  storeAddressLat: number | null
  storeAddressLng: number | null
}) {
  const supabase = createAdminClient()

  const { data: existing, error: existingError } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .maybeSingle()
  ensureSuccess(existingError, 'Erro ao buscar configuracoes da loja')

  if (existing) {
    const { error } = await supabase
      .from('store_settings')
      .update({
        delivery_enabled: input.deliveryEnabled,
        pickup_enabled: input.pickupEnabled,
        store_address: input.storeAddress.trim() || null,
        store_address_lat: input.storeAddressLat,
        store_address_lng: input.storeAddressLng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    ensureSuccess(error, 'Erro ao atualizar configuracoes de entrega')
  } else {
    const { error } = await supabase.from('store_settings').insert({
      delivery_enabled: input.deliveryEnabled,
      pickup_enabled: input.pickupEnabled,
      store_address: input.storeAddress.trim() || null,
      store_address_lat: input.storeAddressLat,
      store_address_lng: input.storeAddressLng,
    })
    ensureSuccess(error, 'Erro ao criar configuracoes de entrega')
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/configuracoes', 'layout')
  revalidatePath('/dashboard/configuracoes/entrega')
  revalidatePath('/checkout')
  revalidateTag('store-branding', 'max')
  refresh()
  return { success: true }
}

export async function saveHeaderNavigation(input: HeaderNavigation) {
  const supabase = createAdminClient()

  const { data: existing, error: existingError } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .maybeSingle()
  ensureSuccess(existingError, 'Erro ao buscar configuracoes da loja')

  if (existing) {
    const { error } = await supabase
      .from('store_settings')
      .update({
        header_navigation: input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    ensureSuccess(error, 'Erro ao atualizar navegacao do header')
  } else {
    const { error } = await supabase.from('store_settings').insert({
      header_navigation: input,
    })
    ensureSuccess(error, 'Erro ao criar navegacao do header')
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/configuracoes', 'layout')
  revalidatePath('/dashboard/configuracoes/loja')
  revalidateTag('store-branding', 'max')
  refresh()
  return { success: true }
}

export async function uploadStoreLogoAction(formData: FormData) {
  const file = formData.get('file')

  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Selecione uma imagem valida para a logo.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('A logo da loja precisa ser uma imagem.')
  }

  const supabase = createAdminClient()

  await supabase.storage.createBucket('public_assets', { public: true }).catch(() => {})

  const fileExt = file.name.split('.').pop() || 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `store-branding/${fileName}`

  const { error } = await supabase.storage.from('public_assets').upload(filePath, file, {
    contentType: file.type,
    upsert: true,
  })

  if (error) {
    throw new Error(`Falha no upload da logo: ${error.message}`)
  }

  const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath)
  return { success: true, publicUrl: data.publicUrl }
}
