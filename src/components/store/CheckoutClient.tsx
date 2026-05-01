'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, MapPin, Navigation2, TicketPercent, Truck, X } from 'lucide-react'
import { useCart } from '@/components/store/CartProvider'
import { useToast } from '@/components/ui/feedback-provider'
import type { CustomerProfile } from '@/lib/customer-shared'
import {
  calculateCouponDiscountFromItems,
  couponMeetsMinimumOrderValue,
  getEligibleCouponItems,
} from '@/lib/store-coupons'
import { formatMoney } from '@/lib/storefront'
import { submitOrder, validateCoupon } from '@/app/checkout/actions'
import { calculateShipping } from '@/lib/shipping'
import { readStoredOrders, saveStoreOrder, type StoreOrder, type StoreOrderCustomer } from '@/lib/store-orders'

const SESSION_ORDER_KEY = 'improve-styles-last-order-id'

type CheckoutInitialProfile = CustomerProfile & {
  delivery_lat?: number | null
  delivery_lng?: number | null
}

export type DeliverySettings = {
  delivery_enabled: boolean
  pickup_enabled: boolean
  allow_shipping_other_states: boolean
}

function getEligibleCartItems(
  items: ReturnType<typeof useCart>['items'],
  coupon: NonNullable<Awaited<ReturnType<typeof validateCoupon>>['coupon']>
) {
  return getEligibleCouponItems(
    items.map((item) => ({
      ...item,
      productCategory: item.category ?? null,
    })),
    coupon
  )
}

function resolveDefaultDeliveryMethod(settings: DeliverySettings): 'delivery' | 'pickup' {
  if (settings.delivery_enabled) return 'delivery'
  if (settings.pickup_enabled) return 'pickup'
  return 'pickup'
}

