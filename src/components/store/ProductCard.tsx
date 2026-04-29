import Link from 'next/link'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import type { ProductListItem } from '@/lib/product-shared'
import { StoreImage } from '@/components/store/StoreImage'
import { formatMoney, getProductDisplayBadge, getProductPrimaryImage, normalizeStoreCategoryLabel } from '@/lib/storefront'

function getBadgeStyles(product: ProductListItem, badge: string | null) {
  if (Number(product.compare_at_price ?? 0) > Number(product.price ?? 0)) {
    return 'bg-gradient-to-r from-[#ff5a52] to-[#ff3d2e] text-white'
  }

  if (product.is_new) {
    return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
  }

  if (product.is_featured || Number(product.sales_count ?? 0) > 10) {
    return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
  }

  if (badge) {
    return 'bg-gradient-to-r from-[#2854ff] to-[#1a39d8] text-white'
  }

  return 'bg-slate-900 text-white'
}

function getBadgeLabel(product: ProductListItem, badge: string | null) {
  const currentPrice = Number(product.price ?? 0)
  const comparePrice = Number(product.compare_at_price ?? 0)

  if (comparePrice > currentPrice && comparePrice > 0) {
    const percent = Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
    return `-${percent}%`
  }

  if (badge === 'Novo') {
    return 'Novo'
  }

  if (badge === 'Destaque' || Number(product.sales_count ?? 0) > 10) {
    return 'Mais vendido'
  }

  return badge
}

function getInstallments(price: number) {
  if (price >= 120) return 6
  if (price >= 80) return 4
  return 5
}

function getShowcaseRating(product: ProductListItem) {
  const salesCount = Number(product.sales_count ?? 0)
  const normalizedCount = salesCount > 0 ? salesCount : product.is_featured ? 64 : product.is_new ? 32 : 18
  const rating = 4.6 + Math.min(0.3, normalizedCount / 1000)

  return {
    rating: rating.toFixed(1).replace('.', ','),
    count: normalizedCount,
  }
}

export function ProductCard({ product }: { product: ProductListItem }) {
  const badge = getProductDisplayBadge(product)
  const image = getProductPrimaryImage(product)
  const hasDiscount = Number(product.compare_at_price ?? 0) > Number(product.price ?? 0)
  const swatches = (product.colors ?? []).slice(0, 4)
  const displayPrice = Number(product.price ?? 0)
  const displayComparePrice = Number(product.compare_at_price ?? 0)
  const installmentCount = getInstallments(displayPrice)
  const rating = getShowcaseRating(product)
  const badgeLabel = getBadgeLabel(product, badge)
  const badgeStyles = getBadgeStyles(product, badge)
  const secondaryLabel = product.category?.trim()
    ? normalizeStoreCategoryLabel(product.category)
    : product.brand?.trim() || 'Colecao da loja'

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border border-slate-200/90 bg-white p-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_-26px_rgba(15,23,42,0.26)] sm:p-4">
      <Link href={`/produto/${product.id}`} className="flex h-full flex-col">
        <div className="relative overflow-hidden rounded-[1.35rem] bg-white">
          <StoreImage
            src={image}
            alt={product.name}
            className="h-[15.5rem] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:h-[16.75rem]"
            fallbackClassName="flex h-[15.5rem] items-center justify-center px-6 text-center text-sm font-medium text-slate-500 sm:h-[16.75rem]"
            fallbackLabel={product.name}
          />

          {badgeLabel ? (
            <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm sm:left-4 sm:top-4 ${badgeStyles}`}>
              {badgeLabel}
            </span>
          ) : null}

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-500 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.6)] transition-colors group-hover:text-slate-900 sm:right-4 sm:top-4"
          >
            <Heart className="h-4 w-4" />
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-1 pb-1 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-h-5 items-center gap-2">
              {swatches.length > 0 ? (
                swatches.map((color, index) => (
                  <span
                    key={`${product.id}-${color.name}-${color.hex}`}
                    className={`rounded-full border border-slate-200 ${index === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'}`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))
              ) : (
                <span className="text-xs font-medium text-slate-400">{secondaryLabel}</span>
              )}
            </div>

            <div className="flex items-center gap-1 text-sm font-semibold text-slate-400">
              <Star className="h-4 w-4 fill-[#ffb400] text-[#ffb400]" />
              <span className="text-slate-600">{rating.rating}</span>
              <span className="text-slate-400">({rating.count})</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="line-clamp-2 min-h-10 text-[1.02rem] font-medium leading-6 text-slate-900 sm:text-[1.06rem]">
              {product.name}
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-end gap-2">
                <p className="text-[1.5rem] font-bold leading-none tracking-tight text-slate-950 sm:text-[1.7rem]">
                  {formatMoney(displayPrice)}
                </p>
                {hasDiscount ? (
                  <p className="text-sm font-medium text-slate-400 line-through">{formatMoney(displayComparePrice)}</p>
                ) : null}
              </div>

              <p className="text-sm font-medium text-slate-500">
                {installmentCount}x {formatMoney(displayPrice / installmentCount)}
              </p>
            </div>

            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b2f6f] text-white shadow-[0_18px_28px_-18px_rgba(11,47,111,0.75)] transition-transform duration-300 group-hover:scale-[1.04]"
            >
              <ShoppingCart className="h-5 w-5" />
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-400">{secondaryLabel}</span>
            <span className={Number(product.stock ?? 0) > 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
              {Number(product.stock ?? 0) > 0 ? 'Em estoque' : 'Indisponivel'}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
