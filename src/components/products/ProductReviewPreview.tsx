'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react'
import { formatMoney, normalizeStoreCategoryLabel } from '@/lib/storefront'
import { cn } from '@/lib/utils'
import type { ColorGroup, ImageItem, ProductFormState } from './ProductForm'

type PreviewProps = {
  form: ProductFormState
  colorGroups: ColorGroup[]
  images: ImageItem[]
  totalStock: number
  previewPrice: number
  previewImage: ImageItem | null
  previewComparePrice: number | null
}

function getCardBadge(form: ProductFormState): { label: string | null; className: string } {
  if (form.is_promotion) {
    return { label: '🔥 Oferta', className: 'bg-gradient-to-r from-[#ff5a52] to-[#ff3d2e] text-white' }
  }
  if (form.is_featured) {
    return { label: '⭐ Mais vendido', className: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' }
  }
  return { label: null, className: '' }
}

function getInstallments(price: number, maxInstallments = 12, minInstallmentValue = 50) {
  if (price <= 0) return 1
  const maxByPrice = Math.floor(price / minInstallmentValue)
  return Math.min(maxInstallments, Math.max(1, maxByPrice))
}

function CardPreviewImage({ image, alt }: { image: ImageItem | null; alt: string }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.url}
        alt={alt}
        className="h-[10rem] w-full object-cover sm:h-[14rem]"
      />
    )
  }

  return (
    <div className="flex h-[10rem] items-center justify-center px-4 text-center text-xs font-medium text-slate-400 sm:h-[14rem] sm:px-6 sm:text-sm">
      Sem imagem de capa
    </div>
  )
}

