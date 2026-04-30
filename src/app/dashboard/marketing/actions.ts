'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { refresh, revalidatePath, revalidateTag } from 'next/cache'

function isMissingRelationError(error: { code?: string; message: string } | null) {
  if (!error) return false

  return (
    error.code === 'PGRST205' ||
    error.code === 'PGRST204' ||
    error.message.includes("Could not find the table 'public.store_") ||
    error.message.includes("Could not find the 'announcement_background_color' column")
  )
}

function ensureSuccess(error: { message: string } | null, fallbackMessage: string) {
  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error('Estrutura de marketing nao encontrada no banco. Execute o SQL `supabase/04_marketing_and_reviews.sql` no Supabase.')
    }

    throw new Error(`${fallbackMessage}: ${error.message}`)
  }
}

function normalizeAnnouncementColor(color: string) {
  const normalized = color.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized
  }

  return '#3483fa'
}

export async function saveStoreSettings(
  layout: string[],
  annActive: boolean,
  annText: string,
  annLink: string,
  annBackgroundColor: string
) {
  const supabase = createAdminClient()
  const normalizedAnnouncementColor = normalizeAnnouncementColor(annBackgroundColor)

  // Ensure there's only one row. So we always update the single row or insert if it doesn't exist
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
        homepage_layout: layout,
        announcement_active: annActive,
        announcement_text: annText || null,
        announcement_link: annLink || null,
        announcement_background_color: normalizedAnnouncementColor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    ensureSuccess(error, 'Erro ao atualizar configuracoes da loja')
  } else {
    const { error } = await supabase.from('store_settings').insert({
      homepage_layout: layout,
      announcement_active: annActive,
      announcement_text: annText || null,
      announcement_link: annLink || null,
      announcement_background_color: normalizedAnnouncementColor,
    })
    ensureSuccess(error, 'Erro ao criar configuracoes da loja')
  }

  revalidatePath('/')
  revalidatePath('/dashboard/marketing')
  revalidateTag('store-branding', 'max')
  refresh()
  return { success: true }
}

export async function uploadStoreBannerAction(formData: FormData) {
  const file = formData.get('file') as File
  const orderIndex = Number(formData.get('orderIndex') || 0)
  
  if (!file) throw new Error('File is missing')
  
  const supabase = createAdminClient()
  
  // Create bucket if it doesn't exist
  await supabase.storage.createBucket('public_assets', { public: true }).catch(() => {})

  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `banners/${fileName}`

  const { error } = await supabase.storage
    .from('public_assets')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    })

  if (error) {
    throw new Error('Erro no upload: ' + error.message)
  }

  const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath)

  const { data: banner, error: insertError } = await supabase.from('store_banners').insert({
    image_url: data.publicUrl,
    link_url: null,
    order_index: orderIndex,
    is_active: true
  }).select('*').single()
  ensureSuccess(insertError, 'Erro ao salvar banner no banco')

  revalidatePath('/')
  revalidatePath('/dashboard/marketing')
  refresh()
  return { success: true, banner }
}

export async function addStoreBanner(imageUrl: string, linkUrl: string, orderIndex: number) {
  const supabase = createAdminClient()
  const { data: banner, error } = await supabase.from('store_banners').insert({
    image_url: imageUrl,
    link_url: linkUrl || null,
    order_index: orderIndex,
    is_active: true
  }).select('*').single()
  ensureSuccess(error, 'Erro ao adicionar banner')
  revalidatePath('/')
  revalidatePath('/dashboard/marketing')
  refresh()
  return { success: true, banner }
}

export async function removeStoreBanner(bannerId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('store_banners').delete().eq('id', bannerId)
  ensureSuccess(error, 'Erro ao remover banner')
  revalidatePath('/')
  revalidatePath('/dashboard/marketing')
  refresh()
  return { success: true }
}

export async function toggleStoreBanner(bannerId: string, isActive: boolean) {
  const supabase = createAdminClient()
  const { data: banner, error } = await supabase
    .from('store_banners')
    .update({ is_active: isActive })
    .eq('id', bannerId)
    .select('*')
    .single()
  ensureSuccess(error, 'Erro ao atualizar banner')
  revalidatePath('/')
  revalidatePath('/dashboard/marketing')
  refresh()
  return { success: true, banner }
}

export async function updateStoreBannerLink(bannerId: string, linkUrl: string) {
  const supabase = createAdminClient()
  const sanitizedLink = linkUrl.trim()

  const { data: banner, error } = await supabase
    .from('store_banners')
    .update({ link_url: sanitizedLink || null })
    .eq('id', bannerId)
    .select('*')
    .single()

  ensureSuccess(error, 'Erro ao atualizar link do banner')
  revalidatePath('/')
  revalidatePath('/dashboard/marketing')
  refresh()
  return { success: true, banner }
}

export async function reorderStoreBanners(orderedIds: string[]) {
  const supabase = createAdminClient()

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('store_banners').update({ order_index: index }).eq('id', id)
    )
  )

  revalidatePath('/')
  revalidatePath('/dashboard/marketing')
  refresh()
  return { success: true }
}
