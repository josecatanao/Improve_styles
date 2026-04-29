'use client'

import { Fragment, type ReactNode, useMemo, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { formatMoney } from '@/lib/storefront'
import type { StoreOrder } from '@/lib/orders'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  MessageCircleMore,
  Navigation2,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react'
import { deleteOrder, updateOrderStatus } from '@/app/dashboard/pedidos/actions'
import { Button } from '@/components/ui/button'

type MessageTemplateKey = 'pending' | 'processing' | 'shipped' | 'completed'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Processando' },
  { value: 'shipped', label: 'Saiu para entrega' },
  { value: 'completed', label: 'Entregue / concluido' },
  { value: 'cancelled', label: 'Cancelado' },
]

const TEMPLATE_BUTTONS: Array<{ key: MessageTemplateKey; label: string }> = [
  { key: 'pending', label: 'Pedido recebido' },
  { key: 'processing', label: 'Em separacao' },
  { key: 'shipped', label: 'Saiu para entrega' },
  { key: 'completed', label: 'Pedido concluido' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getOrderCode(orderId: string) {
  return orderId.split('-')[0].toUpperCase()
}

function getStatusLabel(status: string) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
    case 'processing':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
    case 'shipped':
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    case 'cancelled':
      return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

function getPaymentLabel(order: StoreOrder) {
  if (order.payment_method === 'pix') {
    return 'Pix'
  }

  if (order.payment_method === 'cash') {
    return 'Dinheiro'
  }

  return `Cartao ${order.installments}x`
}

function getStatusTemplateKey(status: string): MessageTemplateKey {
  if (status === 'processing') {
    return 'processing'
  }

  if (status === 'shipped') {
    return 'shipped'
  }

  if (status === 'completed') {
    return 'completed'
  }

  return 'pending'
}

function normalizeWhatsAppPhone(phone: string | null) {
  const digits = (phone || '').replace(/\D/g, '')

  if (!digits) {
    return null
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return digits
}

function buildWhatsAppMessage(order: StoreOrder, template: MessageTemplateKey) {
  const customerName = order.customer_name.trim() || 'cliente'
  const orderCode = getOrderCode(order.id)
  const itemLabel = `${order.total_items} ${order.total_items === 1 ? 'item' : 'itens'}`
  const totalLabel = formatMoney(order.total_price)
  const productNames = Array.from(new Set(order.store_order_items.map((item) => item.name.trim()).filter(Boolean))).join(', ')
  const productsText = productNames ? ` Produtos do pedido: ${productNames}.` : ''

  switch (template) {
    case 'processing':
      return `Ola, ${customerName}! Seu pedido ${orderCode} esta em separacao neste momento.${productsText} Ja conferimos os ${itemLabel} e vamos seguir com as proximas etapas do envio.`
    case 'shipped':
      return `Ola, ${customerName}! Seu pedido ${orderCode} saiu para entrega.${productsText} Qualquer atualizacao de rota ou finalizacao, avisamos voce por aqui.`
    case 'completed':
      return `Ola, ${customerName}! Seu pedido ${orderCode} foi concluido e marcado como entregue.${productsText} Obrigado pela compra. Se precisar de suporte no pos-venda, estamos por aqui.`
    case 'pending':
    default:
      return `Ola, ${customerName}! Recebemos seu pedido ${orderCode} com ${itemLabel}, no valor total de ${totalLabel}.${productsText} Ja registramos tudo por aqui e vamos continuar com as proximas etapas do envio.`
  }
}

function isTemplateAllowed(status: string, template: MessageTemplateKey) {
  return getStatusTemplateKey(status) === template
}

function OrderStatusSelect({
  order,
  onUpdated,
}: {
  order: StoreOrder
  onUpdated: (status: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const showToast = useToast()

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, newStatus)
        onUpdated(newStatus)
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
    <div className="relative inline-block w-full min-w-[170px]">
      <select
        disabled={isPending}
        value={order.status}
        onChange={handleStatusChange}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:border-slate-600 dark:focus:ring-slate-800"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 dark:text-slate-500" />
        ) : (
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  )
}

export function OrderManagement({ orders }: { orders: StoreOrder[] }) {
  const router = useRouter()
  const showToast = useToast()
  const confirm = useConfirm()
  const [mountedAt] = useState(() => Date.now())
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orders[0]?.id ?? null)
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>(
    Object.fromEntries(orders.map((order) => [order.id, buildWhatsAppMessage(order, getStatusTemplateKey(order.status))]))
  )
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null)

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0)
  const pendingOrders = orders.filter((order) => (statusOverrides[order.id] || order.status) === 'pending').length
  const completedOrders = orders.filter((order) => (statusOverrides[order.id] || order.status) === 'completed').length

  const recentOrdersCount = useMemo(() => {
    return orders.filter((order) => mountedAt - new Date(order.created_at).getTime() <= 1000 * 60 * 60 * 24).length
  }, [mountedAt, orders])

  function updateDraft(order: StoreOrder, template: MessageTemplateKey) {
    setMessageDrafts((current) => ({
      ...current,
      [order.id]: buildWhatsAppMessage(
        {
          ...order,
          status: statusOverrides[order.id] || order.status,
        },
        template
      ),
    }))
  }

  function openWhatsApp(order: StoreOrder) {
    const phone = normalizeWhatsAppPhone(order.customer_phone)
    const message = (messageDrafts[order.id] || '').trim()

    if (!phone) {
      showToast({
        variant: 'error',
        title: 'WhatsApp indisponivel',
        description: 'Esse pedido nao possui telefone para contato.',
      })
      return
    }

    if (!message) {
      showToast({
        variant: 'error',
        title: 'Mensagem vazia',
        description: 'Escreva ou gere uma mensagem antes de abrir o WhatsApp.',
      })
      return
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  async function copyMessage(orderId: string) {
    try {
      await navigator.clipboard.writeText(messageDrafts[orderId] || '')
      showToast({
        variant: 'success',
        title: 'Mensagem copiada',
      })
    } catch {
      showToast({
        variant: 'error',
        title: 'Falha ao copiar',
        description: 'Nao foi possivel copiar a mensagem agora.',
      })
    }
  }

  async function handleDelete(order: StoreOrder) {
    const confirmed = await confirm({
      title: 'Apagar pedido?',
      description: `O pedido ${getOrderCode(order.id)} sera removido permanentemente.`,
      confirmLabel: 'Apagar',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) {
      return
    }

    setBusyDeleteId(order.id)

    try {
      await deleteOrder(order.id)
      showToast({
        variant: 'success',
        title: 'Pedido apagado',
      })
      router.refresh()
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao apagar pedido',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setBusyDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total de pedidos" value={String(totalOrders)} helper="Pedidos registrados no sistema." icon={<ShoppingBag className="h-5 w-5 text-slate-400" />} />
        <MetricCard label="Receita total" value={formatMoney(totalRevenue)} helper="Valor bruto acumulado dos pedidos." icon={<CreditCard className="h-5 w-5 text-slate-400" />} />
        <MetricCard label="Pendentes" value={String(pendingOrders)} helper="Pedidos aguardando andamento." icon={<ShieldAlert className="h-5 w-5 text-slate-400" />} />
        <MetricCard label="Entregues" value={String(completedOrders)} helper="Pedidos marcados como concluidos." icon={<CheckCircle2 className="h-5 w-5 text-slate-400" />} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Pedidos recentes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Gerencie status, acompanhe detalhes e envie atualizacoes pelo WhatsApp.
              </p>
            </div>
            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {recentOrdersCount} pedidos nas ultimas 24h
            </span>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Nenhum pedido realizado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950/60">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Resumo</th>
                  <th className="px-6 py-3">Entrega e pagamento</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((order) => {
                  const currentStatus = statusOverrides[order.id] || order.status
                  const isExpanded = expandedOrderId === order.id
                  const isDeleting = busyDeleteId === order.id

                  return (
                    <Fragment key={order.id}>
                      <tr key={order.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-50">{getOrderCode(order.id)}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Criado em {formatDate(order.created_at)}</p>
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Atualizado em {formatDate(order.updated_at)}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-50">{order.customer_name}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.customer_phone || 'Sem telefone'}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.customer_email || 'Sem e-mail'}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-50">{formatMoney(order.total_price)}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {order.total_items} {order.total_items === 1 ? 'item' : 'itens'}
                          </p>
                          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            {order.store_order_items.length} produto{order.store_order_items.length === 1 ? '' : 's'} listado{order.store_order_items.length === 1 ? '' : 's'}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                              <span>{order.delivery_method === 'pickup' ? 'Retirada na loja' : 'Entrega'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {order.payment_method === 'pix' ? (
                                <ShieldAlert className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                              ) : order.payment_method === 'cash' ? (
                                <Banknote className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                              ) : (
                                <CreditCard className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                              )}
                              <span>{getPaymentLabel(order)}</span>
                            </div>
                            {order.delivery_method !== 'pickup' ? (
                              <p className="max-w-[240px] text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {order.delivery_address || 'Endereco nao informado'}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <OrderStatusSelect
                            order={{ ...order, status: currentStatus }}
                            onUpdated={(status) => {
                              setStatusOverrides((current) => ({ ...current, [order.id]: status }))
                              updateDraft(order, getStatusTemplateKey(status))
                              router.refresh()
                            }}
                          />
                          <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClasses(currentStatus)}`}>
                            {getStatusLabel(currentStatus)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex min-w-[220px] flex-col gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setExpandedOrderId((current) => (current === order.id ? null : order.id))
                                if (!messageDrafts[order.id]) {
                                  updateDraft(order, getStatusTemplateKey(currentStatus))
                                }
                              }}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setExpandedOrderId(order.id)
                                if (!messageDrafts[order.id]) {
                                  updateDraft(order, getStatusTemplateKey(currentStatus))
                                }
                              }}
                            >
                              <MessageCircleMore className="h-4 w-4" />
                              WhatsApp
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              disabled={isDeleting}
                              onClick={() => handleDelete(order)}
                            >
                              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              Apagar pedido
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr key={`${order.id}-details`} className="bg-slate-50/70 dark:bg-slate-950/40">
                          <td colSpan={6} className="px-6 py-5">
                            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                              <div className="space-y-5">
                                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Itens do pedido</h3>
                                  <div className="mt-4 space-y-3">
                                    {order.store_order_items.map((item) => (
                                      <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-950/80">
                                        <div className="min-w-0">
                                          <p className="truncate font-medium text-slate-900 dark:text-slate-50">{item.name}</p>
                                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {item.quantity}x
                                            {item.size ? ` • Tam. ${item.size}` : ''}
                                            {item.color_name ? ` • ${item.color_name}` : ''}
                                            {item.sku ? ` • SKU ${item.sku}` : ''}
                                          </p>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-50">
                                          {formatMoney(item.price * item.quantity)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </section>

                                <section className="grid gap-4 md:grid-cols-2">
                                  <InfoPanel
                                    title="Entrega"
                                    content={
                                      order.delivery_method === 'pickup' ? (
                                        <p>Cliente vai retirar na loja.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          <p>{order.delivery_address || 'Endereco nao informado.'}</p>
                                          {order.delivery_lat && order.delivery_lng ? (
                                            <a
                                              href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1.5 font-medium text-[#3483fa] hover:underline dark:text-blue-300"
                                            >
                                              <Navigation2 className="h-3.5 w-3.5" />
                                              Abrir no mapa
                                            </a>
                                          ) : null}
                                        </div>
                                      )
                                    }
                                  />

                                  <InfoPanel
                                    title="Observacoes"
                                    content={<p>{order.notes?.trim() || 'Nenhuma observacao enviada pelo cliente.'}</p>}
                                  />
                                </section>
                              </div>

                              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Mensagens por WhatsApp</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                      A mensagem liberada acompanha o status atual do pedido. Edite se quiser antes de enviar.
                                    </p>
                                  </div>
                                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {order.customer_phone || 'Sem telefone'}
                                  </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {TEMPLATE_BUTTONS.map((template) => {
                                    const isAllowed = isTemplateAllowed(currentStatus, template.key)
                                    const isCurrent = getStatusTemplateKey(currentStatus) === template.key

                                    return (
                                      <Button
                                        key={template.key}
                                        type="button"
                                        variant={isCurrent ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!isAllowed}
                                        className={cn(
                                          'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
                                          isCurrent &&
                                            'border-blue-500 bg-blue-500 text-white hover:bg-blue-500 dark:border-blue-500 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-500',
                                          !isAllowed &&
                                            'border-slate-200 bg-slate-100 text-slate-400 opacity-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500'
                                        )}
                                        onClick={() => updateDraft(order, template.key)}
                                      >
                                        {template.label}
                                      </Button>
                                    )
                                  })}
                                </div>

                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                  Status atual: <span className="font-semibold text-slate-700 dark:text-slate-200">{getStatusLabel(currentStatus)}</span>. So a mensagem correspondente a esse status fica habilitada.
                                </p>

                                <div className="mt-4 space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Mensagem editavel</label>
                                  <textarea
                                    value={messageDrafts[order.id] || ''}
                                    onChange={(event) =>
                                      setMessageDrafts((current) => ({
                                        ...current,
                                        [order.id]: event.target.value,
                                      }))
                                    }
                                    className="min-h-48 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800"
                                  />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                    onClick={() => copyMessage(order.id)}
                                  >
                                    <Copy className="h-4 w-4" />
                                    Copiar
                                  </Button>
                                  <Button
                                    type="button"
                                    className="bg-[#1d9bf0] text-white hover:bg-[#1683ca] dark:bg-[#1d9bf0] dark:text-white dark:hover:bg-[#1683ca]"
                                    onClick={() => openWhatsApp(order)}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir WhatsApp
                                  </Button>
                                </div>
                              </section>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string
  value: string
  helper: string
  icon: ReactNode
}) {
  return (
    <Card className="border-0 bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <CardContent className="px-5 py-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {icon}
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
      </CardContent>
    </Card>
  )
}

function InfoPanel({
  title,
  content,
}: {
  title: string
  content: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{content}</div>
    </div>
  )
}
