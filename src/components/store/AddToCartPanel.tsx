'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  RefreshCw,
  Rocket,
  Share2,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react'
import type { ProductDetail } from '@/lib/product-shared'
import { useCart, buildCartItemId } from '@/components/store/CartProvider'
import { useToast } from '@/components/ui/feedback-provider'
import { calculateShipping, type ShippingCalculation } from '@/lib/shipping'
import { validateCoupon } from '@/app/checkout/actions'
import {
  calculateCouponDiscountFromItems,
  couponMeetsMinimumOrderValue,
  getEligibleCouponItems,
} from '@/lib/store-coupons'
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
  selectedColor,
  onColorChange,
  onSelectionChange,
}: {
  product: ProductDetail
  isAuthenticated: boolean
  selectedColor: string | null
  onColorChange: (colorName: string) => void
  onSelectionChange?: (selection: SelectionSnapshot) => void
}) {
  const router = useRouter()
  const { addItem, appliedCoupon, applyCoupon, removeCoupon } = useCart()
  const toast = useToast()
  const hasVariants = hasRealVariants(product)
  const initialSelection = useMemo(() => getFirstAvailableVariantSelection(product), [product])

  const [selectedSize, setSelectedSize] = useState<string | null>(initialSelection.size)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [cep, setCep] = useState('')
  const [shippingResult, setShippingResult] = useState<ShippingCalculation | null>(null)
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

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
  const currentScopedItems = useMemo(
    () => [
      {
        productId: product.id,
        productCategory: product.category?.trim() ?? null,
        price: displayPrice,
        quantity,
      },
    ],
    [displayPrice, product.category, product.id, quantity]
  )
  const effectiveColorName = selectedColor ?? initialSelection.colorName
  const effectiveSize = resolvedSelectedSize ?? initialSelection.size
  const canPurchase = availableStock > 0
  const discountPercentage = getDiscountPercentage(displayComparePrice, displayPrice)

  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`Olha esse produto: ${product.name} - ${formatMoney(displayPrice)} - ${currentUrl}`)}`

  const onSelectionChangeRef = useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange

  useEffect(() => {
    onSelectionChangeRef.current?.({
      availableStock,
      colorHex: selectedVariant?.color_hex ?? colorOptions.find((item) => item.name === selectedColor)?.hex ?? null,
      colorName: effectiveColorName,
      compareAtPrice: displayComparePrice,
      price: displayPrice,
      selectedSize: effectiveSize,
      stockMessage,
    })
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
    onColorChange(colorName)
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

    const colorHex = selectedVariant?.color_hex ?? colorOptions.find((item) => item.name === effectiveColorName)?.hex ?? null

    addItem({
      id: buildCartItemId(product.id, colorHex, hasVariants ? effectiveSize : null),
      productId: product.id,
      name: product.name,
      category: product.category ?? null,
      price: displayPrice,
      quantity,
      image,
      size: hasVariants ? effectiveSize : null,
      colorName: hasVariants ? effectiveColorName : null,
      colorHex,
      sku: selectedVariant?.sku ?? product.sku ?? null,
    })

    setAdded(true)
    toast({ title: 'Produto adicionado ao carrinho!', variant: 'success' })
    setTimeout(() => setAdded(false), 1500)
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

  async function handleCalculateShipping() {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) {
      setShippingResult({ local: null, correios: null, error: 'CEP inválido' })
      return
    }

    setCalculatingShipping(true)
    setShippingResult(null)

    const productWeight = product.weight ?? null

    try {
      const result = await calculateShipping(cleanCep, { productWeight, orderTotal: 0 })
      setShippingResult(result)
    } finally {
      setCalculatingShipping(false)
    }
  }

  const couponDiscountUnit = useMemo(() => {
    if (!appliedCoupon) return 0
    const eligibleItems = getEligibleCouponItems(currentScopedItems, appliedCoupon)
    if (eligibleItems.length === 0) return 0
    if (!couponMeetsMinimumOrderValue(eligibleItems, appliedCoupon)) return 0
    const totalDiscount = calculateCouponDiscountFromItems(eligibleItems, appliedCoupon)
    return quantity > 0 ? totalDiscount / quantity : 0
  }, [appliedCoupon, currentScopedItems, quantity])

  const finalUnitPrice = Math.max(0, displayPrice - couponDiscountUnit)
  const couponAppliesToSelection =
    !!appliedCoupon &&
    getEligibleCouponItems(currentScopedItems, appliedCoupon).length > 0 &&
    couponMeetsMinimumOrderValue(currentScopedItems, appliedCoupon) &&
    (appliedCoupon.discount_type === 'free_shipping' || couponDiscountUnit > 0)

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setApplyingCoupon(true)
    setCouponError(null)
    try {
      const result = await validateCoupon(code)
      if (result.valid && result.coupon) {
        const coupon = result.coupon
        const eligibleItems = getEligibleCouponItems(currentScopedItems, coupon)
        if (eligibleItems.length === 0) {
          setCouponError('Este cupom nao se aplica a este produto.')
          return
        }

        if (!couponMeetsMinimumOrderValue(eligibleItems, coupon)) {
          setCouponError('Este cupom ainda nao atende ao valor minimo para este produto.')
          return
        }

        applyCoupon(coupon)
        setCouponInput('')
        toast({ variant: 'success', title: 'Cupom aplicado', description: `Desconto de ${coupon.code} aplicado.` })
      } else {
        setCouponError(result.error || 'Cupom invalido.')
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Erro ao validar cupom.')
    } finally {
      setApplyingCoupon(false)
    }
  }

  function handleRemoveCoupon() {
    removeCoupon()
    setCouponError(null)
  }

  return (
    <div className="rounded-xl border border-[color:var(--store-card-border)] bg-[var(--store-card-bg)] p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {product.brand?.trim() ? <span className="rounded-md bg-slate-100 px-2.5 py-1">{product.brand}</span> : null}
            {product.category?.trim() ? <span className="rounded-md bg-slate-100 px-2.5 py-1">{product.category}</span> : null}
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
              ) : couponAppliesToSelection ? (
                <p className="text-sm text-slate-400">
                  De: <span className="line-through">{formatMoney(displayPrice)}</span>
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-[1.9rem] font-semibold tracking-tight sm:text-4xl ${
                  couponAppliesToSelection ? 'text-emerald-600' : 'text-slate-950'
                }`}>
                  {formatMoney(couponAppliesToSelection ? finalUnitPrice : displayPrice)}
                </p>
                {discountPercentage ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    -{discountPercentage}%
                  </span>
                ) : null}
                {couponAppliesToSelection && appliedCoupon ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    {appliedCoupon.discount_type === 'free_shipping' ? 'Frete gratis' : appliedCoupon.discount_type === 'percentage' ? `-${appliedCoupon.discount_value}%` : `-${formatMoney(appliedCoupon.discount_value)}`}
                  </span>
                ) : null}
              </div>
              {couponAppliesToSelection && appliedCoupon ? (
                <p className="text-xs font-medium text-emerald-600">
                  Preco com cupom {appliedCoupon.code}
                </p>
              ) : null}
            </div>
          </div>

          {product.average_rating != null ? (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round(product.average_rating ?? 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-slate-700">{product.average_rating.toFixed(1)}</span>
              <span className="text-slate-400">({product.review_count ?? 0})</span>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-xs text-slate-500 underline transition-colors hover:text-slate-700"
              >
                Ver avaliacoes
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          {displayComparePrice > displayPrice ? (
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              Frete gratis
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5" />
            Ate 12x sem juros
          </span>
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Troca gratis
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Garantia
          </span>
        </div>

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
                    aria-label={`Cor: ${color.name}`}
                    className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border bg-white transition-all sm:h-[68px] sm:w-[68px] ${
                      isSelected
                        ? 'border-[color:var(--store-button-bg)] ring-2 ring-black/5'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${!color.hasStock ? 'cursor-not-allowed opacity-45' : ''}`}
                    title={color.name}
                  >
                    {preview ? (
                      <img src={preview} alt={color.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span
                        className="h-8 w-8 rounded-md border border-slate-200 sm:h-9 sm:w-9"
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
                    className={`inline-flex min-h-10 items-center justify-center rounded-md border px-2.5 py-2 text-[13px] font-medium transition-colors sm:min-h-11 sm:px-3 sm:text-sm ${
                      isSelected || matchesResolved
                        ? 'border-[color:var(--store-button-bg)] bg-black/5 text-[var(--store-button-bg)]'
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

        {availableStock > 0 && availableStock <= 3 ? (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Apenas {availableStock} unidade{availableStock > 1 ? 's' : ''} em estoque! Garanta o seu.
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">Quantidade</p>
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${
                availableStock <= 0
                  ? 'bg-red-50 text-red-700 ring-red-100'
                  : availableStock <= 3
                    ? 'bg-amber-50 text-amber-700 ring-amber-100'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {availableStock > 0 && availableStock <= 3 ? <Rocket className="h-3 w-3" /> : null}
                {stockMessage}
              </span>
            </span>
          </div>
          <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50">
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

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-950">Calcular frete</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={9}
                placeholder="Digite seu CEP"
                value={cep}
                onChange={(e) => {
                  setCep(e.target.value.replace(/\D/g, '').slice(0, 8))
                  setShippingResult(null)
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 sm:h-11"
              />
            </div>
            <button
              type="button"
              onClick={handleCalculateShipping}
              disabled={calculatingShipping || cep.replace(/\D/g, '').length !== 8}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 sm:h-11"
            >
              {calculatingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calcular'}
            </button>
          </div>
          {shippingResult ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              {shippingResult.error ? (
                <p className="text-sm text-red-600">{shippingResult.error}</p>
              ) : (
                <div className="space-y-1.5">
                  {shippingResult.local ? (
                    <p className="text-sm text-slate-700">
                      {shippingResult.local.price != null && shippingResult.local.price > 0
                        ? `Frete local: ${formatMoney(shippingResult.local.price)}`
                        : 'Frete gratis'}
                      {' — '}
                      {shippingResult.local.zoneName} — ate {shippingResult.local.days} dia{shippingResult.local.days > 1 ? 's' : ''} uteis
                    </p>
                  ) : null}
                  {shippingResult.correios ? (
                    <>
                      <p className="text-sm text-slate-700">
                        PAC: {formatMoney(shippingResult.correios.pac.price)} — {shippingResult.correios.pac.minDays} a {shippingResult.correios.pac.maxDays} dias uteis
                      </p>
                      <p className="text-sm text-slate-700">
                        SEDEX: {formatMoney(shippingResult.correios.sedex.price)} — {shippingResult.correios.sedex.minDays} a {shippingResult.correios.sedex.maxDays} dias uteis
                      </p>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {isAuthenticated ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-950">Cupom de desconto</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite o codigo"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                disabled={!!appliedCoupon}
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 sm:h-11"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:h-11"
                >
                  Remover
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || applyingCoupon}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 sm:h-11"
                >
                  {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                </button>
              )}
            </div>
            {couponError ? <p className="text-xs text-red-500">{couponError}</p> : null}
            {couponAppliesToSelection && appliedCoupon ? (
              <p className="text-xs text-emerald-600">
                Cupom <span className="font-semibold">{appliedCoupon.code}</span> aplicado
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 pt-1">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                if (!canPurchase) {
                  return
                }

                handleAddToCart()
                router.push(`/checkout${couponAppliesToSelection && appliedCoupon ? `?coupon=${encodeURIComponent(appliedCoupon.code)}` : ''}`)
              }}
              disabled={!canPurchase}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--store-button-bg)] px-4 text-sm font-semibold text-[var(--store-button-fg)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Comprar agora
            </button>
          ) : (
            <Link
              href={`/login?mode=customer&next=${encodeURIComponent(`/produto/${product.id}`)}`}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--store-button-bg)] px-4 text-sm font-semibold text-[var(--store-button-fg)] transition-colors hover:opacity-90"
            >
              Entrar para comprar
            </Link>
          )}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAuthenticated ? false : !canPurchase}
            className={`inline-flex h-12 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
              added
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 disabled:text-slate-400'
            }`}
          >
            {added ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Adicionado!
              </>
            ) : isAuthenticated ? (
              'Adicionar ao carrinho'
            ) : (
              'Fazer login'
            )}
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
