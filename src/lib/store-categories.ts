import { createClient } from '@/utils/supabase/server'
import { getStoreCategoryKey, normalizeStoreCategoryLabel } from '@/lib/storefront'

export type StoreCategory = {
  id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
  icon_name?: string | null
  image_url?: string | null
}

function isMissingTable(error: { code?: string } | null) {
  return error?.code === '42P01'
}

function buildCategoryName(value: string | null | undefined) {
  return normalizeStoreCategoryLabel(value)
}

function buildCategorySlug(value: string | null | undefined) {
  return getStoreCategoryKey(value)
}

export async function getManagedStoreCategories(page = 1, limit = 50): Promise<{
  categories: StoreCategory[]
  total: number
  setupRequired: boolean
  errorMessage: string | null
}> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { count, error: countError } = await supabase
    .from('store_categories')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('store_categories')
    .select('id, name, slug, sort_order, is_active, icon_name, image_url')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(from, to)

  if (isMissingTable(error) || isMissingTable(countError)) {
    return {
      categories: [],
      total: 0,
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error || !data) {
    return {
      categories: [],
      total: 0,
      setupRequired: false,
      errorMessage: error?.message ?? 'Nao foi possivel carregar as categorias.',
    }
  }

  return {
    categories: (data as StoreCategory[]).map((category) => ({
      ...category,
      name: buildCategoryName(category.name),
      slug: category.slug?.trim() || buildCategorySlug(category.name),
    })),
    total: count ?? 0,
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getStorefrontCategories(): Promise<{
  categories: StoreCategory[]
  source: 'managed' | 'fallback'
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_categories')
    .select('id, name, slug, sort_order, is_active, icon_name, image_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!error && data) {
    return {
      categories: (data as StoreCategory[]).map((category) => ({
        ...category,
        name: buildCategoryName(category.name),
        slug: category.slug?.trim() || buildCategorySlug(category.name),
      })),
      source: 'managed',
    }
  }

  if (!isMissingTable(error)) {
    return {
      categories: [],
      source: 'managed',
    }
  }

  const { data: productRows, error: productError } = await supabase
    .from('products')
    .select('category')
    .eq('status', 'active')
    .eq('is_active', true)

  if (isMissingTable(productError) || productError || !productRows) {
    return {
      categories: [],
      source: 'fallback',
    }
  }

  return {
    categories: Array.from(
      new Map(
        productRows
          .map((item) => item.category?.trim())
          .filter((value): value is string => Boolean(value))
          .map((value, index) => [
            buildCategorySlug(value),
            {
              id: `fallback-${index}`,
              name: buildCategoryName(value),
              slug: buildCategorySlug(value),
              sort_order: index,
              is_active: true,
              icon_name: null,
              image_url: null,
            },
          ])
      ).values()
    ),
    source: 'fallback',
  }
}
