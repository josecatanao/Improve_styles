import { createClient } from '@/utils/supabase/server'
import type { StoreCoupon, ValidatedCoupon } from '@/lib/store-coupons'

function isMissingTable(error: { code?: string } | null) {
  return error?.code === '42P01'
}

function mapValidatedCoupon(
  data: {
    id: string
    code: string
    discount_type: 'percentage' | 'fixed' | 'free_shipping'
    discount_value: number
    min_order_value: number | null
  },
  productIds: string[],
  categories: string[]
): ValidatedCoupon {
  return {
    id: data.id,
    code: data.code,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    min_order_value: data.min_order_value,
    productIds,
    categories,
  }
}

export async function getManagedCoupons(): Promise<{
  coupons: StoreCoupon[]
  setupRequired: boolean
  errorMessage: string | null
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (isMissingTable(error)) {
    return {
      coupons: [],
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error || !data) {
    return {
      coupons: [],
      setupRequired: false,
      errorMessage: error?.message ?? 'Nao foi possivel carregar os cupons.',
    }
  }

  return {
    coupons: data as StoreCoupon[],
    setupRequired: false,
    errorMessage: null,
  }
}

export async function validateCouponOnServer(code: string): Promise<{
  coupon: ValidatedCoupon | null
  error: string | null
}> {
  const supabase = await createClient()
  const normalizedCode = code.trim().toUpperCase()

  if (!normalizedCode) {
    return { coupon: null, error: 'Informe um codigo de cupom.' }
  }

  const { data, error } = await supabase
    .from('store_coupons')
    .select('id, code, discount_type, discount_value, min_order_value, max_uses, current_uses, is_active, starts_at, expires_at')
    .ilike('code', normalizedCode)
    .single()

  if (error || !data) {
    return { coupon: null, error: 'Cupom nao encontrado.' }
  }

  if (!data.is_active) {
    return { coupon: null, error: 'Este cupom nao esta mais ativo.' }
  }

  if (data.starts_at && new Date(data.starts_at) > new Date()) {
    return { coupon: null, error: 'Este cupom ainda nao esta disponivel.' }
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { coupon: null, error: 'Este cupom expirou.' }
  }

  if (data.max_uses !== null && data.current_uses >= data.max_uses) {
    return { coupon: null, error: 'Este cupom atingiu o limite de uso.' }
  }

  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from('coupon_products').select('product_id').eq('coupon_id', data.id),
    supabase.from('coupon_categories').select('category').eq('coupon_id', data.id),
  ])

  if (productsRes.error || categoriesRes.error) {
    return { coupon: null, error: 'Nao foi possivel carregar o escopo deste cupom.' }
  }

  const productIds = (productsRes.data || []).map((p: { product_id: string }) => p.product_id)
  const categories = (categoriesRes.data || []).map((c: { category: string }) => c.category)

  return {
    coupon: mapValidatedCoupon(data, productIds, categories),
    error: null,
  }
}
