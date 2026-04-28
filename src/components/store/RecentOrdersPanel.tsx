'use client'

import { useSyncExternalStore } from 'react'
import { PackageCheck } from 'lucide-react'
import { formatMoney } from '@/lib/storefront'
import { readStoredOrders, STORE_ORDER_EVENT, type StoreOrder } from '@/lib/store-orders'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const EMPTY_ORDERS: StoreOrder[] = []

export function RecentOrdersPanel() {
  const orders = useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') {
        return () => undefined
      }

      window.addEventListener('storage', callback)
      window.addEventListener(STORE_ORDER_EVENT, callback)

      return () => {
        window.removeEventListener('storage', callback)
        window.removeEventListener(STORE_ORDER_EVENT, callback)
      }
    },
    () => readStoredOrders(),
    () => EMPTY_ORDERS
  )

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Pedidos salvos neste navegador</h2>
          <p className="mt-1 text-sm text-slate-500">Cada checkout confirmado fica registrado localmente para consulta rapida.</p>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Pedido {order.id}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950">{formatMoney(order.totalPrice)}</p>
                  <p className="text-xs text-slate-500">{order.totalItems} itens</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-slate-700">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="shrink-0 text-slate-500">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
          Nenhum pedido foi confirmado neste navegador ainda.
        </div>
      )}
    </section>
  )
}
