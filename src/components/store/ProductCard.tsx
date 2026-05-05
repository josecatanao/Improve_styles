'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Heart, ShoppingCart, Star } from 'lucide-react'
import type { ProductListItem } from '@/lib/product-shared'
import { StoreImage } from '@/components/store/StoreImage'
import { useCart, buildCartItemId } from '@/components/store/CartProvider'
import { formatMoney, getProductDisplayBadge, getProductPrimaryImage, normalizeStoreCategoryLabel } from '@/lib/storefront'

function getBadgeStyles(product: ProductListItem, badge: string | null) {
  if (product.is_promotion) {
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
  if (badge === 'Novo') {
    return '✨ Novo'
  }

  if (badge === 'Destaque' || Number(product.sales_count ?? 0) > 10) {
    return '⭐ Mais vendido'
  }

  return badge
}

function getInstallments(price: number, maxInstallments = 12, minInstallmentValue = 50) {
  if (price <= 0) return 1
  const maxByPrice = Math.floor(price / minInstallmentValue)
  return Math.min(maxInstallments, Math.max(1, maxByPrice))
}

export function ProductCard({ product }: { product: ProductListItem }) {
  const { isInWishlist, addToWishlist, removeFromWishlist, addItem } = useCart()
  const [added, setAdded] = useState(false)
  const badge = getProductDisplayBadge(product)
  const inWishlist = isInWishlist(product.id)
  const image = getProductPrimaryImage(product)
  const hasDiscount = Number(product.compare_at_price ?? 0) > Number(product.price ?? 0)
  const swatches = (product.colors ?? []).slice(0, 4)
  const displayPrice = Number(product.price ?? 0)
  const displayComparePrice = Number(product.compare_at_price ?? 0)
  const addPrice = Number(product.product_variants?.[0]?.price ?? product.price ?? 0)
  const installmentCount = getInstallments(displayPrice)
  const badgeLabel = getBadgeLabel(product, badge)
  const badgeStyles = getBadgeStyles(product, badge)
  const secondaryLabel = product.category?.trim()
    ? normalizeStoreCategoryLabel(product.category)
    : product.brand?.trim() || 'Coleção da loja'
  const reviewCount = Number(product.review_count ?? 0)
  const averageRating = typeof product.average_rating === 'number' ? product.average_rating : null
  const hasReviews = reviewCount > 0 && averageRating !== null

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--store-card-border)] bg-[var(--store-card-bg)] p-2.5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_-26px_rgba(15,23,42,0.26)] sm:p-4">
      <Link href={`/produto/${product.id}`} className="flex h-full flex-col">
        <div className="relative overflow-hidden rounded-lg bg-white">
          <StoreImage
            src={image}
            alt={product.name}
            className="h-[10rem] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:h-[14rem]"
            fallbackClassName="flex h-[10rem] items-center justify-center px-4 text-center text-xs font-medium text-slate-500 sm:h-[14rem] sm:px-6 sm:text-sm"
            fallbackLabel={product.name}
          />

          {badgeLabel ? (
            <span className={`absolute left-2.5 top-2.5 rounded-md px-2.5 py-1 text-[10px] font-bold shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-[11px] ${badgeStyles}`}>
              {badgeLabel}
            </span>
          ) : null}

          <button
            type="button"
            aria-label={inWishlist ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            suppressHydrationWarning
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (inWishlist) {
                removeFromWishlist(product.id)
              } else {
                addToWishlist(product.id)
              }
            }}
            className={`absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/80 bg-white/95 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.6)] transition-colors sm:right-4 sm:top-4 sm:h-9 sm:w-9 ${
              inWishlist ? 'text-red-500 hover:text-red-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Heart suppressHydrationWarning className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${inWishlist ? 'fill-red-500' : ''}`} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1 px-0.5 pb-0.5 pt-1 sm:gap-1.5 sm:px-1 sm:pb-1 sm:pt-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-h-5 items-center gap-2">
              {swatches.length > 0 ? (
                swatches.map((color, index) => (
                  <span
                    key={`${product.id}-${color.name}-${color.hex}`}
                    className={`rounded-full border border-slate-200 ${index === 0 ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-3 w-3 sm:h-3.5 sm:w-3.5'}`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))
              ) : (
                <span className="line-clamp-1 text-[11px] font-medium text-slate-400 sm:text-xs">{secondaryLabel}</span>
              )}
            </div>

            {hasReviews ? (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 sm:text-sm">
                <Star className="h-3.5 w-3.5 fill-[#ffb400] text-[#ffb400] sm:h-4 sm:w-4" />
                <span className="text-slate-600">{averageRating.toFixed(1).replace('.', ',')}</span>
                <span className="text-slate-400">({reviewCount})</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-0">
            <p className="line-clamp-2 text-[0.9rem] font-medium leading-5 text-slate-900 sm:text-[1.06rem] sm:leading-6">
              {product.name}
            </p>
          </div>

          <div className="flex items-end justify-between gap-2 pt-0.5">
            <div className="space-y-0">
              <div className="flex flex-wrap items-end gap-1.5 sm:gap-2">
                <p className="text-[1.15rem] font-bold leading-none tracking-tight text-slate-950 sm:text-[1.7rem]">
                  {formatMoney(displayPrice)}
                </p>
                {hasDiscount ? (
                  <p className="text-[11px] font-medium text-slate-400 line-through sm:text-sm">{formatMoney(displayComparePrice)}</p>
                ) : null}
              </div>

              <p className="text-[11px] font-medium text-slate-500 sm:text-sm">
                {installmentCount}x {formatMoney(displayPrice / installmentCount)}
              </p>
            </div>

            <button
              type="button"
              aria-label={`Adicionar ${product.name} ao carrinho`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addItem({
                  id: buildCartItemId(product.id, swatches[0]?.hex ?? null, null),
                  productId: product.id,
                  name: product.name,
                  category: product.category ?? null,
                  price: addPrice,
                  quantity: 1,
                  image,
                  colorName: swatches[0]?.name ?? null,
                  colorHex: swatches[0]?.hex ?? null,
                })
                setAdded(true)
                setTimeout(() => setAdded(false), 1500)
              }}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md shadow-[0_18px_28px_-18px_rgba(11,47,111,0.75)] transition-all duration-300 sm:h-12 sm:w-12 ${
                added
                  ? 'scale-110 bg-emerald-500 text-white'
                  : 'bg-[var(--store-cart-bg)] text-[var(--store-cart-fg)] group-hover:scale-[1.04]'
              }`}
            >
              {added ? (
                <Check className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              ) : (
                <ShoppingCart className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
            <span className="line-clamp-1 font-medium text-slate-400">{secondaryLabel}</span>
            <span className={Number(product.stock ?? 0) > 0 ? 'shrink-0 font-semibold text-emerald-600' : 'shrink-0 font-semibold text-amber-600'}>
              {Number(product.stock ?? 0) > 0 ? 'Em estoque' : 'Indisponível'}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