export function CheckoutClient({
  initialProfile,
  orderId,
  initialCoupon,
  deliverySettings,
}: {
  initialProfile?: CheckoutInitialProfile | null
  orderId?: string
  initialCoupon?: string | null
  deliverySettings: DeliverySettings
}) {
  const { items, totalPrice, clearCart, isReady, appliedCoupon, applyCoupon, removeCoupon } = useCart()
  const showToast = useToast()
  const router = useRouter()
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const defaultMethod = resolveDefaultDeliveryMethod(deliverySettings)
  const showDeliverySelect = deliverySettings.delivery_enabled && deliverySettings.pickup_enabled

  const [customer, setCustomer] = useState<StoreOrderCustomer>({
    name: initialProfile?.full_name || '',
    phone: initialProfile?.whatsapp || '',
    notes: '',
    delivery_method: defaultMethod,
    payment_method: 'pix',
    installments: 1,
    delivery_address: initialProfile?.delivery_address || '',
    delivery_lat: initialProfile?.delivery_lat || null,
    delivery_lng: initialProfile?.delivery_lng || null,
  })
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<StoreOrder | null>(null)
  const [shippingZip, setShippingZip] = useState('')
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [shippingResult, setShippingResult] = useState<{
    cost: number
    estimatedDays: number
    zoneName: string | null
    zoneId: string | null
    isFree: boolean
    notFound: boolean
  } | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const recoveredOrder = useMemo(() => {
    const effectiveId =
      orderId || (typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_ORDER_KEY) : null)
    if (!effectiveId || !isReady || items.length > 0) return null
    const orders = readStoredOrders()
    return orders.find((order) => order.id === effectiveId) ?? null
  }, [orderId, isReady, items.length])

  const visibleOrder = submittedOrder ?? recoveredOrder

  useEffect(() => {
    if (initialCoupon && !appliedCoupon) {
      validateCoupon(initialCoupon).then((result) => {
        if (!result.valid || !result.coupon) return
        const eligibleItems = getEligibleCartItems(items, result.coupon)
        if (eligibleItems.length === 0) return
        if (!couponMeetsMinimumOrderValue(eligibleItems, result.coupon)) {
          return
        }
        applyCoupon(result.coupon)
      })
    }
  }, [appliedCoupon, applyCoupon, initialCoupon, items])

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0
    const scopedItems = items.map((item) => ({
      ...item,
      productCategory: item.category ?? null,
    }))
    const eligibleItems = getEligibleCouponItems(scopedItems, appliedCoupon)
    if (eligibleItems.length === 0) return 0
    return calculateCouponDiscountFromItems(eligibleItems, appliedCoupon)
  }, [appliedCoupon, items])

  const finalTotalPrice = Math.max(0, totalPrice - couponDiscount)
  const effectiveShippingCost =
    shippingResult && !shippingResult.notFound
      ? appliedCoupon?.discount_type === 'free_shipping'
        ? 0
        : shippingResult.cost
      : 0

  const isDelivery = customer.delivery_method === 'delivery'
  const hasRequiredCustomerData =
    customer.name.trim().length > 0 &&
    customer.phone.trim().length > 0 &&
    (!isDelivery || (customer.delivery_address.trim().length > 0 && shippingResult && !shippingResult.notFound))

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizacao nao suportada pelo navegador.')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomer((current) => ({
          ...current,
          delivery_lat: position.coords.latitude,
          delivery_lng: position.coords.longitude,
          delivery_address: current.delivery_address || 'Localizacao atual capturada via GPS (detalhe o numero/complemento).',
        }))
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
        setLocationError('Nao foi possivel obter sua localizacao.')
      },
      { enableHighAccuracy: true }
    )
  }

  if (!isReady) {
    return <div className="rounded-none border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando checkout...</div>
  }

  if (items.length === 0 && !submittedOrder) {
    return (
      <div className="rounded-none border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">Nao ha itens para finalizar.</p>
        <p className="mt-2 text-sm text-slate-500">Volte para a loja e adicione produtos ao carrinho.</p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-none bg-[var(--store-button-bg)] px-4 py-2.5 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90"
        >
          Voltar para a loja
        </Link>
      </div>
    )
  }

  if (visibleOrder) {
    return (
      <div className="rounded-none border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-800">Pedido salvo com sucesso.</p>
        <p className="mt-2 text-sm text-emerald-700">
          O pedido <span className="font-semibold">{visibleOrder.id}</span> foi registrado neste navegador e o carrinho foi liberado para uma nova compra.
        </p>
        <Link
          href="/conta"
          className="mt-5 inline-flex items-center justify-center rounded-none bg-[var(--store-button-bg)] px-4 py-2.5 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90"
        >
          Ver minha conta
        </Link>
      </div>
    )
  }

  async function handleCalculateShipping() {
    if (shippingZip.trim().length < 8) return
    setCalculatingShipping(true)
    setShippingResult(null)
    try {
      const result = await calculateShipping(shippingZip, { orderTotal: totalPrice })
      if (result.local) {
        setShippingResult({
          cost: result.local.price,
          estimatedDays: result.local.days,
          zoneName: result.local.zoneName,
          zoneId: null,
          isFree: result.local.isFree,
          notFound: false,
        })
      } else if (result.correios) {
        if (!deliverySettings.allow_shipping_other_states) {
          setShippingResult({ cost: 0, estimatedDays: 0, zoneName: null, zoneId: null, isFree: false, notFound: true })
        } else {
          setShippingResult({
            cost: result.correios.pac.price,
            estimatedDays: result.correios.pac.maxDays,
            zoneName: 'Correios PAC',
            zoneId: null,
            isFree: false,
            notFound: false,
          })
        }
      } else {
        setShippingResult({ cost: 0, estimatedDays: 0, zoneName: null, zoneId: null, isFree: false, notFound: true })
      }
    } catch {
      setShippingResult({ cost: 0, estimatedDays: 0, zoneName: null, zoneId: null, isFree: false, notFound: true })
    } finally {
      setCalculatingShipping(false)
    }
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setApplyingCoupon(true)
    setCouponError(null)
    try {
      const result = await validateCoupon(code)
      if (result.valid && result.coupon) {
        const eligibleItems = getEligibleCartItems(items, result.coupon)
        if (eligibleItems.length === 0) {
          setCouponError('Nenhum produto no carrinho e elegivel para este cupom.')
          return
        }

        if (!couponMeetsMinimumOrderValue(eligibleItems, result.coupon)) {
          setCouponError('O carrinho ainda nao atende ao valor minimo para este cupom.')
          return
        }

        applyCoupon(result.coupon)
        setCouponInput('')
        showToast({ variant: 'success', title: 'Cupom aplicado', description: `Desconto de ${result.coupon.code} aplicado.` })
      } else {
        setCouponError(result.error || 'Cupom invalido.')
      }
    } catch (actionError) {
      setCouponError(actionError instanceof Error ? actionError.message : 'Erro ao validar cupom.')
    } finally {
      setApplyingCoupon(false)
    }
  }

  function handleRemoveCoupon() {
    removeCoupon()
    setCouponError(null)
  }

  async function handleFinalizeOrder() {
    if (!hasRequiredCustomerData) return
    setIsSubmitting(true)
    try {
      const response = await submitOrder({
        customer,
        items,
        totalPrice,
        totalItems,
        shippingCost: shippingResult?.cost || 0,
        shippingZoneId: shippingResult?.zoneId || undefined,
        shippingZoneName: shippingResult?.zoneName || undefined,
        shippingZip: shippingResult?.notFound ? undefined : shippingZip,
        couponCode: appliedCoupon?.code || null,
      })

      const order: StoreOrder = {
        id: response.orderId,
        createdAt: new Date().toISOString(),
        customer,
        items,
        totalPrice: response.totalPrice,
        totalItems: response.totalItems,
        shipping: shippingResult
          ? {
              cost: response.shippingCost,
              zoneId: shippingResult.zoneId,
              zoneName: shippingResult.zoneName,
              zip: shippingZip,
              estimatedDays: shippingResult.estimatedDays,
            }
          : undefined,
      }

      saveStoreOrder(order)
      clearCart()
      removeCoupon()
      sessionStorage.setItem(SESSION_ORDER_KEY, response.orderId)
      setSubmittedOrder(order)
      router.replace(`/checkout?orderId=${response.orderId}`)
      showToast({
        variant: 'success',
        title: 'Pedido confirmado',
        description: `Pedido ${response.orderId} salvo com sucesso.`,
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao confirmar pedido',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
      <div className="rounded-none border border-[color:var(--store-card-border)] bg-[var(--store-card-bg)] p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Dados do pedido</h2>
        <p className="mt-2 text-sm text-slate-500">Preencha os dados e finalize o pedido.</p>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Nome (Associado a conta)</span>
            <input
              required
              readOnly
              name="name"
              value={customer.name}
              className="h-11 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none cursor-not-allowed"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Telefone / WhatsApp</span>
            <input
              required
              readOnly
              name="phone"
              value={customer.phone}
              className="h-11 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none cursor-not-allowed"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Forma de Pagamento</span>
            <select
              name="payment_method"
              value={customer.payment_method}
              onChange={(event) => setCustomer((current) => ({ ...current, payment_method: event.target.value }))}
              className="h-11 rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="pix">Pix</option>
              <option value="credit_card">Cartao de Credito</option>
              <option value="cash">Dinheiro</option>
            </select>
          </label>

          {customer.payment_method === 'credit_card' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Parcelamento</span>
              <select
                name="installments"
                value={customer.installments}
                onChange={(event) => setCustomer((current) => ({ ...current, installments: Number(event.target.value) }))}
                className="h-11 rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num}>
                    {num}x {num === 1 ? 'sem juros' : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showDeliverySelect ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Metodo de Entrega</span>
              <select
                name="delivery_method"
                value={customer.delivery_method}
                onChange={(event) => setCustomer((current) => ({ ...current, delivery_method: event.target.value }))}
                className="h-11 rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="delivery">Entrega (Delivery)</option>
                <option value="pickup">Retirar na Loja</option>
              </select>
            </label>
          ) : (
            <div className="rounded-none border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {customer.delivery_method === 'delivery' ? 'Entrega (Delivery)' : 'Retirada na Loja'}
            </div>
          )}

          {isDelivery ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Endereco de Entrega</span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--store-button-bg)] transition-colors hover:opacity-80 disabled:opacity-50"
                >
                  <Navigation2 className="h-3 w-3" />
                  {isLocating ? 'Buscando...' : 'Usar minha localizacao'}
                </button>
              </div>
              {locationError ? <p className="text-xs text-red-500">{locationError}</p> : null}
              {customer.delivery_lat && customer.delivery_lng ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-emerald-600">Localizacao exata capturada pelo GPS.</p>
                  <div className="overflow-hidden rounded-none border border-emerald-200 bg-emerald-50">
                    <iframe
                      title="Mapa de localização"
                      width="100%"
                      height="140"
                      style={{ border: 0, display: 'block' }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${customer.delivery_lat},${customer.delivery_lng}&hl=pt-BR&z=16&output=embed`}
                    />
                  </div>
                </div>
              ) : null}
              <textarea
                required
                name="delivery_address"
                rows={2}
                value={customer.delivery_address}
                onChange={(event) => setCustomer((current) => ({ ...current, delivery_address: event.target.value }))}
                placeholder="Rua, Numero, Bairro, Ponto de Referencia..."
                className="rounded-none border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          ) : null}

          {isDelivery ? (
            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Calcular frete</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={shippingZip}
                  onChange={(event) => { setShippingZip(event.target.value); setShippingResult(null) }}
                  placeholder="Digite seu CEP"
                  maxLength={9}
                  className="h-11 flex-1 rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={handleCalculateShipping}
                  disabled={calculatingShipping || shippingZip.trim().length < 8}
                  className="inline-flex h-11 items-center gap-2 rounded-none border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  {calculatingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                  Calcular frete
                </button>
              </div>
              {shippingResult ? (
                <div className={`mt-1 rounded-none border px-3 py-2 text-sm ${
                  shippingResult.notFound
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : shippingResult.isFree
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}>
                  {shippingResult.notFound ? (
                    'CEP nao encontrado nas zonas de entrega disponiveis.'
                  ) : shippingResult.isFree ? (
                    `Frete gratis! Entrega estimada em ${shippingResult.estimatedDays} dias uteis.`
                  ) : (
                    `Frete: ${formatMoney(shippingResult.cost)} • Entrega em ate ${shippingResult.estimatedDays} dias uteis`
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Cupom de desconto (Opcional)</span>
            <div className="flex gap-2">
              <input
                name="coupon"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase())
                  setCouponError(null)
                }}
                disabled={!!appliedCoupon}
                placeholder="Ex.: BOASVINDAS20"
                className="h-11 flex-1 rounded-none border border-slate-200 px-3 text-sm uppercase text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="inline-flex h-11 items-center gap-1.5 rounded-none border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                >
                  <X className="h-3.5 w-3.5" />
                  Remover
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || applyingCoupon}
                  className="inline-flex h-11 items-center gap-1.5 rounded-none border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  {applyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TicketPercent className="h-3.5 w-3.5" />}
                  Aplicar
                </button>
              )}
            </div>
            {couponError ? <p className="text-xs text-red-500">{couponError}</p> : null}
            {appliedCoupon ? (
              <p className="text-xs text-emerald-600">
                Cupom <span className="font-semibold">{appliedCoupon.code}</span> aplicado
                ({appliedCoupon.discount_type === 'free_shipping' ? 'Frete gratis' : appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : formatMoney(appliedCoupon.discount_value)} de desconto)
              </p>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Observacao (Opcional)</span>
            <textarea
              name="notes"
              rows={2}
              value={customer.notes}
              onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))}
              className="rounded-none border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleFinalizeOrder}
            disabled={!hasRequiredCustomerData || isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-none bg-[var(--store-button-bg)] px-4 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Finalizar pedido'
            )}
          </button>
        </div>
      </div>

      <aside className="rounded-none border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Resumo do pedido</h2>
        <div className="mt-4 rounded-none border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
          Revise os dados ao lado. Ao confirmar, o pedido sera salvo neste navegador e o carrinho sera esvaziado.
        </div>
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.colorName ? `Cor: ${item.colorName}` : ''}
                  {item.colorName && item.size ? ' • ' : ''}
                  {item.size ? `Tam: ${item.size}` : ''}
                  {item.colorName || item.size ? ' • ' : ''}
                  Qtd: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-900">{formatMoney(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        {appliedCoupon ? (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-emerald-600">Desconto ({appliedCoupon.code})</span>
            <span className="font-medium text-emerald-600">
              {appliedCoupon.discount_type === 'free_shipping' ? 'Frete gratis' : `-${formatMoney(couponDiscount)}`}
            </span>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-slate-500">{appliedCoupon ? 'Total com desconto' : 'Total geral'}</span>
          <span className="text-2xl font-semibold text-slate-950">{formatMoney(finalTotalPrice)}</span>
        </div>

        {shippingResult && !shippingResult.notFound ? (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm text-slate-500">
              Frete{shippingResult.isFree ? ' (gratis)' : ''}
            </span>
            <span className="text-sm font-medium text-slate-900">
              {effectiveShippingCost === 0 ? 'Gratis' : formatMoney(effectiveShippingCost)}
            </span>
          </div>
        ) : null}
        {shippingResult && shippingResult.notFound ? (
          <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-amber-600">
            CEP nao encontrado para calculo de frete.
          </div>
        ) : null}

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-medium text-slate-700">Total</span>
          <span className="text-2xl font-semibold text-slate-950">
            {formatMoney(finalTotalPrice + effectiveShippingCost)}
          </span>
        </div>

        <div className="mt-5 rounded-none bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">
            {isDelivery ? 'Entrega para' : 'Retirar na Loja'}
          </p>
          <p className="mt-2">{customer.name || 'Nome ainda nao informado'}</p>
          <p>{customer.phone || 'Telefone ainda nao informado'}</p>
          {isDelivery ? (
            <p className="mt-2 text-slate-500">
              {customer.delivery_address ? (
                <>
                  <MapPin className="mb-0.5 mr-1.5 inline-block h-3.5 w-3.5" />
                  {customer.delivery_address}
                </>
              ) : 'Endereco nao informado'}
            </p>
          ) : null}
          {shippingResult && !shippingResult.notFound ? (
            <p className="mt-2 text-slate-500">
              <Truck className="mb-0.5 mr-1.5 inline-block h-3.5 w-3.5" />
              {effectiveShippingCost === 0 ? 'Frete gratis' : `Frete: ${formatMoney(effectiveShippingCost)}`}
              {shippingResult.estimatedDays > 0 ? ` • ${shippingResult.estimatedDays} dias uteis` : ''}
            </p>
          ) : null}
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="font-medium text-slate-900">Pagamento: {
              customer.payment_method === 'pix' ? 'Pix' :
              customer.payment_method === 'cash' ? 'Dinheiro' :
              `Cartao em ${customer.installments}x`
            }</p>
          </div>
          {customer.notes ? <p className="mt-3 text-slate-500 italic">&quot;{customer.notes}&quot;</p> : null}
        </div>
      </aside>
    </div>
  )
}
