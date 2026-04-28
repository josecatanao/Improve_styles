'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export function AddToCartPanel({ product }: { product: ProductDetail }) {
  const router = useRouter()
  const { addItem } = useCart()
  const hasVariants = hasRealVariants(product)
  const initialSelection = useMemo(() => getFirstAvailableVariantSelection(product), [product])

  const [selectedColor, setSelectedColor] = useState<string | null>(initialSelection.colorName)
  const [selectedSize, setSelectedSize] = useState<string | null>(hasVariants ? null : initialSelection.size)
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
  const image = getProductPrimaryImage(product)
  const stockMessage = getVariantStockMessage(availableStock)
  const isCombinationSelected = hasVariants ? Boolean(selectedColor && selectedSize && selectedVariant) : true
  const canPurchase = isCombinationSelected && availableStock > 0

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
    if (!canPurchase) {
      return
    }

    addItem({
      id: `${product.id}:${selectedVariant?.id ?? 'default'}:${selectedColor ?? 'sem-cor'}:${resolvedSelectedSize ?? 'sem-tamanho'}`,
      productId: product.id,
      name: product.name,
      price: displayPrice,
      quantity,
      image,
      size: hasVariants ? resolvedSelectedSize : null,
      colorName: hasVariants ? selectedColor : null,
      colorHex: selectedVariant?.color_hex ?? colorOptions.find((item) => item.name === selectedColor)?.hex ?? null,
      sku: selectedVariant?.sku ?? product.sku ?? null,
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="space-y-1">
        <p className="text-3xl font-semibold text-slate-950">{formatMoney(displayPrice)}</p>
        {displayComparePrice > displayPrice ? (
          <p className="text-sm text-slate-400 line-through">{formatMoney(displayComparePrice)}</p>
        ) : null}
        <p
          className={`text-sm font-medium ${
            availableStock <= 0 ? 'text-red-600' : availableStock <= 3 ? 'text-amber-600' : 'text-emerald-600'
          }`}
        >
          {stockMessage}
        </p>
      </div>

      {colorOptions.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-slate-900">Cor</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {colorOptions.map((color) => {
              const isSelected = selectedColor === color.name

              return (
                <button
                  key={`${color.name}-${color.hex}`}
                  type="button"
                  onClick={() => handleColorSelection(color.name)}
                  disabled={!color.hasStock}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'border-[#3483fa] bg-[#3483fa]/5 text-[#2968c8]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  } ${!color.hasStock ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70' : ''}`}
                >
                  <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: color.hex }} />
                  <span>{color.name}</span>
                  {!color.hasStock ? <span className="text-xs">Esgotado</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {sizeOptions.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-slate-900">Tamanho</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizeOptions.map((option) => {
              const isSelected = selectedSize === option.size
              const matchesResolved = resolvedSelectedSize === option.size

              return (
                <button
                  key={option.size}
                  type="button"
                  onClick={() => handleSizeSelection(option.size)}
                  disabled={!option.hasStock}
                  className={`inline-flex min-w-16 items-center justify-center rounded-xl border px-3 py-2 text-sm transition-colors ${
                    isSelected || matchesResolved
                      ? 'border-[#3483fa] bg-[#3483fa]/5 text-[#2968c8]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  } ${!option.hasStock ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through opacity-70' : ''}`}
                >
                  <span>{option.size}</span>
                  <span className="ml-2 text-[11px] opacity-80">{option.stock}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-900">Quantidade</p>
        <div className="mt-3 inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="h-11 w-11 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={!canPurchase}
          >
            -
          </button>
          <span className="min-w-12 text-center text-sm font-medium text-slate-900">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.min(Math.max(availableStock, 1), current + 1))}
            className="h-11 w-11 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={!canPurchase}
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canPurchase}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#3483fa] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2968c8] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Adicionar ao carrinho
        </button>
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
          className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Comprar agora
        </button>
      </div>
    </div>
  )
}
