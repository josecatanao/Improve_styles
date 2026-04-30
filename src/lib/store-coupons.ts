import { createClient } from '@/utils/supabase/server'

export type StoreCoupon = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value: number
  max_uses: number | null
  current_uses: number
  is_active: boolean
  starts_at: string
  expires_at: string | null
  created_at: string
  updated_at: string | null
}

function isMissingTable(error: { code?: string } | null) {
  return error?.code === '42P01'
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

export type ValidatedCoupon = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value: number
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
    .select('id, code, discount_type, discount_value, min_order_value, max_uses, current_uses, is_active, expires_at')
    .ilike('code', normalizedCode)
    .single()

  if (error || !data) {
    return { coupon: null, error: 'Cupom nao encontrado.' }
  }

  if (!data.is_active) {
    return { coupon: null, error: 'Este cupom nao esta mais ativo.' }
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { coupon: null, error: 'Este cupom expirou.' }
  }

  if (data.max_uses !== null && data.current_uses >= data.max_uses) {
    return { coupon: null, error: 'Este cupom atingiu o limite de uso.' }
  }

  return {
    coupon: {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_order_value: data.min_order_value,
    },
    error: null,
  }
}

export function computeCouponDiscount(
  totalPrice: number,
  coupon: ValidatedCoupon
): number {
  if (totalPrice < coupon.min_order_value) {
    return 0
  }

  if (coupon.discount_type === 'fixed') {
    return Math.min(coupon.discount_value, totalPrice)
  }

  return Math.round((totalPrice * coupon.discount_value) / 100 * 100) / 100
}
