'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/components/store/CartProvider'
import { formatMoney } from '@/lib/storefront'

export function CartContents({
  showActions = true,
}: {
  showActions?: boolean
}) {
  const { items, totalPrice, updateQuantity, removeItem, isReady } = useCart()

  if (!isReady) {
    return <div className="rounded-none border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando carrinho...</div>
  }

  if (items.length === 0) {
    return (
      <div className="rounded-none border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">Seu carrinho esta vazio</p>
        <p className="mt-2 text-sm text-slate-500">Adicione produtos para continuar a compra.</p>
        {showActions ? (
          <Link
            href="/"
            className="mt-5 inline-flex items-center justify-center rounded-none bg-[#3483fa] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2968c8]"
          >
            Continuar comprando
          </Link>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="grid gap-3 rounded-none border border-slate-200 bg-white p-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-4 sm:p-4 sm:items-center">
          <div className="max-w-[92px] overflow-hidden rounded-none border border-slate-200 bg-slate-100 sm:max-w-none">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-xs text-slate-500">Sem foto</div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900 sm:text-base">{item.name}</p>
            <div className="text-xs text-slate-500 sm:text-sm">
              {item.colorName ? <span>Cor: {item.colorName}</span> : null}
              {item.colorName && item.size ? <span> • </span> : null}
              {item.size ? <span>Tamanho: {item.size}</span> : null}
            </div>
            <p className="text-sm font-medium text-slate-900">{formatMoney(item.price)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
            <div className="inline-flex items-center rounded-none border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="inline-flex h-9 w-9 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 sm:h-10 sm:w-10"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-9 text-center text-sm font-medium text-slate-900 sm:min-w-10">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="inline-flex h-9 w-9 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 sm:h-10 sm:w-10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-red-600 sm:h-10 sm:w-10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {showActions ? (
        <div className="rounded-none border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Total geral</span>
            <span className="text-2xl font-semibold text-slate-950">{formatMoney(totalPrice)}</span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-none border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Continuar comprando
            </Link>
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center rounded-none bg-[#3483fa] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2968c8]"
            >
              Ir para checkout
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
