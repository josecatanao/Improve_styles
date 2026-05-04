import type { ProductListItem } from '@/lib/product-shared'
import { STORE_COPY } from '@/lib/store-copy'

export type CommercialBadgeStyle =
  | 'discount'
  | 'new'
  | 'bestseller'
  | 'last-units'
  | 'custom'

export type CommercialBadge = {
  label: string
  style: CommercialBadgeStyle
}

export function getProductCommercialBadge(
  product: ProductListItem,
): CommercialBadge | null {
  if (product.is_promotion) {
    return { label: STORE_COPY.badgePromo, style: 'discount' }
  }

  if (product.is_new) {
    return { label: STORE_COPY.badgeNew, style: 'new' }
  }

  if (product.is_featured || Number(product.sales_count ?? 0) > 10) {
    return { label: STORE_COPY.badgeBestSeller, style: 'bestseller' }
  }

  return null
}

export function getProductBadgeLabel(
  product: ProductListItem,
  customBadge: string | null,
): string | null {
  const commercial = getProductCommercialBadge(product)
  if (commercial) return commercial.label

  if (customBadge === 'Novo') return STORE_COPY.badgeNew
  if (customBadge === 'Destaque') return STORE_COPY.badgeBestSeller

  return customBadge
}

export function getStockBadgeLabel(stock: number): string | null {
  if (stock <= 0) return null
  if (stock <= 3) return STORE_COPY.stockLastUnits(stock)
  return null
}

export function getBadgeStyleClass(style: CommercialBadgeStyle): string {
  switch (style) {
    case 'discount':
      return 'bg-gradient-to-r from-[#ff5a52] to-[#ff3d2e] text-white'
    case 'new':
      return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
    case 'bestseller':
      return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
    case 'last-units':
      return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
    default:
      return 'bg-slate-900 text-white'
  }
}

export function getCheckoutStepLabel(step: 'form' | 'review'): string {
  return step === 'form'
    ? STORE_COPY.checkoutStepForm
    : STORE_COPY.checkoutStepReview
}
