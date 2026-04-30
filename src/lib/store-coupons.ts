export type StoreCoupon = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed' | 'free_shipping'
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

export type ValidatedCoupon = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed' | 'free_shipping'
  discount_value: number
  min_order_value: number | null
  productIds: string[]
  categories: string[]
}

export type CouponScopedItem = {
  productId: string
  productCategory: string | null
  price: number
  quantity: number
}

export function computeCouponDiscount(
  totalPrice: number,
  coupon: ValidatedCoupon
): number {
  if (coupon.discount_type === 'free_shipping') return 0

  if (coupon.min_order_value != null && totalPrice < coupon.min_order_value) {
    return 0
  }

  if (coupon.discount_type === 'fixed') {
    return Math.min(coupon.discount_value, totalPrice)
  }

  return Math.round((totalPrice * coupon.discount_value) / 100 * 100) / 100
}

export function isProductEligibleForCoupon(
  productId: string,
  productCategory: string | null,
  coupon: ValidatedCoupon
): boolean {
  if (coupon.productIds.length === 0 && coupon.categories.length === 0) return true

  if (coupon.productIds.includes(productId)) return true

  if (productCategory && coupon.categories.length > 0) {
    return coupon.categories.some((cat) =>
      productCategory.toLowerCase().includes(cat.toLowerCase())
    )
  }

  return false
}

export function getEligibleCouponItems<T extends CouponScopedItem>(
  items: T[],
  coupon: ValidatedCoupon
): T[] {
  return items.filter((item) =>
    isProductEligibleForCoupon(item.productId, item.productCategory, coupon)
  )
}

export function getEligibleCouponTotal<T extends CouponScopedItem>(
  items: T[],
  coupon: ValidatedCoupon
): number {
  return getEligibleCouponItems(items, coupon).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
}

export function couponMeetsMinimumOrderValue<T extends CouponScopedItem>(
  items: T[],
  coupon: ValidatedCoupon
): boolean {
  if (coupon.min_order_value == null) return true
  return getEligibleCouponTotal(items, coupon) >= coupon.min_order_value
}

export function calculateCouponDiscountFromItems<T extends CouponScopedItem>(
  items: T[],
  coupon: ValidatedCoupon
): number {
  if (coupon.discount_type === 'free_shipping') return 0

  const eligibleItems = getEligibleCouponItems(items, coupon)
  if (eligibleItems.length === 0) return 0

  const eligibleTotal = eligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return computeCouponDiscount(eligibleTotal, coupon)
}
