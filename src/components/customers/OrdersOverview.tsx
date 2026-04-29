'use client'

import { useMemo, useState } from 'react'
import { Banknote, CreditCard, MapPin, Navigation2, Package, ShieldAlert } from 'lucide-react'
import { formatMoney } from '@/lib/storefront'
import type { AccountOrder } from '@/lib/account'

type FilterValue = 'all' | 'pending' | 'completed'

const filters: Array<{ label: string; value: FilterValue }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Concluídos', value: 'completed' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusMeta(status: string) {
  switch (status) {
    case 'completed':
      return { label: 'Concluído', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
    case 'cancelled':
      return { label: 'Cancelado', className: 'bg-red-50 text-red-700 ring-red-200' }
    case 'pending':
      return { label: 'Pendente', className: 'bg-amber-50 text-amber-700 ring-amber-200' }
    case 'processing':
      return { label: 'Pendente', className: 'bg-amber-50 text-amber-700 ring-amber-200' }
    default:
      return { label: 'Em andamento', className: 'bg-slate-100 text-slate-700 ring-slate-200' }
  }
}

export function OrdersOverview({ orders }: { orders: AccountOrder[] }) {
  const [filter, setFilter] = useState<FilterValue>('all')

  const filteredOrders = useMemo(() => {
    if (filter === 'pending') {
      return orders.filter((order) => ['pending', 'processing', 'shipped'].includes(order.status))
    }
    if (filter === 'completed') {
      return orders.filter((order) => order.status === 'completed')
    }
    return orders
  }, [filter, orders])

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Pedidos</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Histórico de compras</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Acompanhe status, pagamento, entrega e os itens de cada pedido em uma visão mais organizada.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = item.value === filter
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={
                  active
                    ? 'inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white'
                    : 'inline-flex h-10 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950'
                }
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="mt-8 grid gap-5">
          {filteredOrders.map((order) => {
            const status = getStatusMeta(order.status)
            return (
              <article key={order.id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50/70">
                <div className="flex flex-col gap-4 border-b border-slate-200/80 bg-white px-5 py-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-950">Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{formatDate(order.created_at)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Total</p>
                    <p className="mt-1 text-lg font-semibold">{formatMoney(order.total_price)}</p>
                  </div>
                </div>

                <div className="grid gap-4 px-5 py-5 lg:grid-cols-3">
                  <section className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Entrega</p>
                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                      {order.delivery_method === 'pickup' ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                          <Package className="h-4 w-4" />
                          Retirada na loja
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span>{order.delivery_address || 'Endereço não informado'}</span>
                          </div>
                          {order.delivery_lat && order.delivery_lng ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 font-semibold text-sky-600 hover:text-sky-700"
                            >
                              <Navigation2 className="h-4 w-4" />
                              Abrir no mapa
                            </a>
                          ) : null}
                        </>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pagamento</p>
                    <div className="mt-3 text-sm text-slate-600">
                      {order.payment_method === 'pix' ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
                          <ShieldAlert className="h-4 w-4" />
                          Pix
                        </div>
                      ) : order.payment_method === 'cash' ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                          <Banknote className="h-4 w-4" />
                          Dinheiro
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 font-medium text-sky-700">
                          <CreditCard className="h-4 w-4" />
                          Cartão {order.installments}x
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Itens do pedido</p>
                    <div className="mt-3 space-y-3">
                      {order.store_order_items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                          <div>
                            <p className="font-medium text-slate-800">{item.name}</p>
                            <p className="text-slate-500">Quantidade: {item.quantity}</p>
                          </div>
                          <span className="shrink-0 font-medium text-slate-700">
                            {formatMoney(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
          Nenhum pedido encontrado para o filtro selecionado.
        </div>
      )}
    </section>
  )
}
