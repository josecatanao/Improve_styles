'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/permissions-server'

async function requireDashboardUser() {
  await requirePermission('settings:manage')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user: user! }
}

function revalidateCouponSurfaces() {
  revalidatePath('/dashboard/cupons')
}

function parseCsvValues(raw: FormDataEntryValue | null) {
  return (raw?.toString() || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

async function replaceCouponScopes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  couponId: string,
  productIds: string[],
  categories: string[]
) {
  const { error: productDeleteError } = await supabase.from('coupon_products').delete().eq('coupon_id', couponId)
  if (productDeleteError) throw new Error('Falha ao atualizar os produtos vinculados ao cupom.')

  if (productIds.length > 0) {
    const { error: productInsertError } = await supabase.from('coupon_products').insert(
      productIds.map((pid) => ({ coupon_id: couponId, product_id: pid }))
    )
    if (productInsertError) throw new Error('Falha ao salvar os produtos vinculados ao cupom.')
  }

  const { error: categoryDeleteError } = await supabase.from('coupon_categories').delete().eq('coupon_id', couponId)
  if (categoryDeleteError) throw new Error('Falha ao atualizar as categorias vinculadas ao cupom.')

  if (categories.length > 0) {
    const { error: categoryInsertError } = await supabase.from('coupon_categories').insert(
      categories.map((category) => ({ coupon_id: couponId, category }))
    )
    if (categoryInsertError) throw new Error('Falha ao salvar as categorias vinculadas ao cupom.')
  }
}

export async function createCoupon(formData: FormData) {
  const code = formData.get('code')?.toString().trim().toUpperCase()
  const description = formData.get('description')?.toString().trim() || null
  const discountType = formData.get('discount_type')?.toString()
  const discountValue = parseFloat(formData.get('discount_value')?.toString() || '0')
  const minOrderValue = parseFloat(formData.get('min_order_value')?.toString() || '0')
  const maxUsesRaw = formData.get('max_uses')?.toString()
  const expiresAtRaw = formData.get('expires_at')?.toString() || null

  if (!code) throw new Error('Informe o codigo do cupom.')
  if (!discountType || !['percentage', 'fixed', 'free_shipping'].includes(discountType)) throw new Error('Tipo de desconto invalido.')
  if (discountType !== 'free_shipping' && (isNaN(discountValue) || discountValue <= 0)) throw new Error('Valor do desconto deve ser maior que zero.')
  if (discountType === 'percentage' && discountValue > 100) throw new Error('Percentual de desconto nao pode exceder 100%.')

  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null
  if (maxUses !== null && (isNaN(maxUses) || maxUses < 1)) throw new Error('Limite de usos invalido.')
  if (isNaN(minOrderValue) || minOrderValue < 0) throw new Error('Valor minimo do pedido invalido.')

  const { supabase } = await requireDashboardUser()
  const productIds = parseCsvValues(formData.get('product_ids'))
  const categories = parseCsvValues(formData.get('categories'))

  const insertPayload: Record<string, unknown> = {
    code,
    description,
    discount_type: discountType,
    discount_value: discountType === 'free_shipping' ? 0 : discountValue,
    min_order_value: minOrderValue || 0,
    max_uses: maxUses,
    current_uses: 0,
    is_active: true,
    expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
  }

  const { data, error } = await supabase
    .from('store_coupons')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ja existe um cupom com esse codigo.')
    throw new Error(error.message)
  }

  if (data) {
    await replaceCouponScopes(supabase, data.id, productIds, categories)
  }

  revalidateCouponSurfaces()
  return data
}

