'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronLeft, Loader2, MapPin, Pencil, ShoppingCart, TicketPercent, Truck, X } from 'lucide-react'
import { useCart } from '@/components/store/CartProvider'
import { useDirectCheckout, clearDirectCheckout } from '@/lib/direct-checkout'
import { useToast } from '@/components/ui/feedback-provider'
import type { CustomerProfile } from '@/lib/customer-shared'
import {
  calculateCouponDiscountFromItems,
  couponMeetsMinimumOrderValue,
  getEligibleCouponItems,
} from '@/lib/store-coupons'
import { formatMoney } from '@/lib/storefront'
import { submitOrder, validateCoupon } from '@/app/checkout/actions'
import { calculateShipping, type ShippingCalculation } from '@/lib/shipping'
import { readStoredOrders, saveStoreOrder, type StoreOrder, type StoreOrderCustomer } from '@/lib/store-orders'

const SESSION_ORDER_KEY = 'improve-styles-last-order-id'
const CHECKOUT_PERSIST_KEY = 'improve-styles-checkout-data'

type CheckoutInitialProfile = CustomerProfile & {
  delivery_zip_code?: string | null
  delivery_city?: string | null
  delivery_state?: string | null
  delivery_neighborhood?: string | null
  delivery_house_number?: string | null
  delivery_complement?: string | null
  delivery_reference?: string | null
  delivery_lat?: number | null
  delivery_lng?: number | null
}

export type DeliverySettings = {
  delivery_enabled: boolean
  pickup_enabled: boolean
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

type CheckoutStep = 'form' | 'review'

type FieldErrors = {
  name?: string
  phone?: string
  delivery_address?: string
  shippingZip?: string
}

function readPersistedCheckout(): { shippingZip: string; delivery_address: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CHECKOUT_PERSIST_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistCheckout(data: { shippingZip: string; delivery_address: string }) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHECKOUT_PERSIST_KEY, JSON.stringify(data))
}

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'form', label: 'Dados do pedido' },
  { key: 'review', label: 'Revisar' },
]

function computeInstallments(total: number, count: number) {
  const value = total / count
  return { value, formatted: formatMoney(value) }
}

function resolveShippingIcon(result: { isFree: boolean; notFound: boolean }) {
  if (result.notFound) return { Icon: AlertTriangle, color: 'text-amber-500' }
  if (result.isFree) return { Icon: CheckCircle2, color: 'text-emerald-500' }
  return { Icon: Truck, color: 'text-blue-500' }
}

