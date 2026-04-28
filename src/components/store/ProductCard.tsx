import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { ProductListItem } from '@/lib/product-shared'
import { StoreImage } from '@/components/store/StoreImage'
import { formatMoney, getProductDisplayBadge, getProductPrimaryImage, normalizeStoreCategoryLabel } from '@/lib/storefront'

export function ProductCard({ product }: { product: ProductListItem }) {
  const badge = getProductDisplayBadge(product)
  const image = getProductPrimaryImage(product)
  const hasDiscount = Number(product.compare_at_price ?? 0) > Number(product.price ?? 0)
  const swatches = (product.colors ?? []).slice(0, 4)

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white p-2.5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80 transition-transform duration-200 hover:-translate-y-0.5 sm:rounded-[1.75rem] sm:p-3">
      <Link href={`/produto/${product.id}`} className="flex h-full flex-col">
        <div className="relative overflow-hidden rounded-[1rem] bg-[#f4f5f7] sm:rounded-[1.25rem]">
          <StoreImage
            src={image}
            alt={product.name}
            className="aspect-[4/4.95] w-full object-contain bg-[#f4f5f7] p-2.5 transition-transform duration-300 group-hover:scale-[1.03] sm:aspect-[4/4.3] sm:object-cover sm:bg-transparent sm:p-0"
            fallbackClassName="flex aspect-[4/4.95] items-center justify-center px-5 text-center text-sm font-medium text-slate-500 sm:aspect-[4/4.3] sm:px-6"
            fallbackLabel={product.name}
          />

          {badge ? (
            <span className="absolute left-2.5 top-2.5 rounded-lg bg-[#ff5a52] px-2 py-1 text-[10px] font-semibold text-white sm:left-3 sm:top-3 sm:text-[11px]">
              {badge === 'Promocao' ? '-20%' : badge}
            </span>
          ) : null}

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm transition-colors group-hover:text-slate-900 sm:right-3 sm:top-3 sm:h-8 sm:w-8"
          >
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-0.5 pb-0.5 pt-2.5 sm:gap-2 sm:px-1 sm:pb-1 sm:pt-3">
          {swatches.length > 0 ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {swatches.map((color) => (
                <span
                  key={`${product.id}-${color.name}-${color.hex}`}
                  className="h-3 w-3 rounded-full border border-slate-200 sm:h-3.5 sm:w-3.5"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          ) : null}

          <div className="space-y-1">
            <p className="line-clamp-2 min-h-9 text-[0.88rem] font-semibold leading-5 text-slate-950 sm:min-h-10 sm:text-[0.95rem]">
              {product.name}
            </p>
            <p className="text-xs text-slate-500">
              {product.category?.trim() ? normalizeStoreCategoryLabel(product.category) : product.brand?.trim() || 'Colecao da loja'}
            </p>
          </div>

          <div className="mt-auto space-y-0.5 sm:space-y-1">
            <div className="flex flex-wrap items-end gap-1.5 sm:gap-2">
              <p className="text-[1.35rem] font-semibold leading-none text-slate-950 sm:text-[1.9rem]">
                {formatMoney(Number(product.price ?? 0))}
              </p>
              {hasDiscount ? (
                <p className="text-sm text-slate-400 line-through">{formatMoney(Number(product.compare_at_price ?? 0))}</p>
              ) : null}
            </div>
            <p className="text-[12px] text-slate-600 sm:text-sm">
              {Number(product.stock ?? 0) > 0 ? 'Disponivel para compra' : 'Indisponivel'}
            </p>
          </div>
        </div>
      </Link>
    </article>
  )
}