export async function updateCoupon(formData: FormData) {
  const id = formData.get('id')?.toString()
  const code = formData.get('code')?.toString().trim().toUpperCase()
  const description = formData.get('description')?.toString().trim() || null
  const discountType = formData.get('discount_type')?.toString()
  const discountValue = parseFloat(formData.get('discount_value')?.toString() || '0')
  const minOrderValue = parseFloat(formData.get('min_order_value')?.toString() || '0')
  const maxUsesRaw = formData.get('max_uses')?.toString()
  const expiresAtRaw = formData.get('expires_at')?.toString() || null

  if (!id) throw new Error('ID do cupom nao informado.')
  if (!code) throw new Error('Informe o codigo do cupom.')
  if (!discountType || !['percentage', 'fixed', 'free_shipping'].includes(discountType)) throw new Error('Tipo de desconto invalido.')
  if (discountType !== 'free_shipping' && (isNaN(discountValue) || discountValue <= 0)) throw new Error('Valor do desconto deve ser maior que zero.')
  if (discountType === 'percentage' && discountValue > 100) throw new Error('Percentual de desconto nao pode exceder 100%.')

  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null
  if (maxUses !== null && (isNaN(maxUses) || maxUses < 1)) throw new Error('Limite de usos invalido.')
  if (isNaN(minOrderValue) || minOrderValue < 0) throw new Error('Valor minimo do pedido invalido.')

  const { supabase } = await requireDashboardUser()
  const productIds = parseCsvValues(formData.get('product_ids'))
  const categories = parseCsvValues(formData.get('categories'))

  const updatePayload: Record<string, unknown> = {
    code,
    description,
    discount_type: discountType,
    discount_value: discountType === 'free_shipping' ? 0 : discountValue,
    min_order_value: minOrderValue || 0,
    max_uses: maxUses,
    expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
  }

  const { data, error } = await supabase
    .from('store_coupons')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ja existe um cupom com esse codigo.')
    throw new Error(error.message)
  }

  if (data) {
    await replaceCouponScopes(supabase, data.id, productIds, categories)
  }

  revalidateCouponSurfaces()
  return data
}

export async function toggleCoupon(couponId: string, isActive: boolean) {
  const { supabase } = await requireDashboardUser()

  const { data, error } = await supabase
    .from('store_coupons')
    .update({ is_active: isActive })
    .eq('id', couponId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  revalidateCouponSurfaces()
  return data
}

export async function deleteCoupon(couponId: string) {
  const { supabase } = await requireDashboardUser()

  const { error } = await supabase
    .from('store_coupons')
    .delete()
    .eq('id', couponId)

  if (error) throw new Error(error.message)

  revalidateCouponSurfaces()
  return { success: true }
}

export async function getCouponDetails(couponId: string) {
  const { supabase } = await requireDashboardUser()

  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from('coupon_products').select('product_id').eq('coupon_id', couponId),
    supabase.from('coupon_categories').select('category').eq('coupon_id', couponId),
  ])

  const productIds: string[] = (productsRes.data || []).map((row: { product_id: string }) => row.product_id)
  const categories: string[] = (categoriesRes.data || []).map((row: { category: string }) => row.category)

  return { productIds, categories }
}

export async function getProductsForCoupon(productIds: string[]) {
  const { supabase } = await requireDashboardUser()

  if (productIds.length === 0) return []

  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .in('id', productIds)
    .order('name')

  if (error) throw new Error('Falha ao carregar os produtos vinculados ao cupom.')

  return (data || []) as Array<{ id: string; name: string }>
}

export async function searchProductsForCoupon(query: string) {
  const { supabase } = await requireDashboardUser()

  const { data } = await supabase
    .from('products')
    .select('id, name')
    .eq('status', 'active')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20)

  return (data || []) as Array<{ id: string; name: string }>
}

export async function searchCategoriesForCoupon() {
  const { supabase } = await requireDashboardUser()

  const { data } = await supabase
    .from('store_categories')
    .select('name')
    .eq('is_active', true)
    .order('name')

  const storedCategories = (data || []) as Array<{ name: string }>

  const { data: productCategories } = await supabase
    .from('products')
    .select('category')
    .eq('status', 'active')
    .not('category', 'is', null)

  const uniqueCategories = new Set<string>()
  for (const item of storedCategories) uniqueCategories.add(item.name)
  for (const item of (productCategories || [])) {
    if (item.category) uniqueCategories.add(item.category.trim())
  }

  return Array.from(uniqueCategories).sort()
}
