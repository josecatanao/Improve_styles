'use server'

import { refresh, revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
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
  storeLogoUrl: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  dashboardTheme: string
}) {
  const supabase = createAdminClient()
  const storeLogoUrl = input.storeLogoUrl.trim() || null
  const brandPrimaryColor = normalizeHexColor(input.brandPrimaryColor, '#0f172a')
  const brandSecondaryColor = normalizeHexColor(input.brandSecondaryColor, '#e2e8f0')
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
        store_logo_url: storeLogoUrl,
        brand_primary_color: brandPrimaryColor,
        brand_secondary_color: brandSecondaryColor,
        dashboard_theme: dashboardTheme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    ensureSuccess(error, 'Erro ao atualizar configuracoes visuais da loja')
  } else {
    const { error } = await supabase.from('store_settings').insert({
      store_logo_url: storeLogoUrl,
      brand_primary_color: brandPrimaryColor,
      brand_secondary_color: brandSecondaryColor,
      dashboard_theme: dashboardTheme,
    })
    ensureSuccess(error, 'Erro ao criar configuracoes visuais da loja')
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/configuracoes')
  refresh()
  return { success: true }
}
