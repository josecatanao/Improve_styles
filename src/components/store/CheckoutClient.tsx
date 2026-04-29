'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MapPin, Navigation2 } from 'lucide-react'
import { useCart } from '@/components/store/CartProvider'
import { useToast } from '@/components/ui/feedback-provider'
import type { CustomerProfile } from '@/lib/customer-shared'
import { formatMoney } from '@/lib/storefront'
import { submitOrder } from '@/app/checkout/actions'
import { saveStoreOrder, type StoreOrder, type StoreOrderCustomer } from '@/lib/store-orders'

type CheckoutInitialProfile = CustomerProfile & {
  delivery_lat?: number | null
  delivery_lng?: number | null
}

export function CheckoutClient({ initialProfile }: { initialProfile?: CheckoutInitialProfile | null }) {
  const { items, totalPrice, clearCart, isReady } = useCart()
  const showToast = useToast()
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const [customer, setCustomer] = useState<StoreOrderCustomer>({
    name: initialProfile?.full_name || '',
    phone: initialProfile?.whatsapp || '',
    notes: '',
    delivery_method: 'delivery',
    payment_method: 'pix',
    installments: 1,
    delivery_address: initialProfile?.delivery_address || '',
    delivery_lat: initialProfile?.delivery_lat || null,
    delivery_lng: initialProfile?.delivery_lng || null,
  })
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<StoreOrder | null>(null)
  const hasRequiredCustomerData = 
    customer.name.trim().length > 0 && 
    customer.phone.trim().length > 0 &&
    (customer.delivery_method === 'pickup' || customer.delivery_address.trim().length > 0)

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
          // Se o usuario usar a localizacao atual, preenchemos o endereco com um aviso,
          // ou esperamos que eles completem o texto.
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

  if (submittedOrder) {
    return (
      <div className="rounded-none border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-800">Pedido salvo com sucesso.</p>
        <p className="mt-2 text-sm text-emerald-700">
          O pedido <span className="font-semibold">{submittedOrder.id}</span> foi registrado neste navegador e o carrinho foi liberado para uma nova compra.
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

  async function handleConfirmOrder() {
    setIsSubmitting(true)
    try {
      const response = await submitOrder({
        customer,
        items,
        totalPrice,
        totalItems,
      })

      const order: StoreOrder = {
        id: response.orderId,
        createdAt: new Date().toISOString(),
        customer,
        items,
        totalPrice,
        totalItems,
      }

      saveStoreOrder(order)
      clearCart()
      setSubmittedOrder(order)
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
      <form
        className="rounded-none border border-[color:var(--store-card-border)] bg-[var(--store-card-bg)] p-4 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault()
          setReviewMode(true)
        }}
      >
        <h2 className="text-xl font-semibold text-slate-950">Dados do pedido</h2>
        <p className="mt-2 text-sm text-slate-500">Preencha os dados e revise o resumo antes de confirmar o pedido.</p>
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

            {customer.delivery_method === 'delivery' ? (
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-none bg-[var(--store-button-bg)] px-4 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90"
          >
            Revisar pedido
          </button>

          {reviewMode ? (
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={!hasRequiredCustomerData || isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-none border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar pedido'}
            </button>
          ) : null}
        </div>
      </form>

      <aside className="rounded-none border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Resumo do pedido</h2>
        {reviewMode ? (
          <div className="mt-4 rounded-none border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
            Revise os dados abaixo. Ao confirmar, o pedido sera salvo neste navegador e o carrinho sera esvaziado.
          </div>
        ) : null}
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

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-slate-500">Total geral</span>
          <span className="text-2xl font-semibold text-slate-950">{formatMoney(totalPrice)}</span>
        </div>

        <div className="mt-5 rounded-none bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">
            {customer.delivery_method === 'pickup' ? 'Retirar na Loja' : 'Entrega para'}
          </p>
          <p className="mt-2">{customer.name || 'Nome ainda nao informado'}</p>
          <p>{customer.phone || 'Telefone ainda nao informado'}</p>
          {customer.delivery_method === 'delivery' ? (
             <p className="mt-2 text-slate-500">
               {customer.delivery_address ? (
                 <>
                   <MapPin className="mb-0.5 mr-1.5 inline-block h-3.5 w-3.5" />
                   {customer.delivery_address}
                 </>
               ) : 'Endereco nao informado'}
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