function CollapsibleSection({
  open,
  onToggle,
  icon,
  iconBg,
  iconColor,
  title,
  description,
  children,
}: {
  open: boolean
  onToggle: () => void
  icon: string
  iconBg: string
  iconColor: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-2 text-left"
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ring-1',
            iconBg,
            iconColor
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'grid overflow-hidden transition-all duration-300 ease-in-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

export function ProductReviewPreview({
  form,
  colorGroups,
  images,
  totalStock,
  previewPrice,
  previewImage,
  previewComparePrice,
}: PreviewProps) {
  const [cardOpen, setCardOpen] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)

  const colors = useMemo(
    () => colorGroups.map((g) => ({ name: g.name, hex: g.hex })),
    [colorGroups]
  )

  const swatches = useMemo(() => colors.slice(0, 4), [colors])

  const activeColorGroups = useMemo(
    () => colorGroups.filter((g) => g.variants.some((v) => v.status === 'active')),
    [colorGroups]
  )

  const sizeOptions = useMemo(() => {
    const sizeSet = new Set<string>()
    activeColorGroups.forEach((g) => {
      g.variants
        .filter((v) => v.status === 'active')
        .forEach((v) => {
          if (v.size.trim()) sizeSet.add(v.size.trim())
        })
    })
    return Array.from(sizeSet)
  }, [activeColorGroups])

  const hasDiscount = previewComparePrice != null && previewComparePrice > previewPrice
  const installmentCount = getInstallments(previewPrice)
  const secondaryLabel = form.category?.trim()
    ? normalizeStoreCategoryLabel(form.category)
    : form.brand?.trim() || 'Coleção da loja'
  const badge = getCardBadge(form)

  return (
    <div className="grid gap-5">
      {/* ===================== CARD PREVIEW (collapsible) ===================== */}
      <CollapsibleSection
        open={cardOpen}
        onToggle={() => setCardOpen((prev) => !prev)}
        icon="C"
        iconBg="bg-blue-50 ring-blue-100"
        iconColor="text-blue-600"
        title="Card na vitrine"
        description="Como o produto aparece na listagem e busca da loja."
      >
        <div className="mx-auto max-w-[320px] pb-1 pt-1">
          <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] sm:p-4">
            <div className="flex h-full flex-col">
              <div className="relative overflow-hidden rounded-lg bg-slate-50">
                <CardPreviewImage image={previewImage} alt={form.name || 'Preview do produto'} />

                {badge.label ? (
                  <span
                    className={cn(
                      'absolute left-2.5 top-2.5 rounded-md px-2.5 py-1 text-[10px] font-bold shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-[11px]',
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                ) : null}

                <div className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/80 bg-white/95 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.6)] sm:right-4 sm:top-4 sm:h-9 sm:w-9">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 text-slate-400 sm:h-4 sm:w-4"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-1 px-0.5 pb-0.5 pt-1 sm:gap-1.5 sm:px-1 sm:pb-1 sm:pt-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-h-5 items-center gap-2">
                    {swatches.length > 0 ? (
                      swatches.map((color, index) => (
                        <span
                          key={`${color.name}-${color.hex}`}
                          className={cn(
                            'rounded-full border border-slate-200',
                            index === 0 ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-3 w-3 sm:h-3.5 sm:w-3.5'
                          )}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))
                    ) : (
                      <span className="line-clamp-1 text-[11px] font-medium text-slate-400 sm:text-xs">
                        {secondaryLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-0">
                  <p className="line-clamp-2 text-[0.9rem] font-medium leading-5 text-slate-900 sm:text-[1.06rem] sm:leading-6">
                    {form.name || 'Nome do produto'}
                  </p>
                </div>

                <div className="flex items-end justify-between gap-2 pt-0.5">
                  <div className="space-y-0">
                    <div className="flex flex-wrap items-end gap-1.5 sm:gap-2">
                      <p className="text-[1.15rem] font-bold leading-none tracking-tight text-slate-950 sm:text-[1.7rem]">
                        {formatMoney(previewPrice)}
                      </p>
                      {hasDiscount ? (
                        <p className="text-[11px] font-medium text-slate-400 line-through sm:text-sm">
                          {formatMoney(previewComparePrice)}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-[11px] font-medium text-slate-500 sm:text-sm">
                      {installmentCount}x {formatMoney(previewPrice / installmentCount)}
                    </p>
                  </div>

                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 shadow-[0_18px_28px_-18px_rgba(11,47,111,0.45)] sm:h-12 sm:w-12">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4.5 w-4.5 text-slate-500 sm:h-5 sm:w-5"
                    >
                      <circle cx={9} cy={21} r={1} />
                      <circle cx={20} cy={21} r={1} />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
                  <span className="line-clamp-1 font-medium text-slate-400">{secondaryLabel}</span>
                  <span
                    className={cn(
                      'shrink-0 font-semibold',
                      totalStock > 0 ? 'text-emerald-600' : 'text-amber-600'
                    )}
                  >
                    {totalStock > 0 ? 'Em estoque' : 'Indisponível'}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </CollapsibleSection>

      {/* ===================== DETAIL PAGE PREVIEW (collapsible) ===================== */}
      <CollapsibleSection
        open={detailOpen}
        onToggle={() => setDetailOpen((prev) => !prev)}
        icon="D"
        iconBg="bg-violet-50 ring-violet-100"
        iconColor="text-violet-600"
        title="Página do produto"
        description="Como o produto aparece na página interna de detalhe."
      >
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)] ring-1 ring-slate-200">
          {/* Gallery + Info panel grid (mirrors ProductDetailClient layout) */}
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_380px] lg:gap-5">
            {/* === Gallery column === */}
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-[72px_minmax(0,1fr)]">
              {/* Thumbnails strip */}
              <div className="hidden max-h-[480px] lg:flex lg:flex-col lg:gap-2.5 lg:overflow-y-auto lg:pr-1">
                {images.slice(0, 8).map((image, index) => (
                  <div
                    key={image.id}
                    className={cn(
                      'relative w-full aspect-square overflow-hidden rounded-md border',
                      index === 0 ? 'border-slate-900' : 'border-slate-200'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`Galeria ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
                {images.length === 0 ? (
                  <div className="flex aspect-square items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                    Sem fotos
                  </div>
                ) : null}
              </div>

              {/* Main image */}
              <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage.url}
                    alt={form.name || 'Preview do produto'}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-sm text-slate-400">
                    Sem imagem principal
                  </div>
                )}

                {/* Mobile thumbnails row */}
                <div className="absolute bottom-0 left-0 right-0 lg:hidden">
                  <div className="flex gap-2 overflow-x-auto px-3 pb-3">
                    {images.slice(0, 8).map((image, index) => (
                      <div
                        key={image.id}
                        className={cn(
                          'h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-white',
                          index === 0 ? 'border-slate-900' : 'border-slate-200'
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={`Galeria ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* === Info panel (mirrors AddToCartPanel structure) === */}
            <div className="space-y-5">
              <div className="space-y-3">
                {/* Brand/Category tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {form.brand?.trim() ? (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1">{form.brand}</span>
                  ) : null}
                  {form.category?.trim() ? (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1">{form.category}</span>
                  ) : null}
                </div>

                {/* Product name */}
                <h1 className="text-[1.55rem] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[2rem]">
                  {form.name || 'Nome do produto'}
                </h1>
              </div>

              {/* Price section */}
              <div className="border-b border-slate-200 pb-5">
                <div className="space-y-1">
                  {hasDiscount ? (
                    <p className="text-sm text-slate-400">
                      De: <span className="line-through">{formatMoney(previewComparePrice)}</span>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[1.9rem] font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      {formatMoney(previewPrice)}
                    </p>
                    {hasDiscount ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        -{Math.round(((previewComparePrice - previewPrice) / previewComparePrice) * 100)}%
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Perks strip */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Até 12x sem juros
                </span>
                <span className="inline-flex items-center gap-1">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Troca grátis
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Garantia
                </span>
              </div>

              {/* Color selector preview */}
              {activeColorGroups.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-950">Cor do produto:</span>
                    <span className="text-slate-600">
                      {activeColorGroups[0]?.name || 'Padrão'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeColorGroups.slice(0, 8).map((group) => {
                      const firstImageForColor = images.find(
                        (img) => img.assignedColorHex === group.hex || img.assignedColorName === group.name
                      )
                      const hasStock = group.variants.some((v) => v.status === 'active' && Number(v.stock) > 0)

                      return (
                        <div
                          key={group.id}
                          className={cn(
                            'relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border bg-white transition-all sm:h-[68px] sm:w-[68px]',
                            'border-slate-200',
                            !hasStock ? 'opacity-45' : ''
                          )}
                          title={group.name}
                        >
                          {firstImageForColor ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImageForColor.url}
                              alt={group.name}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <span
                              className="h-8 w-8 rounded-md border border-slate-200 sm:h-9 sm:w-9"
                              style={{ backgroundColor: group.hex }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Size selector preview */}
              {sizeOptions.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-950">Tamanho do produto:</span>
                    <span className="text-slate-600">{sizeOptions[0] || 'Padrão'}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {sizeOptions.slice(0, 10).map((size) => (
                      <div
                        key={size}
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 px-2.5 py-2 text-[13px] font-medium text-slate-700 sm:min-h-11 sm:px-3 sm:text-sm"
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Stock indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">Estoque</p>
                  <span
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold ring-1',
                      totalStock <= 0
                        ? 'bg-red-50 text-red-700 ring-red-100'
                        : totalStock <= 3
                          ? 'bg-amber-50 text-amber-700 ring-amber-100'
                          : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                    )}
                  >
                    {totalStock <= 0
                      ? 'Indisponível'
                      : totalStock <= 3
                        ? `Últimas ${totalStock} unidades`
                        : `${totalStock} unidade(s) disponíveis`}
                  </span>
                </div>
              </div>

              {/* Buy buttons (visual only) */}
              <div className="grid gap-3 pt-1">
                <div className="inline-flex h-12 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">
                  Comprar agora
                </div>
                <div className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">
                  Adicionar ao carrinho
                </div>
              </div>
            </div>
          </div>

          {/* Product description */}
          {(form.shortDescription?.trim() || form.description?.trim()) ? (
            <div className="border-t border-slate-100 px-5 py-5 sm:px-6 sm:py-6">
              <h2 className="text-lg font-semibold text-slate-950">Descrição do produto</h2>
              {form.shortDescription?.trim() ? (
                <p className="mt-2 text-base font-medium text-slate-900">{form.shortDescription.trim()}</p>
              ) : null}
              {form.description?.trim() ? (
                <p className="mt-2 text-sm leading-7 text-slate-600">{form.description.trim()}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  )
}
