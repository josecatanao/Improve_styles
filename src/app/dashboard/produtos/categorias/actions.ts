'use server'

import { refresh, revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { getStoreCategoryKey, normalizeStoreCategoryLabel } from '@/lib/storefront'
import { requirePermission } from '@/lib/permissions-server'

type CategoryInput = {
  name: string
  iconName?: string | null
  imageUrl?: string | null
}

function normalizeCategoryName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Informe o nome da categoria.')
  }

  return normalizeStoreCategoryLabel(trimmed)
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

async function requireDashboardUser() {
  await requirePermission('products:manage')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user: user! }
}

function revalidateCategorySurfaces() {
  revalidatePath('/')
  revalidatePath('/dashboard/produtos/categorias')
  revalidatePath('/dashboard/produtos/novo')
  revalidatePath('/dashboard/produtos')
  refresh()
}

export async function createStoreCategory(input: CategoryInput) {
  const normalizedName = normalizeCategoryName(input.name)
  const iconName = normalizeOptionalText(input.iconName)
  const imageUrl = normalizeOptionalText(input.imageUrl)
  const { supabase, user } = await requireDashboardUser()

  const { data: currentRows } = await supabase
    .from('store_categories')
    .select('sort_order')
    .eq('owner_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = Number(currentRows?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('store_categories')
    .insert({
      owner_id: user.id,
      name: normalizedName,
      slug: getStoreCategoryKey(normalizedName),
      sort_order: nextSortOrder,
      is_active: true,
      icon_name: iconName,
      image_url: imageUrl,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidateCategorySurfaces()
  return data
}

export async function updateStoreCategory(categoryId: string, input: CategoryInput) {
  const normalizedName = normalizeCategoryName(input.name)
  const iconName = normalizeOptionalText(input.iconName)
  const imageUrl = normalizeOptionalText(input.imageUrl)
  const { supabase, user } = await requireDashboardUser()

  const { data: existing, error: existingError } = await supabase
    .from('store_categories')
    .select('id, name')
    .eq('id', categoryId)
    .eq('owner_id', user.id)
    .single()

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? 'Categoria nao encontrada.')
  }

  const previousName = existing.name

  const { data, error } = await supabase
    .from('store_categories')
    .update({
      name: normalizedName,
      slug: getStoreCategoryKey(normalizedName),
      icon_name: iconName,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)
    .eq('owner_id', user.id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (previousName.trim() !== normalizedName.trim()) {
    const { error: productsError } = await supabase
      .from('products')
      .update({ category: normalizedName })
      .eq('owner_id', user.id)
      .eq('category', previousName)

    if (productsError) {
      throw new Error(productsError.message)
    }
  }

  revalidateCategorySurfaces()
  return data
}

export async function toggleStoreCategory(categoryId: string, isActive: boolean) {
  const { supabase, user } = await requireDashboardUser()
  const { data, error } = await supabase
    .from('store_categories')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)
    .eq('owner_id', user.id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidateCategorySurfaces()
  return data
}

export async function moveStoreCategory(categoryId: string, direction: 'up' | 'down') {
  const { supabase, user } = await requireDashboardUser()
  const { data: categories, error } = await supabase
    .from('store_categories')
    .select('id, sort_order')
    .eq('owner_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !categories) {
    throw new Error(error?.message ?? 'Nao foi possivel reordenar as categorias.')
  }

  const currentIndex = categories.findIndex((category) => category.id === categoryId)
  if (currentIndex === -1) {
    throw new Error('Categoria nao encontrada.')
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= categories.length) {
    return { success: true }
  }

  const current = categories[currentIndex]
  const target = categories[targetIndex]

  const { error: currentError } = await supabase
    .from('store_categories')
    .update({ sort_order: target.sort_order, updated_at: new Date().toISOString() })
    .eq('id', current.id)
    .eq('owner_id', user.id)

  if (currentError) {
    throw new Error(currentError.message)
  }

  const { error: targetError } = await supabase
    .from('store_categories')
    .update({ sort_order: current.sort_order, updated_at: new Date().toISOString() })
    .eq('id', target.id)
    .eq('owner_id', user.id)

  if (targetError) {
    throw new Error(targetError.message)
  }

  revalidateCategorySurfaces()
  return { success: true }
}

export async function removeStoreCategory(categoryId: string) {
  const { supabase, user } = await requireDashboardUser()
  const { data: existing, error: existingError } = await supabase
    .from('store_categories')
    .select('name')
    .eq('id', categoryId)
    .eq('owner_id', user.id)
    .single()

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? 'Categoria nao encontrada.')
  }

  const { error } = await supabase
    .from('store_categories')
    .delete()
    .eq('id', categoryId)
    .eq('owner_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  const { error: productsError } = await supabase
    .from('products')
    .update({ category: null })
    .eq('owner_id', user.id)
    .eq('category', existing.name)

  if (productsError) {
    throw new Error(productsError.message)
  }

  revalidateCategorySurfaces()
  return { success: true }
}

export async function reorderStoreCategories(categoryIds: string[]) {
  const { supabase, user } = await requireDashboardUser()

  await Promise.all(
    categoryIds.map((id, index) =>
      supabase
        .from('store_categories')
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('owner_id', user.id)
    )
  )

  revalidateCategorySurfaces()
  return { success: true }
}

export async function uploadStoreCategoryImageAction(formData: FormData) {
  const file = formData.get('file')

  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Selecione uma imagem valida para a categoria.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('A imagem da categoria precisa ser um arquivo de imagem.')
  }

  const supabase = createAdminClient()

  await supabase.storage.createBucket('public_assets', { public: true }).catch(() => {})

  const fileExt = file.name.split('.').pop() || 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `store-categories/${fileName}`

  const { error } = await supabase.storage.from('public_assets').upload(filePath, file, {
    contentType: file.type,
    upsert: true,
  })

  if (error) {
    throw new Error(`Falha no upload da imagem da categoria: ${error.message}`)
  }

  const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath)
  return { success: true, publicUrl: data.publicUrl }
}
