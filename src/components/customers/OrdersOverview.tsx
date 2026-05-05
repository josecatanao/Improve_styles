'use client'

import { useCallback, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ClipboardList, CreditCard, FileText, MapPin, Navigation2, PackageCheck, Truck, UserRound, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatMoney } from '@/lib/storefront'
import type { AccountOrder } from '@/lib/account'
import { getContrastingTextColor } from '@/lib/store-settings'
import { useToast, useConfirm } from '@/components/ui/feedback-provider'
import { cancelOrderByCustomer } from '@/app/conta/pedidos/actions'
import { getStatusLabel, getStatusBadgeClasses, getOrderSteps, getStepDescription } from '@/lib/order-statuses'

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

const CUSTOMER_STEP_ICONS: Record<string, typeof CheckCircle2> = {
  pending: CheckCircle2,
  processing: ClipboardList,
  shipped: Truck,
  completed: PackageCheck,
}

function getPaymentLabel(order: AccountOrder) {
  if (order.payment_method === 'pix') return 'Pix'
  if (order.payment_method === 'cash') return 'Dinheiro'
  return 'Cartão de crédito'
}

export function OrdersOverview({
  orders,
  customer,
  brandPrimaryColor,
}: {
  orders: AccountOrder[]
  customer: {
    email: string | null
    fullName: string | null
    whatsapp: string | null
  }
  brandPrimaryColor: string
}) {
  const [filter, setFilter] = useState<FilterValue>('all')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orders[0]?.id ?? null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const totalCardTextColor = getContrastingTextColor(brandPrimaryColor)
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      const confirmed = await confirm({
        title: 'Cancelar pedido',
        description: 'Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.',
        confirmLabel: 'Sim, cancelar',
        cancelLabel: 'Voltar',
        variant: 'destructive',
      })

      if (!confirmed) return

      setCancellingOrderId(orderId)

      try {
        await cancelOrderByCustomer(orderId)
        toast({
          title: 'Pedido cancelado',
          description: 'O pedido foi cancelado com sucesso.',
          variant: 'success',
        })
        router.refresh()
      } catch (err) {
        toast({
          title: 'Erro ao cancelar',
          description: err instanceof Error ? err.message : 'Ocorreu um erro inesperado.',
          variant: 'error',
        })
      } finally {
        setCancellingOrderId(null)
      }
    },
    [confirm, toast, router]
  )

  const filteredOrders = useMemo(() => {
    if (filter === 'pending') {
      return orders.filter((order) => {
        if (order.status === 'completed' || order.status === 'cancelled') return false
        if (order.delivery_method === 'pickup' && order.status === 'shipped') return false
        return true
      })
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
            Acompanhe o fluxo de cada compra com uma visão completa de status, entrega, pagamento e itens.
          </p>
        </div>

        <nav className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Filtrar pedidos">
          {filters.map((item) => {
            const active = item.value === filter
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(item.value)}
                className={
                  active
                    ? 'inline-flex h-9 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200'
                    : 'inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-700'
                }
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="mt-8 grid gap-6">
          {filteredOrders.map((order) => {
            const statusLabel = getStatusLabel(order.status, order.delivery_method)
            const statusClasses = getStatusBadgeClasses(order.status)
            const steps = getOrderSteps(order.status, order.delivery_method)
            const subtotal = order.store_order_items.reduce((sum, item) => sum + item.price * item.quantity, 0)
            const isExpanded = expandedOrderId === order.id

            return (
              <article key={order.id} className="overflow-hidden rounded-[1.65rem] border border-slate-200 bg-white shadow-[0_18px_48px_-40px_rgba(15,23,42,0.26)]">
                <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-[1.05rem] font-semibold text-slate-950">Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span>{formatDate(order.created_at)}</span>
                        <span className="text-slate-300">•</span>
                        <span>{order.total_items} itens</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:min-w-[220px] md:justify-end">
                    <div className="text-left md:text-right">
                      <p className="text-sm" style={{ color: totalCardTextColor, opacity: 0.72 }}>
                        Total
                      </p>
                      <p className="mt-1 text-[1.1rem] font-semibold" style={{ color: brandPrimaryColor }}>
                        {formatMoney(order.total_price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Detalhes do pedido ${order.id.slice(0, 8).toUpperCase()}`}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <>
                <div className="border-t border-slate-200/80 px-6 py-6">
                  {order.status === 'cancelled' ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                      Este pedido foi cancelado e saiu do fluxo normal de acompanhamento.
                    </div>
                  ) : (
                    <div className={`grid gap-4 ${steps.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} sm:gap-0`}>
                      <div className={`relative hidden sm:block ${steps.length === 3 ? 'sm:col-span-3' : 'sm:col-span-4'}`}>
                        <span className="absolute left-5 right-5 top-5 z-0 h-px bg-slate-200" />
                      </div>
                      {steps.map((step, index) => {
                        const Icon = CUSTOMER_STEP_ICONS[step.key] || CheckCircle2
                        const isDone = step.state === 'done'
                        const isCurrent = step.state === 'current'
                        const isCancelled = step.state === 'cancelled'
                        const circleClass = isCancelled
                          ? 'bg-slate-50 text-slate-300 ring-slate-100'
                          : isCurrent
                            ? 'bg-blue-600 text-white ring-blue-100'
                            : isDone
                              ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                              : 'bg-slate-50 text-slate-400 ring-slate-100'
                        const lineClass = isCancelled ? 'bg-slate-200' : isDone ? 'bg-emerald-400' : isCurrent ? 'bg-blue-500' : 'bg-slate-200'

                        return (
                          <div key={step.key} className="relative sm:-mt-0 sm:px-3">
                            {index < steps.length - 1 ? (
                              <span className="absolute left-10 right-0 top-5 z-0 hidden h-px sm:block">
                                <span className={`block h-full w-full ${lineClass}`} />
                              </span>
                            ) : null}

                            <div className="relative z-10 space-y-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full ring-8 ring-white ${circleClass}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="space-y-1">
                                <p className={`text-sm font-semibold ${isCancelled ? 'text-slate-400' : isCurrent ? 'text-blue-600' : 'text-slate-900'}`}>
                                  {index + 1}. {step.label}
                                </p>
                                <p className={`text-sm ${isCancelled ? 'text-slate-300' : isDone ? 'text-emerald-500' : isCurrent ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {getStepDescription(step.key, step.state, order.created_at, order.delivery_method)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[1.05rem] font-semibold text-slate-900">Cliente</p>
                        <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                          <p className="font-medium text-slate-900">{customer.fullName || 'Conta do cliente'}</p>
                          <p className="truncate text-slate-500">{customer.email || 'E-mail não informado'}</p>
                          <p className="text-slate-500">{customer.whatsapp || 'WhatsApp não informado'}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[1.05rem] font-semibold text-slate-900">Entrega</p>
                        <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                          {order.delivery_method === 'pickup' ? (
                            <>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                                <MapPin className="h-3 w-3" />
                                Retirada na loja
                              </span>
                            </>
                          ) : (
                            <>
                              <p className="text-slate-500">{order.delivery_address || 'Endereço não informado'}</p>
                              {order.delivery_lat && order.delivery_lng ? (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  <Navigation2 className="h-4 w-4" />
                                  Ver no mapa
                                </a>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[1.05rem] font-semibold text-slate-900">Pagamento</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>{getPaymentLabel(order)}</span>
                          {order.payment_method === 'credit_card' ? (
                            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                              {order.installments}x sem juros
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="border-t border-slate-200/80 px-6 py-6">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="space-y-6">
                      <p className="text-lg font-semibold text-slate-900">Itens do pedido</p>

                      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_320px]">
                        <div className="space-y-4">
                          {order.store_order_items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                {item.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    sem foto
                                  </div>
                                )}
                                <span className="absolute bottom-2 right-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                                  {item.quantity}x
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[1.05rem] font-semibold text-slate-900">{item.name}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {[item.color_name ? `Cor: ${item.color_name}` : null, item.size ? `Tamanho: ${item.size}` : null]
                                    .filter(Boolean)
                                    .join(' • ') || 'Variação padrão'}
                                </p>
                                <p className="mt-3 text-sm text-slate-500">
                                  <span className="font-semibold text-blue-600">{formatMoney(item.price)}</span> cada
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-2xl font-semibold text-slate-900">{formatMoney(item.price * item.quantity)}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-slate-500">
                              <span>Subtotal</span>
                              <span>{formatMoney(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-500">
                              <span>Frete</span>
                              <span className="font-medium text-emerald-500">Grátis</span>
                            </div>
                            <div className="border-t border-slate-200 pt-5">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[1.6rem] font-semibold text-slate-900">Total</span>
                                <span className="text-[2rem] font-semibold" style={{ color: brandPrimaryColor }}>
                                  {formatMoney(order.total_price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {order.status === 'cancelled' ? null : order.status === 'pending' || order.status === 'processing' ? (
                  <div className="border-t border-slate-200/80 px-6 py-4">
                    <button
                      type="button"
                      disabled={cancellingOrderId === order.id}
                      onClick={() => handleCancelOrder(order.id)}
                      className="inline-flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      {cancellingOrderId === order.id ? 'Cancelando...' : 'Cancelar pedido'}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-slate-200/80 px-6 py-4">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Esse pedido nao pode mais ser cancelado. Para cancelar, entre em contato com a loja.
                    </div>
                  </div>
                )}
                  </>
                ) : null}
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
