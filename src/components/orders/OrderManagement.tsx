'use client'

import { useTransition } from 'react'
import { formatMoney } from '@/lib/storefront'
import type { StoreOrder } from '@/lib/orders'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/feedback-provider'
import { Package, MapPin, Navigation2, CreditCard, Banknote, ShieldAlert, Loader2 } from 'lucide-react'
import { updateOrderStatus } from '@/app/dashboard/pedidos/actions'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}


function OrderStatusSelect({ order }: { order: StoreOrder }) {
  const [isPending, startTransition] = useTransition()
  const showToast = useToast()

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, newStatus)
        showToast({
          variant: 'success',
          title: 'Status do pedido atualizado',
        })
      } catch (err) {
        showToast({
          variant: 'error',
          title: 'Falha ao atualizar o pedido',
          description: err instanceof Error ? err.message : 'Erro inesperado.',
        })
      }
    })
  }

  return (
    <div className="relative inline-block w-full min-w-[130px]">
      <select
        disabled={isPending}
        value={order.status}
        onChange={handleStatusChange}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
      >
        <option value="pending">Pendente</option>
        <option value="processing">Processando</option>
        <option value="shipped">Saiu para Entrega</option>
        <option value="completed">Entregue / Concluido</option>
        <option value="cancelled">Cancelado</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
        ) : (
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        )}
      </div>
    </div>
  )
}

export function OrderManagement({ orders }: { orders: StoreOrder[] }) {
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 bg-white ring-1 ring-slate-200">
          <CardContent className="px-5 py-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Total de pedidos</p>
              <Package className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{totalOrders}</p>
            <p className="mt-2 text-sm text-slate-500">Pedidos registrados no sistema.</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white ring-1 ring-slate-200">
          <CardContent className="px-5 py-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Receita total</p>
              <span className="text-slate-400 font-semibold">$</span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{formatMoney(totalRevenue)}</p>
            <p className="mt-2 text-sm text-slate-500">Valor bruto de todos os pedidos.</p>
          </CardContent>
        </Card>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Pedidos recentes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe as vendas da sua loja.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Nenhum pedido realizado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-3">ID / Data</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Itens</th>
                  <th className="px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="align-top hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{order.id.split('-')[0].toUpperCase()}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{order.customer_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{order.customer_phone || 'Sem telefone'}</p>
                      <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                        {order.delivery_method === 'pickup' ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Package className="h-3.5 w-3.5" /> Retirar na loja
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-1.5 text-slate-700">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span className="line-clamp-2 max-w-[200px] leading-tight">
                                {order.delivery_address || 'Sem endereco'}
                              </span>
                            </div>
                            {order.delivery_lat && order.delivery_lng ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 font-medium text-[#3483fa] hover:underline"
                              >
                                <Navigation2 className="h-3 w-3" /> Ver no mapa
                              </a>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusSelect order={order} />
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        {order.payment_method === 'pix' ? (
                          <><ShieldAlert className="h-3.5 w-3.5" /> Pix</>
                        ) : order.payment_method === 'cash' ? (
                          <><Banknote className="h-3.5 w-3.5" /> Dinheiro</>
                        ) : (
                          <><CreditCard className="h-3.5 w-3.5" /> Cartao {order.installments}x</>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.total_items} {order.total_items === 1 ? 'item' : 'itens'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatMoney(order.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
