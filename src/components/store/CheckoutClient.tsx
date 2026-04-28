'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useCart } from '@/components/store/CartProvider'
import { formatMoney } from '@/lib/storefront'
import { saveStoreOrder, type StoreOrder, type StoreOrderCustomer } from '@/lib/store-orders'

function createOrderId() {
  return `IS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function CheckoutClient() {
  const { items, totalPrice, clearCart, isReady } = useCart()
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const [customer, setCustomer] = useState<StoreOrderCustomer>({
    name: '',
    phone: '',
    notes: '',
  })
  const [reviewMode, setReviewMode] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<StoreOrder | null>(null)
  const hasRequiredCustomerData = customer.name.trim().length > 0 && customer.phone.trim().length > 0

  if (!isReady) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando checkout...</div>
  }

  if (items.length === 0 && !submittedOrder) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">Nao ha itens para finalizar.</p>
        <p className="mt-2 text-sm text-slate-500">Volte para a loja e adicione produtos ao carrinho.</p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#3483fa] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2968c8]"
        >
          Voltar para a loja
        </Link>
      </div>
    )
  }

  if (submittedOrder) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-800">Pedido salvo com sucesso.</p>
        <p className="mt-2 text-sm text-emerald-700">
          O pedido <span className="font-semibold">{submittedOrder.id}</span> foi registrado neste navegador e o carrinho foi liberado para uma nova compra.
        </p>
        <Link
          href="/conta"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Ver minha conta
        </Link>
      </div>
    )
  }

  function handleConfirmOrder() {
    const order: StoreOrder = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      customer,
      items,
      totalPrice,
      totalItems,
    }

    saveStoreOrder(order)
    clearCart()
    setSubmittedOrder(order)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-6"
        onSubmit={(event) => {
          event.preventDefault()
          setReviewMode(true)
        }}
      >
        <h2 className="text-xl font-semibold text-slate-950">Dados do pedido</h2>
        <p className="mt-2 text-sm text-slate-500">Preencha os dados e revise o resumo antes de confirmar o pedido.</p>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              required
              name="name"
              value={customer.name}
              onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Telefone</span>
            <input
              required
              name="phone"
              value={customer.phone}
              onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Observacao</span>
            <textarea
              name="notes"
              rows={4}
              value={customer.notes}
              onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#3483fa] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2968c8]"
          >
            Revisar pedido
          </button>

          {reviewMode ? (
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={!hasRequiredCustomerData}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Confirmar pedido
            </button>
          ) : null}
        </div>
      </form>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">Resumo do pedido</h2>
        {reviewMode ? (
          <div className="mt-4 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
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

        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Entrega para</p>
          <p className="mt-2">{customer.name || 'Nome ainda nao informado'}</p>
          <p>{customer.phone || 'Telefone ainda nao informado'}</p>
          {customer.notes ? <p className="mt-2 text-slate-500">{customer.notes}</p> : null}
        </div>
      </aside>
    </div>
  )
}
