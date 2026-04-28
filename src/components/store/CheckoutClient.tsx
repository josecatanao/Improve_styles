'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/store/CartProvider'
import { formatMoney } from '@/lib/storefront'

export function CheckoutClient() {
  const { items, totalPrice, clearCart, isReady } = useCart()
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isReady) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando checkout...</div>
  }

  if (items.length === 0 && !isSubmitted) {
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

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-800">Pedido revisado com sucesso.</p>
        <p className="mt-2 text-sm text-emerald-700">O checkout foi concluido sem pagamento, conforme solicitado.</p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Voltar para a loja
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-6"
        onSubmit={(event) => {
          event.preventDefault()
          clearCart()
          setIsSubmitted(true)
        }}
      >
        <h2 className="text-xl font-semibold text-slate-950">Dados do pedido</h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              required
              name="name"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Telefone</span>
            <input
              required
              name="phone"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Observacao</span>
            <textarea
              name="notes"
              rows={4}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#3483fa] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2968c8]"
        >
          Revisar pedido
        </button>
      </form>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">Resumo do pedido</h2>
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
      </aside>
    </div>
  )
}
