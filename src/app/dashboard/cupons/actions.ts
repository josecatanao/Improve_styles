'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function requireDashboardUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata.account_type === 'customer') {
    throw new Error('Usuario sem permissao para gerenciar cupons.')
  }

  return { supabase, user }
}

function revalidateCouponSurfaces() {
  revalidatePath('/dashboard/cupons')
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
  if (!discountType || !['percentage', 'fixed'].includes(discountType)) throw new Error('Tipo de desconto invalido.')
  if (isNaN(discountValue) || discountValue <= 0) throw new Error('Valor do desconto deve ser maior que zero.')
  if (discountType === 'percentage' && discountValue > 100) throw new Error('Percentual de desconto nao pode exceder 100%.')

  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null
  if (maxUses !== null && (isNaN(maxUses) || maxUses < 1)) throw new Error('Limite de usos invalido.')

  const { supabase } = await requireDashboardUser()

  const { data, error } = await supabase
    .from('store_coupons')
    .insert({
      code,
      description,
      discount_type: discountType,
      discount_value: discountValue,
      min_order_value: minOrderValue || 0,
      max_uses: maxUses,
      current_uses: 0,
      is_active: true,
      expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ja existe um cupom com esse codigo.')
    throw new Error(error.message)
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
  if (!discountType || !['percentage', 'fixed'].includes(discountType)) throw new Error('Tipo de desconto invalido.')
  if (isNaN(discountValue) || discountValue <= 0) throw new Error('Valor do desconto deve ser maior que zero.')
  if (discountType === 'percentage' && discountValue > 100) throw new Error('Percentual de desconto nao pode exceder 100%.')

  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null
  if (maxUses !== null && (isNaN(maxUses) || maxUses < 1)) throw new Error('Limite de usos invalido.')

  const { supabase } = await requireDashboardUser()

  const { data, error } = await supabase
    .from('store_coupons')
    .update({
      code,
      description,
      discount_type: discountType,
      discount_value: discountValue,
      min_order_value: minOrderValue || 0,
      max_uses: maxUses,
      expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ja existe um cupom com esse codigo.')
    throw new Error(error.message)
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
