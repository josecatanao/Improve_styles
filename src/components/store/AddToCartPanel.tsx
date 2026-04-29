'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket } from 'lucide-react'
import type { ProductDetail } from '@/lib/product-shared'
import { useCart } from '@/components/store/CartProvider'
import {
  formatMoney,
  getExactVariant,
  getFirstAvailableVariantSelection,
  getProductPrimaryImage,
  getVariantColorOptions,
  getVariantStockMessage,
  getVariantSizeOptions,
  hasRealVariants,
} from '@/lib/storefront'

type SelectionSnapshot = {
  availableStock: number
  colorHex: string | null
  colorName: string | null
  compareAtPrice: number
  price: number
  selectedSize: string | null
  stockMessage: string
}

function getDiscountPercentage(compareAtPrice: number, price: number) {
  if (compareAtPrice <= price || compareAtPrice <= 0) {
    return null
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

export function AddToCartPanel({
  product,
  isAuthenticated,
  onSelectionChange,
}: {
  product: ProductDetail
  isAuthenticated: boolean
  onSelectionChange?: (selection: SelectionSnapshot) => void
}) {
  const router = useRouter()
  const { addItem } = useCart()
  const hasVariants = hasRealVariants(product)
  const initialSelection = useMemo(() => getFirstAvailableVariantSelection(product), [product])

  const [selectedColor, setSelectedColor] = useState<string | null>(initialSelection.colorName)
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSelection.size)
  const [quantity, setQuantity] = useState(1)

  const colorOptions = useMemo(() => getVariantColorOptions(product), [product])
  const sizeOptions = useMemo(() => getVariantSizeOptions(product, selectedColor), [product, selectedColor])
  const resolvedSelectedSize = hasVariants
    ? selectedSize && sizeOptions.some((option) => option.size === selectedSize)
      ? selectedSize
      : sizeOptions.find((option) => option.hasStock)?.size ?? sizeOptions[0]?.size ?? null
    : selectedSize

  const selectedVariant = hasVariants
    ? getExactVariant(product.product_variants, selectedColor, resolvedSelectedSize)
    : null

  const displayPrice = Number(selectedVariant?.price ?? product.price ?? 0)
  const displayComparePrice = Number(selectedVariant?.compare_at_price ?? product.compare_at_price ?? 0)
  const availableStock = Number(selectedVariant?.stock ?? product.stock ?? 0)
  const image =
    product.product_images?.find(
      (item) =>
        item.public_url &&
        ((selectedVariant?.color_hex && item.assigned_color_hex === selectedVariant.color_hex) ||
          (selectedColor && item.assigned_color_name === selectedColor))
    )?.public_url ?? getProductPrimaryImage(product)
  const stockMessage = getVariantStockMessage(availableStock)
  const effectiveColorName = selectedColor ?? initialSelection.colorName
  const effectiveSize = resolvedSelectedSize ?? initialSelection.size
  const canPurchase = availableStock > 0
  const discountPercentage = getDiscountPercentage(displayComparePrice, displayPrice)

  const emitSelectionChange = useEffectEvent(() => {
    onSelectionChange?.({
      availableStock,
      colorHex: selectedVariant?.color_hex ?? colorOptions.find((item) => item.name === selectedColor)?.hex ?? null,
      colorName: effectiveColorName,
      compareAtPrice: displayComparePrice,
      price: displayPrice,
      selectedSize: effectiveSize,
      stockMessage,
    })
  })

  useEffect(() => {
    emitSelectionChange()
  }, [
    availableStock,
    colorOptions,
    displayComparePrice,
    displayPrice,
    effectiveColorName,
    effectiveSize,
    resolvedSelectedSize,
    selectedColor,
    selectedVariant?.color_hex,
    stockMessage,
  ])

  function handleColorSelection(colorName: string) {
    setSelectedColor(colorName)
    setSelectedSize(null)
    setQuantity(1)
  }

  function handleSizeSelection(size: string) {
    setSelectedSize(size)
    setQuantity(1)
  }

  function handleAddToCart() {
    if (!isAuthenticated) {
      router.push(`/login?mode=customer&next=${encodeURIComponent(`/produto/${product.id}`)}`)
      return
    }

    if (!canPurchase) {
      return
    }

    addItem({
      id: `${product.id}:${selectedVariant?.id ?? 'default'}:${effectiveColorName ?? 'sem-cor'}:${effectiveSize ?? 'sem-tamanho'}`,
      productId: product.id,
      name: product.name,
      price: displayPrice,
      quantity,
      image,
      size: hasVariants ? effectiveSize : null,
      colorName: hasVariants ? effectiveColorName : null,
      colorHex: selectedVariant?.color_hex ?? colorOptions.find((item) => item.name === effectiveColorName)?.hex ?? null,
      sku: selectedVariant?.sku ?? product.sku ?? null,
    })
  }

  function getColorPreview(colorName: string, colorHex: string) {
    return (
      product.product_images?.find(
        (item) =>
          item.public_url &&
          ((item.assigned_color_name && item.assigned_color_name === colorName) ||
            (item.assigned_color_hex && item.assigned_color_hex === colorHex))
      )?.public_url ?? null
    )
  }

  function increaseQuantity() {
    if (!canPurchase) {
      return
    }

    if (quantity >= Math.max(availableStock, 1)) {
      return
    }

    setQuantity((current) => current + 1)
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1))
  }

  return (
    <div className="rounded-none border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {product.brand?.trim() ? <span className="rounded-none bg-slate-100 px-2.5 py-1">{product.brand}</span> : null}
            {product.category?.trim() ? <span className="rounded-none bg-slate-100 px-2.5 py-1">{product.category}</span> : null}
          </div>

          <div className="space-y-1">
            <h1 className="text-[1.55rem] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[2.2rem]">
              {product.name}
            </h1>
            {product.short_description?.trim() ? (
              <p className="text-sm leading-6 text-slate-500">{product.short_description.trim()}</p>
            ) : null}
          </div>
        </div>

        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {displayComparePrice > displayPrice ? (
                <p className="text-sm text-slate-400">
                  De: <span className="line-through">{formatMoney(displayComparePrice)}</span>
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[1.9rem] font-semibold tracking-tight text-slate-950 sm:text-4xl">{formatMoney(displayPrice)}</p>
                {discountPercentage ? (
                  <span className="rounded-none bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    -{discountPercentage}%
                  </span>
                ) : null}
              </div>
            </div>

            <span
              className={`rounded-none px-3 py-1.5 text-xs font-semibold ring-1 ${
                availableStock <= 0
                  ? 'bg-red-50 text-red-700 ring-red-100'
                  : availableStock <= 3
                    ? 'bg-amber-50 text-amber-700 ring-amber-100'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {availableStock > 0 && availableStock <= 3 ? <Rocket className="h-3.5 w-3.5" /> : null}
                {stockMessage}
              </span>
            </span>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Entre para adicionar ao carrinho e finalizar a compra.
          </div>
        ) : null}

        {colorOptions.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-950">Cor do produto:</span>
              <span className="text-slate-600">{effectiveColorName || 'Padrao'}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const isSelected = selectedColor === color.name
                const preview = getColorPreview(color.name, color.hex)

                return (
                  <button
                    key={`${color.name}-${color.hex}`}
                    type="button"
                    onClick={() => handleColorSelection(color.name)}
                    disabled={!color.hasStock}
                    className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-none border bg-white transition-all sm:h-[68px] sm:w-[68px] ${
                      isSelected
                        ? 'border-[#3483fa] ring-2 ring-[#3483fa]/15'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${!color.hasStock ? 'cursor-not-allowed opacity-45' : ''}`}
                    title={color.name}
                  >
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt={color.name} className="h-full w-full object-cover" />
                    ) : (
                      <span
                        className="h-8 w-8 rounded-none border border-slate-200 sm:h-9 sm:w-9"
                        style={{ backgroundColor: color.hex }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {sizeOptions.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-950">Tamanho do produto:</span>
              <span className="text-slate-600">{effectiveSize || 'Padrao'}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {sizeOptions.map((option) => {
                const isSelected = selectedSize === option.size
                const matchesResolved = resolvedSelectedSize === option.size

                return (
                  <button
                    key={option.size}
                    type="button"
                    onClick={() => handleSizeSelection(option.size)}
                    disabled={!option.hasStock}
                    className={`inline-flex min-h-10 items-center justify-center rounded-none border px-2.5 py-2 text-[13px] font-medium transition-colors sm:min-h-11 sm:px-3 sm:text-sm ${
                      isSelected || matchesResolved
                        ? 'border-[#3483fa] bg-[#3483fa]/5 text-[#2968c8]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    } ${!option.hasStock ? 'cursor-not-allowed bg-slate-100 text-slate-400 line-through opacity-70' : ''}`}
                  >
                    {option.size}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-950">Quantidade</p>
          <div className="inline-flex items-center rounded-none border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={decreaseQuantity}
              className="h-10 w-10 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 sm:h-11 sm:w-11"
              disabled={!canPurchase}
            >
              -
            </button>
            <span className="min-w-11 text-center text-sm font-medium text-slate-900 sm:min-w-12">{quantity}</span>
            <button
              type="button"
              onClick={increaseQuantity}
              className="h-10 w-10 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 sm:h-11 sm:w-11"
              disabled={!canPurchase}
            >
              +
            </button>
          </div>
        </div>

        <div className="grid gap-3 pt-1">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                if (!canPurchase) {
                  return
                }

                handleAddToCart()
                router.push('/carrinho')
              }}
              disabled={!canPurchase}
              className="inline-flex h-12 items-center justify-center rounded-none bg-[#3483fa] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2968c8] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Comprar agora
            </button>
          ) : (
            <Link
              href={`/login?mode=customer&next=${encodeURIComponent(`/produto/${product.id}`)}`}
              className="inline-flex h-12 items-center justify-center rounded-none bg-[#3483fa] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2968c8]"
            >
              Entrar para comprar
            </Link>
          )}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAuthenticated ? false : !canPurchase}
            className="inline-flex h-12 items-center justify-center rounded-none border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isAuthenticated ? 'Adicionar ao carrinho' : 'Fazer login'}
          </button>
        </div>
      </div>
    </div>
  )
}