export function CheckoutClient({
  initialProfile,
  orderId,
  initialCoupon,
  deliverySettings,
  initialShippingCep,
  initialShippingResult,
  storeAddress,
  storeAddressLat,
  storeAddressLng,
}: {
  initialProfile?: CheckoutInitialProfile | null
  orderId?: string
  initialCoupon?: string | null
  deliverySettings: DeliverySettings
  initialShippingCep?: string | null
  initialShippingResult?: ShippingCalculation | null
  storeAddress?: string | null
  storeAddressLat?: number | null
  storeAddressLng?: number | null
}) {
  const { items, clearCart, isReady, appliedCoupon, applyCoupon, removeCoupon } = useCart()
  const showToast = useToast()
  const router = useRouter()
  const directCheckoutItems = useDirectCheckout()
  const isBuyNow = directCheckoutItems !== null
  const checkoutItems = useMemo(() => isBuyNow ? directCheckoutItems : items, [directCheckoutItems, isBuyNow, items])
  const checkoutTotalPrice = useMemo(() => checkoutItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [checkoutItems])
  const checkoutTotalItems = useMemo(() => checkoutItems.reduce((sum, i) => sum + i.quantity, 0), [checkoutItems])
  const defaultMethod = resolveDefaultDeliveryMethod(deliverySettings)
  const showDeliverySelect = deliverySettings.delivery_enabled && deliverySettings.pickup_enabled

  const persisted = readPersistedCheckout()

  const profileZip = useMemo(() => {
    const raw = (initialProfile as CheckoutInitialProfile)?.delivery_zip_code
    return raw?.replace(/\D/g, '').slice(0, 8) || ''
  }, [initialProfile])

  const profileFormattedAddress = useMemo(() => {
    const p = initialProfile as CheckoutInitialProfile | null | undefined
    if (!p) return null
    const isLegacy = Boolean(p.delivery_address && !p.delivery_house_number)
    if (isLegacy) {
      const legacyText = p.delivery_address as string
      const zipMatch = legacyText.match(/\b(\d{5})[-]?(\d{3})\b/)
      const legacyZip = zipMatch ? `${zipMatch[1]}${zipMatch[2]}` : ''
      return {
        display: legacyText,
        local: false,
        zip: legacyZip || null,
        street: null,
        number: null,
        neighborhood: null,
        city: null,
        state: null,
      }
    }
    const parts: string[] = []
    const street = p.delivery_address || ''
    const number = p.delivery_house_number || ''
    const neighborhood = p.delivery_neighborhood || ''
    const city = p.delivery_city || ''
    const state = p.delivery_state || ''
    const zip = p.delivery_zip_code || ''
    if (!city && !zip) {
      return street
        ? {
            display: street,
            local: false,
            zip: null,
            street: street,
            number: null,
            neighborhood: null,
            city: null,
            state: null,
          }
        : null
    }
    if (number) parts.push(`${street}, ${number}`)
    else if (street) parts.push(street)
    if (neighborhood) parts.push(neighborhood)
    if (city && state) parts.push(`${city}/${state}`)
    else if (city) parts.push(city)
    return {
      street: street || null,
      number: number || null,
      neighborhood: neighborhood || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      display: parts.join(' — ') + (zip ? ` — ${zip}` : ''),
      local: true,
    }
  }, [initialProfile])

  const addressHasUsableCep = profileFormattedAddress?.zip?.length === 8

  const initialAddressText = useMemo(() => {
    if (profileFormattedAddress?.local) {
      return profileFormattedAddress.display
    }
    return initialProfile?.delivery_address || persisted?.delivery_address || ''
  }, [profileFormattedAddress, initialProfile, persisted])

  const [customer, setCustomer] = useState<StoreOrderCustomer>({
    name: initialProfile?.full_name || '',
    phone: initialProfile?.whatsapp || '',
    notes: '',
    delivery_method: defaultMethod,
    payment_method: 'pix',
    installments: 1,
    delivery_address: initialAddressText,
    delivery_lat: initialProfile?.delivery_lat || null,
    delivery_lng: initialProfile?.delivery_lng || null,
  })
  const [activeStep, setActiveStep] = useState<CheckoutStep>('form')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<StoreOrder | null>(null)
  const [shippingZip, setShippingZip] = useState(
    initialShippingCep || persisted?.shippingZip || profileZip || (profileFormattedAddress?.local === false ? profileFormattedAddress?.zip : null) || ''
  )
  const [showAlternateCep, setShowAlternateCep] = useState(false)
  const [alternateCep, setAlternateCep] = useState('')
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [shippingResult, setShippingResult] = useState<{
    cost: number
    estimatedDays: number
    zoneName: string | null
    zoneId: string | null
    isFree: boolean
    notFound: boolean
  } | null>(() => {
    if (initialShippingResult?.local) {
      return {
        cost: initialShippingResult.local.price,
        estimatedDays: initialShippingResult.local.days,
        zoneName: initialShippingResult.local.zoneName,
        zoneId: null,
        isFree: initialShippingResult.local.isFree,
        notFound: false,
      }
    }
    if (initialShippingResult && !initialShippingResult.local) {
      return { cost: 0, estimatedDays: 0, zoneName: null, zoneId: null, isFree: false, notFound: true }
    }
    return null
  })
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [clientHydrated, setClientHydrated] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const cleanupEnabled = useRef(false)

  useEffect(() => {
    setClientHydrated(true)
    const timer = setTimeout(() => {
      cleanupEnabled.current = true
    }, 0)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  const recoveredOrder = useMemo(() => {
    const effectiveId =
      orderId || (typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_ORDER_KEY) : null)
    if (!effectiveId || !isReady || checkoutItems.length > 0) return null
    const orders = readStoredOrders()
    return orders.find((order) => order.id === effectiveId) ?? null
  }, [orderId, isReady, checkoutItems.length])

  const visibleOrder = submittedOrder ?? recoveredOrder

  useEffect(() => {
    if (initialCoupon && !appliedCoupon) {
      validateCoupon(initialCoupon).then((result) => {
        if (!result.valid || !result.coupon) return
        const eligibleItems = getEligibleCartItems(checkoutItems, result.coupon)
        if (eligibleItems.length === 0) return
        if (!couponMeetsMinimumOrderValue(eligibleItems, result.coupon)) {
          return
        }
        applyCoupon(result.coupon)
      })
    }
  }, [appliedCoupon, applyCoupon, initialCoupon, checkoutItems])

  useEffect(() => {
    return () => {
      if (cleanupEnabled.current) {
        clearDirectCheckout()
      }
    }
  }, [])

  const persistCustomerData = useCallback(() => {
    persistCheckout({ shippingZip, delivery_address: customer.delivery_address })
  }, [shippingZip, customer.delivery_address])

  useEffect(() => {
    if (clientHydrated) {
      persistCustomerData()
    }
  }, [shippingZip, customer.delivery_address, clientHydrated, persistCustomerData])

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0
    const scopedItems = checkoutItems.map((item) => ({
      ...item,
      productCategory: item.category ?? null,
    }))
    const eligibleItems = getEligibleCouponItems(scopedItems, appliedCoupon)
    if (eligibleItems.length === 0) return 0
    return calculateCouponDiscountFromItems(eligibleItems, appliedCoupon)
  }, [appliedCoupon, checkoutItems])

  const finalTotalPrice = Math.max(0, checkoutTotalPrice - couponDiscount)
  const effectiveShippingCost =
    shippingResult && !shippingResult.notFound
      ? appliedCoupon?.discount_type === 'free_shipping'
        ? 0
        : shippingResult.cost
      : 0

  const isDelivery = customer.delivery_method === 'delivery' && deliverySettings.delivery_enabled

  const validateField = useCallback((field: string, value: string): string | undefined => {
    switch (field) {
      case 'name':
        return value.trim().length === 0 ? 'Nome e obrigatorio.' : undefined
      case 'phone':
        return value.trim().length === 0 ? 'Telefone e obrigatorio.' : undefined
      case 'shippingZip': {
        if (!isDelivery) return undefined
        const clean = value.replace(/\D/g, '')
        if (clean.length > 0 && clean.length !== 8) return 'CEP deve ter 8 digitos.'
        return undefined
      }
      default:
        return undefined
    }
  }, [isDelivery])

  const validateAll = useCallback((): FieldErrors => {
    const errors: FieldErrors = {}
    const nameErr = validateField('name', customer.name)
    if (nameErr) errors.name = nameErr
    const phoneErr = validateField('phone', customer.phone)
    if (phoneErr) errors.phone = phoneErr
    return errors
  }, [validateField, customer.name, customer.phone])

  const shippingStepValid =
    !isDelivery || (shippingResult && !shippingResult.notFound)

  const isFormValid =
    customer.name.trim().length > 0 &&
    customer.phone.trim().length > 0 &&
    shippingStepValid

  function handleFieldBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = field === 'name' ? customer.name :
      field === 'phone' ? customer.phone :
      shippingZip
    const error = validateField(field, value)
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (error) next[field as keyof FieldErrors] = error
      else delete next[field as keyof FieldErrors]
      return next
    })
  }

  function handleFieldChange(field: string, value: string) {
    if (touched[field]) {
      const error = validateField(field, value)
      setFieldErrors((prev) => {
        const next = { ...prev }
        if (error) next[field as keyof FieldErrors] = error
        else delete next[field as keyof FieldErrors]
        return next
      })
    }
  }

  useEffect(() => {
    const clean = shippingZip.replace(/\D/g, '')
    if (clean.length === 8) {
      handleCalculateShipping()
    }
  }, [shippingZip])

  if (!isReady || !clientHydrated) {
    return <div className="rounded-none border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando checkout...</div>
  }

  if (checkoutItems.length === 0 && !submittedOrder) {
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
    const isPickup = visibleOrder.customer.delivery_method === 'pickup'
    const hasMap = isPickup && storeAddressLat != null && storeAddressLng != null

    return (
      <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
        <div className="rounded-t-2xl bg-emerald-50 px-6 py-8 text-center sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-emerald-800">Compra realizada com sucesso!</p>
          <p className="mt-2 text-sm leading-6 text-emerald-700">
            Sua solicitacao ja foi enviada para a loja. Em breve voce podera acompanhar o status do pedido.
          </p>
          <p className="mt-2 text-xs text-emerald-600">
            Pedido <span className="font-semibold">{visibleOrder.id}</span>
          </p>
        </div>

        {isPickup && storeAddress ? (
          <div className="space-y-4 px-6 py-6 sm:px-10">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Local de retirada</p>
                <p className="mt-1 text-sm text-slate-600">{storeAddress}</p>
              </div>
            </div>

            {hasMap ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <iframe
                  title="Local de retirada"
                  src={`https://maps.google.com/maps?q=${storeAddressLat},${storeAddressLng}&hl=pt-BR&z=16&output=embed`}
                  className="h-56 w-full border-0 sm:h-64"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-b-2xl border-t border-slate-100 px-6 py-5 sm:px-10">
          <Link
            href="/conta/pedidos"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--store-button-bg)] px-6 py-3 text-sm font-semibold text-[var(--store-button-fg)] transition-colors hover:opacity-90 sm:w-auto"
          >
            Ver minha compra
          </Link>
        </div>
      </div>
    )
  }

  async function handleCalculateShipping(cepOverride?: string) {
    const clean = (cepOverride ?? shippingZip).replace(/\D/g, '')
    if (clean.length < 8) return
    setCalculatingShipping(true)
    if (!cepOverride) setShippingResult(null)
    try {
      const result = await calculateShipping(clean, { orderTotal: checkoutTotalPrice })
      if (result.local) {
        setShippingResult({
          cost: result.local.price,
          estimatedDays: result.local.days,
          zoneName: result.local.zoneName,
          zoneId: null,
          isFree: result.local.isFree,
          notFound: false,
        })
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
        const eligibleItems = getEligibleCartItems(checkoutItems, result.coupon)
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

  function handleToggleAlternateCep() {
    if (showAlternateCep) {
      setShowAlternateCep(false)
      setAlternateCep('')
      const profileCep = profileZip
      if (profileCep.length === 8) {
        setShippingZip(profileCep)
        handleCalculateShipping(profileCep)
      }
      setCustomer((c) => ({ ...c, delivery_address: initialAddressText }))
    } else {
      setShowAlternateCep(true)
      setAlternateCep('')
    }
  }

  function handleApplyAlternateCep() {
    const clean = alternateCep.replace(/\D/g, '').slice(0, 8)
    if (clean.length < 8) return
    setShippingZip(clean)
    const altAddress = `CEP: ${clean.replace(/^(\d{5})(\d{3})$/, '$1-$2')}`
    setCustomer((c) => ({ ...c, delivery_address: altAddress }))
    handleCalculateShipping(clean)
    setShowAlternateCep(false)
  }

  function handleGoToReview() {
    const errors = validateAll()
    setFieldErrors(errors)
    setTouched({ name: true, phone: true, shippingZip: true })
    if (Object.keys(errors).length > 0) return
    if (isDelivery && (!shippingResult || shippingResult.notFound)) return
    setActiveStep('review')
  }

  async function handleFinalizeOrder() {
    setIsSubmitting(true)
    setShowConfirmModal(false)
    try {
      const response = await submitOrder({
        customer,
        items: checkoutItems,
        totalPrice: checkoutTotalPrice,
        totalItems: checkoutTotalItems,
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
        items: checkoutItems,
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
      if (isBuyNow) {
        clearDirectCheckout()
      } else {
        clearCart()
      }
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
      setActiveStep('form')
      showToast({
        variant: 'error',
        title: 'Falha ao confirmar pedido',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderAddressCard() {
    const addr = profileFormattedAddress
    if (!addr?.local) return null
    return (
      <div className="space-y-0.5 text-sm text-slate-700">
        {addr.street && addr.number ? (
          <p className="font-medium text-slate-900">{addr.street}, {addr.number}</p>
        ) : addr.street ? (
          <p className="font-medium text-slate-900">{addr.street}</p>
        ) : null}
        {addr.neighborhood ? (
          <p className="text-slate-500">{addr.neighborhood}</p>
        ) : null}
        <p className="text-slate-500">
          {addr.city}{addr.state ? `/${addr.state}` : ''}{addr.zip ? ` — ${addr.zip.replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : ''}
        </p>
      </div>
    )
  }

  const grandTotal = finalTotalPrice + effectiveShippingCost

  const freightIcon = shippingResult ? resolveShippingIcon(shippingResult) : null
  const FreightIcon = freightIcon?.Icon

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
      <div className="rounded-none border border-[color:var(--store-card-border)] bg-[var(--store-card-bg)] p-4 sm:p-6">
        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((step, index) => {
            const isActive = activeStep === step.key
            const isPast = activeStep === 'review' && step.key === 'form'
            return (
              <div key={step.key} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isActive ? 'bg-[var(--store-button-bg)] text-[var(--store-button-fg)]' :
                  isPast ? 'bg-emerald-500 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {isPast ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-slate-900' : isPast ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {index < STEPS.length - 1 ? <div className="mx-1 h-px w-8 bg-slate-200" /> : null}
              </div>
            )
          })}
        </div>

        {activeStep === 'form' ? (
          <>
            <h2 className="text-xl font-semibold text-slate-950">Dados do pedido</h2>
            <p className="mt-2 text-sm text-slate-500">Preencha os dados para continuar.</p>
            <div className="mt-5 grid gap-4">
              {isDelivery ? (
                <div className="rounded-none border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">
                        {profileFormattedAddress ? 'Entregar em' : 'Endereco de entrega'}
                      </span>
                    </div>
                    {profileFormattedAddress?.local ? (
                      <button
                        type="button"
                        onClick={handleToggleAlternateCep}
                        className="flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-[var(--store-button-bg)]"
                      >
                        <Pencil className="h-3 w-3" />
                        {showAlternateCep ? 'Usar meu endereco' : 'Outro CEP'}
                      </button>
                    ) : null}
                  </div>

                  {showAlternateCep ? (
                    <div className="space-y-3">
                      <div className="rounded-none border border-slate-200 bg-white p-3 opacity-50">
                        <p className="text-xs font-medium text-slate-500 mb-1">Endereco cadastrado</p>
                        {renderAddressCard()}
                      </div>
                      <div>
                        <label htmlFor="alternate-cep" className="text-xs font-medium text-slate-500 mb-1 block">Informe o CEP de entrega</label>
                        <div className="flex gap-2">
                          <input
                            id="alternate-cep"
                            type="text"
                            inputMode="numeric"
                            value={alternateCep}
                            onChange={(e) => setAlternateCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            placeholder="00000-000"
                            maxLength={9}
                            className="h-10 flex-1 rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                          <button
                            type="button"
                            onClick={handleApplyAlternateCep}
                            disabled={calculatingShipping || alternateCep.replace(/\D/g, '').length < 8}
                            className="inline-flex h-10 items-center gap-1.5 rounded-none border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                          >
                            {calculatingShipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Aplicar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {profileFormattedAddress ? (
                        <>
                          {profileFormattedAddress.local ? renderAddressCard() : (
                            <div className="text-sm text-slate-700">
                              <p className="font-medium text-slate-900">{profileFormattedAddress.display}</p>
                            </div>
                          )}
                          {!addressHasUsableCep ? (
                            <div className="mt-3">
                              <label htmlFor="checkout-cep" className="text-xs font-medium text-slate-500 mb-1 block">Informe o CEP para calcular o frete</label>
                              <div className="flex gap-2">
                                <input
                                  id="checkout-cep"
                                  type="text"
                                  inputMode="numeric"
                                  value={shippingZip}
                                  onChange={(event) => {
                                    const val = event.target.value.replace(/\D/g, '').slice(0, 8)
                                    setShippingZip(val)
                                    if (val.length !== 8) setShippingResult(null)
                                  }}
                                  onBlur={() => handleFieldBlur('shippingZip')}
                                  placeholder="00000-000"
                                  maxLength={9}
                                  className={`h-10 w-40 rounded-none border px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200 ${
                                    touched.shippingZip && fieldErrors.shippingZip ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCalculateShipping()}
                                  disabled={calculatingShipping || shippingZip.replace(/\D/g, '').length < 8}
                                  className="inline-flex h-10 items-center gap-1.5 rounded-none border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                                >
                                  {calculatingShipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                                  Calcular
                                </button>
                              </div>
                              {touched.shippingZip && fieldErrors.shippingZip ? (
                                <p className="mt-1 text-xs text-red-500">{fieldErrors.shippingZip}</p>
                              ) : null}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="rounded-none border border-dashed border-slate-200 bg-white p-4 text-center">
                          <p className="text-sm text-slate-400">Nenhum endereco cadastrado.</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Cadastre seu endereco em <Link href="/conta/enderecos" className="underline hover:text-slate-600">Minha Conta &gt; Enderecos</Link>
                          </p>
                          <div className="mt-3">
                            <label htmlFor="checkout-cep-fallback" className="text-xs font-medium text-slate-500 mb-1 block">Informe o CEP para calcular o frete</label>
                            <div className="flex gap-2 justify-center">
                              <input
                                id="checkout-cep-fallback"
                                type="text"
                                inputMode="numeric"
                                value={shippingZip}
                                onChange={(event) => {
                                  const val = event.target.value.replace(/\D/g, '').slice(0, 8)
                                  setShippingZip(val)
                                  if (val.length !== 8) setShippingResult(null)
                                }}
                                onBlur={() => handleFieldBlur('shippingZip')}
                                placeholder="00000-000"
                                maxLength={9}
                                className={`h-10 w-40 rounded-none border px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200 ${
                                  touched.shippingZip && fieldErrors.shippingZip ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleCalculateShipping()}
                                disabled={calculatingShipping || shippingZip.replace(/\D/g, '').length < 8}
                                className="inline-flex h-10 items-center gap-1.5 rounded-none border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                              >
                                {calculatingShipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                                Calcular
                              </button>
                            </div>
                            {touched.shippingZip && fieldErrors.shippingZip ? (
                              <p className="mt-1 text-xs text-red-500">{fieldErrors.shippingZip}</p>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {shippingResult ? (
                    <div className={`mt-3 rounded-none border px-3 py-2.5 text-sm ${
                      shippingResult.notFound
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : shippingResult.isFree
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-blue-200 bg-blue-50 text-blue-700'
                    }`}>
                      {shippingResult.notFound ? (
                        'CEP nao encontrado nas zonas de entrega disponiveis.'
                      ) : shippingResult.isFree ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Frete gratis{shippingResult.estimatedDays > 0 ? ` • Entrega em ate ${shippingResult.estimatedDays} dias uteis` : ''}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Truck className="h-4 w-4" />
                          Frete: {formatMoney(shippingResult.cost)}{shippingResult.estimatedDays > 0 ? ` • ${shippingResult.estimatedDays} dias uteis` : ''}
                        </span>
                      )}
                    </div>
                  ) : calculatingShipping ? (
                    <div className="mt-3 flex items-center gap-2 rounded-none border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculando frete...
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showDeliverySelect ? (
                <div className="grid gap-2">
                  <label htmlFor="checkout-delivery-method" className="text-sm font-medium text-slate-700">Metodo de Entrega</label>
                  <select
                    id="checkout-delivery-method"
                    value={customer.delivery_method}
                    onChange={(event) => setCustomer((current) => ({ ...current, delivery_method: event.target.value }))}
                    className="h-11 rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {deliverySettings.delivery_enabled ? <option value="delivery">Entrega (Delivery)</option> : null}
                    {deliverySettings.pickup_enabled ? <option value="pickup">Retirar na Loja</option> : null}
                  </select>
                </div>
              ) : (
                <div className="rounded-none border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  {deliverySettings.delivery_enabled ? 'Entrega (Delivery)' : deliverySettings.pickup_enabled ? 'Retirada na Loja' : 'Metodo indisponivel'}
                </div>
              )}

              <div className="grid gap-2">
                <label htmlFor="checkout-name" className="text-sm font-medium text-slate-700">Nome (Associado a conta)</label>
                <input
                  id="checkout-name"
                  required
                  readOnly
                  value={customer.name}
                  className="h-11 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="checkout-phone" className="text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
                <input
                  id="checkout-phone"
                  required
                  readOnly
                  value={customer.phone}
                  className="h-11 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="checkout-payment" className="text-sm font-medium text-slate-700">Forma de Pagamento</label>
                <select
                  id="checkout-payment"
                  value={customer.payment_method}
                  onChange={(event) => setCustomer((current) => ({ ...current, payment_method: event.target.value }))}
                  className="h-11 rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="pix">Pix</option>
                  <option value="credit_card">Cartao de Credito</option>
                  <option value="cash">Dinheiro</option>
                  <option value="card_on_delivery">Cartao na Entrega</option>
                </select>
              </div>

              {customer.payment_method === 'credit_card' ? (
                <div className="grid gap-2">
                  <label htmlFor="checkout-installments" className="text-sm font-medium text-slate-700">Parcelamento</label>
                  <select
                    id="checkout-installments"
                    value={customer.installments}
                    onChange={(event) => setCustomer((current) => ({ ...current, installments: Number(event.target.value) }))}
                    className="h-11 rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                      const inst = computeInstallments(grandTotal, num)
                      return (
                        <option key={num} value={num}>
                          {num}x de {inst.formatted}{num === 1 ? ' sem juros' : ''}
                        </option>
                      )
                    })}
                  </select>

                  {grandTotal > 0 ? (
                    <div className="mt-1 rounded-none border border-slate-200 bg-slate-50">
                      <table className="w-full text-xs text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-3 py-2 text-left font-medium text-slate-700">Parcelas</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700">Valor</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                            const inst = computeInstallments(grandTotal, num)
                            return (
                              <tr key={num} className={`border-b border-slate-100 last:border-0 ${num === customer.installments ? 'bg-blue-50 font-semibold text-blue-700' : ''}`}>
                                <td className="px-3 py-1.5">{num}x</td>
                                <td className="px-3 py-1.5 text-right">{inst.formatted}</td>
                                <td className="px-3 py-1.5 text-right">{formatMoney(grandTotal)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2">
                <label htmlFor="checkout-coupon" className="text-sm font-medium text-slate-700">Cupom de desconto (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    id="checkout-coupon"
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
              </div>

              <div className="grid gap-2">
                <label htmlFor="checkout-notes" className="text-sm font-medium text-slate-700">Observacao (Opcional)</label>
                <textarea
                  id="checkout-notes"
                  rows={2}
                  value={customer.notes}
                  onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))}
                  className="rounded-none border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoToReview}
                disabled={!isFormValid}
                className="inline-flex h-12 w-full items-center justify-center rounded-none bg-[var(--store-button-bg)] px-4 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90 disabled:opacity-50"
              >
                Continuar para revisao
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-950">Revisar pedido</h2>
            <p className="mt-2 text-sm text-slate-500">Confira os dados antes de finalizar.</p>

            <div className="mt-5 space-y-4 rounded-none border border-slate-100 bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nome</span>
                <span className="font-medium text-slate-900">{customer.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Telefone</span>
                <span className="font-medium text-slate-900">{customer.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pagamento</span>
                <span className="font-medium text-slate-900">
                  {customer.payment_method === 'pix' ? 'Pix' :
                   customer.payment_method === 'credit_card' ? `Cartao em ${customer.installments}x` :
                   customer.payment_method === 'card_on_delivery' ? 'Cartao na Entrega' :
                   'Dinheiro'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Metodo</span>
                <span className="font-medium text-slate-900">
                  {isDelivery ? 'Entrega (Delivery)' : 'Retirada na Loja'}
                </span>
              </div>
              {isDelivery ? (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div>
                    <span className="text-xs text-slate-400">Endereco de entrega</span>
                    {profileFormattedAddress?.local ? (
                      <div className="mt-1 text-sm text-slate-700">
                        {renderAddressCard()}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm font-medium text-slate-900">{customer.delivery_address || '-'}</p>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Frete</span>
                    <span className="font-medium text-slate-900">
                      {shippingResult && !shippingResult.notFound
                        ? effectiveShippingCost === 0 ? 'Gratis' : formatMoney(effectiveShippingCost)
                        : 'Nao calculado'}
                    </span>
                  </div>
                  {shippingResult && !shippingResult.notFound && shippingResult.estimatedDays > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Prazo</span>
                      <span className="font-medium text-slate-900">Ate {shippingResult.estimatedDays} dias uteis</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {appliedCoupon ? (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cupom</span>
                  <span className="font-medium text-emerald-600">{appliedCoupon.code}</span>
                </div>
              ) : null}
              {customer.notes ? (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Observacao</span>
                  <span className="max-w-[200px] text-right font-medium text-slate-900 italic">{customer.notes}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveStep('form')}
                className="inline-flex h-12 items-center gap-2 rounded-none border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-none bg-[var(--store-button-bg)] px-4 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90"
              >
                Finalizar pedido
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside className="rounded-none border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">Resumo do pedido</h2>
          {!isBuyNow ? (
            <Link href="/carrinho" className="flex items-center gap-1 text-xs font-medium text-[var(--store-button-bg)] transition-colors hover:opacity-80">
              <ShoppingCart className="h-3.5 w-3.5" />
              Editar carrinho
            </Link>
          ) : null}
        </div>
        <div className="mt-4 rounded-none border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
          {isBuyNow
            ? 'Compra direta. Ao confirmar, apenas este produto sera incluido no pedido.'
            : 'Revise os dados ao lado. Ao confirmar, o pedido sera salvo neste navegador e o carrinho sera esvaziado.'}
        </div>
        <div className="mt-5 space-y-4">
          {checkoutItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 border-b border-slate-100 pb-4">
              {item.image ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.colorName ? `Cor: ${item.colorName}` : ''}
                  {item.colorName && item.size ? ' • ' : ''}
                  {item.size ? `Tam: ${item.size}` : ''}
                  {item.colorName || item.size ? ' • ' : ''}
                  Qtd: {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-slate-900">{formatMoney(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-900">{formatMoney(checkoutTotalPrice)}</span>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600">Desconto ({appliedCoupon.code})</span>
              <span className="font-medium text-emerald-600">-{formatMoney(couponDiscount)}</span>
            </div>
          ) : null}

          {shippingResult && !shippingResult.notFound ? (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-slate-500">
                {FreightIcon ? <FreightIcon className={`h-3.5 w-3.5 ${freightIcon.color}`} /> : null}
                Frete{shippingResult.isFree ? ' (gratis)' : ''}
              </span>
              <span className="font-medium text-slate-900">
                {effectiveShippingCost === 0 ? 'Gratis' : formatMoney(effectiveShippingCost)}
              </span>
            </div>
          ) : null}
          {shippingResult && shippingResult.notFound ? (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              CEP nao encontrado para calculo de frete.
            </div>
          ) : null}

          {appliedCoupon && couponDiscount > 0 ? (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Valor original</span>
              <span className="line-through">{formatMoney(checkoutTotalPrice)}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-medium text-slate-700">Total</span>
          <span className="text-2xl font-semibold text-slate-950">
            {formatMoney(grandTotal)}
          </span>
        </div>

        <div className="mt-5 rounded-none bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">
            {isDelivery ? 'Entrega para' : deliverySettings.pickup_enabled ? 'Retirar na Loja' : 'Sem entrega definida'}
          </p>
          <p className="mt-2">{customer.name || 'Nome ainda nao informado'}</p>
          <p>{customer.phone || 'Telefone ainda nao informado'}</p>
          {isDelivery ? (
            <div className="mt-2">
              {profileFormattedAddress?.local ? (
                <div className="text-slate-500">
                  <MapPin className="mb-0.5 mr-1.5 inline-block h-3.5 w-3.5" />
                  <span className="text-xs">{profileFormattedAddress.display}</span>
                </div>
              ) : customer.delivery_address ? (
                <p className="text-slate-500">
                  <MapPin className="mb-0.5 mr-1.5 inline-block h-3.5 w-3.5" />
                  {customer.delivery_address}
                </p>
              ) : (
                <p className="text-slate-400">Endereco nao informado</p>
              )}
            </div>
          ) : null}
          {shippingResult && !shippingResult.notFound ? (
            <p className="mt-2 text-slate-500">
              {FreightIcon ? <FreightIcon className={`mb-0.5 mr-1.5 inline-block h-3.5 w-3.5 ${freightIcon?.color || ''}`} /> : <Truck className="mb-0.5 mr-1.5 inline-block h-3.5 w-3.5" />}
              {effectiveShippingCost === 0 ? 'Frete gratis' : `Frete: ${formatMoney(effectiveShippingCost)}`}
              {shippingResult.estimatedDays > 0 ? ` • ${shippingResult.estimatedDays} dias uteis` : ''}
            </p>
          ) : null}
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="font-medium text-slate-900">Pagamento: {
              customer.payment_method === 'pix' ? 'Pix' :
              customer.payment_method === 'credit_card' ? `Cartao em ${customer.installments}x` :
              customer.payment_method === 'card_on_delivery' ? 'Cartao na Entrega' :
              'Dinheiro'
            }</p>
          </div>
          {customer.notes ? <p className="mt-3 text-slate-500 italic">&quot;{customer.notes}&quot;</p> : null}
        </div>
      </aside>

      {/* Confirmation Modal */}
      {showConfirmModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-none border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-950">Confirmar pedido</h3>
            <p className="mt-2 text-sm text-slate-500">
              Deseja realmente finalizar este pedido? Apos a confirmacao, o pedido sera registrado e o carrinho liberado para uma nova compra.
            </p>
            <div className="mt-4 space-y-2 rounded border border-slate-100 bg-slate-50 p-3 text-sm">
              <p><span className="text-slate-500">Total:</span> <span className="font-semibold text-slate-900">{formatMoney(grandTotal)}</span></p>
              <p><span className="text-slate-500">Itens:</span> <span className="font-semibold text-slate-900">{checkoutTotalItems}</span></p>
              <p><span className="text-slate-500">Pagamento:</span> <span className="font-semibold text-slate-900">
                {customer.payment_method === 'pix' ? 'Pix' :
                 customer.payment_method === 'credit_card' ? `Cartao em ${customer.installments}x` :
                 customer.payment_method === 'card_on_delivery' ? 'Cartao na Entrega' :
                 'Dinheiro'}
              </span></p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-none border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFinalizeOrder}
                disabled={isSubmitting}
                className="flex-1 rounded-none bg-[var(--store-button-bg)] px-4 py-2.5 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
