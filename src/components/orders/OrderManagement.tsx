'use client'

import { Fragment, type ReactNode, useMemo, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { formatMoney } from '@/lib/storefront'
import type { StoreOrder } from '@/lib/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  LayoutGrid,
  List,
  Loader2,
  MessageCircleMore,
  Navigation2,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react'
import { deleteOrder, updateOrderPaymentStatus, updateOrderStatus } from '@/app/dashboard/pedidos/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPaymentStatusBadgeClasses, getPaymentStatusLabel, getStatusOptions, getStatusLabel, getStatusBadgeClasses, isPickup, normalizePaymentStatus, type PaymentStatus } from '@/lib/order-statuses'

type MessageTemplateKey = 'pending' | 'processing' | 'shipped' | 'completed'
type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest'
type ViewMode = 'list' | 'compact'

const PAGE_SIZE = 4

const TEMPLATE_BUTTONS_DELIVERY: Array<{ key: MessageTemplateKey; label: string }> = [
  { key: 'pending', label: 'Pedido recebido' },
  { key: 'processing', label: 'Em separação' },
  { key: 'shipped', label: 'Saiu para entrega' },
  { key: 'completed', label: 'Pedido concluído' },
]

const TEMPLATE_BUTTONS_PICKUP: Array<{ key: MessageTemplateKey | 'shipped'; label: string }> = [
  { key: 'pending', label: 'Pedido recebido' },
  { key: 'processing', label: 'Aguardando retirada' },
  { key: 'completed', label: 'Produto retirado' },
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

function getPaymentLabel(order: StoreOrder) {
  if (order.payment_method === 'pix') {
    return 'Pix'
  }

  if (order.payment_method === 'cash') {
    return 'Dinheiro'
  }

  return `Cartão ${order.installments}x`
}

function getDeliveryLabel(order: StoreOrder) {
  return order.delivery_method === 'pickup' ? 'Retirada na loja' : 'Entrega'
}

function getPaymentIcon(paymentMethod: StoreOrder['payment_method']) {
  if (paymentMethod === 'pix') {
    return ShieldAlert
  }

  if (paymentMethod === 'cash') {
    return Banknote
  }

  return CreditCard
}

function matchesPaymentFilter(order: StoreOrder, filter: string) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'card') {
    return order.payment_method !== 'pix' && order.payment_method !== 'cash'
  }

  return order.payment_method === filter
}

function matchesPeriodFilter(order: StoreOrder, filter: string, mountedAt: number) {
  if (filter === 'all') {
    return true
  }

  const createdAt = new Date(order.created_at).getTime()
  const diff = mountedAt - createdAt

  if (filter === '24h') {
    return diff <= 1000 * 60 * 60 * 24
  }

  if (filter === '7d') {
    return diff <= 1000 * 60 * 60 * 24 * 7
  }

  if (filter === '30d') {
    return diff <= 1000 * 60 * 60 * 24 * 30
  }

  return true
}

function getStatusTemplateKey(status: string, deliveryMethod?: string | null): MessageTemplateKey {
  if (isPickup(deliveryMethod)) {
    if (status === 'processing') return 'processing'
    if (status === 'completed') return 'completed'
    return 'pending'
  }

  if (status === 'processing') return 'processing'
  if (status === 'shipped') return 'shipped'
  if (status === 'completed') return 'completed'
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
  const pickup = isPickup(order.delivery_method)

  switch (template) {
    case 'processing':
      return pickup
        ? `Olá, ${customerName}! Seu pedido ${orderCode} está aguardando retirada na loja.${productsText} Assim que estiver disponível para retirada, avisamos você por aqui.`
        : `Olá, ${customerName}! Seu pedido ${orderCode} está em separação neste momento.${productsText} Já conferimos os ${itemLabel} e vamos seguir com as próximas etapas do envio.`
    case 'shipped':
      return `Olá, ${customerName}! Seu pedido ${orderCode} saiu para entrega.${productsText} Qualquer atualização de rota ou finalização, avisamos você por aqui.`
    case 'completed':
      return pickup
        ? `Olá, ${customerName}! Seu pedido ${orderCode} foi retirado com sucesso.${productsText} Obrigado pela compra. Se precisar de suporte no pós-venda, estamos por aqui.`
        : `Olá, ${customerName}! Seu pedido ${orderCode} foi concluído e marcado como entregue.${productsText} Obrigado pela compra. Se precisar de suporte no pós-venda, estamos por aqui.`
    case 'pending':
    default:
      return `Olá, ${customerName}! Recebemos seu pedido ${orderCode} com ${itemLabel}, no valor total de ${totalLabel}.${productsText} Já registramos tudo por aqui e vamos continuar com as próximas etapas do envio.`
  }
}

function isTemplateAllowed(status: string, template: MessageTemplateKey, deliveryMethod?: string | null) {
  return getStatusTemplateKey(status, deliveryMethod) === template
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
    <div className="relative inline-block w-full min-w-0 max-w-[180px]">
      <label htmlFor={`status-${order.id}`} className="sr-only">Status do pedido</label>
      <select
        id={`status-${order.id}`}
        disabled={isPending}
        value={order.status}
        onChange={handleStatusChange}
        className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:border-slate-600 dark:focus:ring-slate-800"
      >
        {getStatusOptions(order.delivery_method).map((status) => (
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

function PaymentStatusSelect({
  orderId,
  currentPaymentStatus,
  onUpdated,
}: {
  orderId: string
  currentPaymentStatus: PaymentStatus
  onUpdated: (status: PaymentStatus) => void
}) {
  const [isPending, startTransition] = useTransition()
  const showToast = useToast()

  function handlePaymentStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as PaymentStatus
    startTransition(async () => {
      try {
        await updateOrderPaymentStatus(orderId, newStatus)
        onUpdated(newStatus)
        showToast({
          variant: 'success',
          title: 'Status do pagamento atualizado',
        })
      } catch (err) {
        showToast({
          variant: 'error',
          title: 'Falha ao atualizar o pagamento',
          description: err instanceof Error ? err.message : 'Erro inesperado.',
        })
      }
    })
  }

  return (
    <div className="relative inline-block w-full min-w-0 max-w-[180px]">
      <label htmlFor={`payment-status-${orderId}`} className="sr-only">Status do pagamento</label>
      <select
        id={`payment-status-${orderId}`}
        disabled={isPending}
        value={currentPaymentStatus}
        onChange={handlePaymentStatusChange}
        className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:border-slate-600 dark:focus:ring-slate-800"
      >
        <option value="pending">Pendente</option>
        <option value="paid">Pago</option>
        <option value="cancelled">Cancelado</option>
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
  const [expandedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('7d')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>(
    Object.fromEntries(orders.map((order) => [order.id, buildWhatsAppMessage(order, getStatusTemplateKey(order.status, order.delivery_method))]))
  )
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})
  const [paymentStatusOverrides, setPaymentStatusOverrides] = useState<Record<string, PaymentStatus>>({})
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null)

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0)
  const pendingOrders = orders.filter((order) => (statusOverrides[order.id] || order.status) === 'pending').length
  const completedOrders = orders.filter((order) => (statusOverrides[order.id] || order.status) === 'completed').length
  const recentOrdersCount = useMemo(() => {
    return orders.filter((order) => mountedAt - new Date(order.created_at).getTime() <= 1000 * 60 * 60 * 24).length
  }, [mountedAt, orders])

  const filteredOrders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    const filtered = orders.filter((order) => {
      const currentStatus = statusOverrides[order.id] || order.status
      const matchesSearch =
        !searchTerm ||
        getOrderCode(order.id).toLowerCase().includes(searchTerm) ||
        order.customer_name.toLowerCase().includes(searchTerm) ||
        (order.customer_phone || '').toLowerCase().includes(searchTerm) ||
        (order.customer_email || '').toLowerCase().includes(searchTerm)

      const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter
      const matchesPayment = matchesPaymentFilter(order, paymentFilter)
      const matchesDelivery = deliveryFilter === 'all' || order.delivery_method === deliveryFilter
      const matchesPeriod = matchesPeriodFilter(order, periodFilter, mountedAt)

      return matchesSearch && matchesStatus && matchesPayment && matchesDelivery && matchesPeriod
    })

    filtered.sort((a, b) => {
      if (sortOption === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }

      if (sortOption === 'highest') {
        return Number(b.total_price) - Number(a.total_price)
      }

      if (sortOption === 'lowest') {
        return Number(a.total_price) - Number(b.total_price)
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return filtered
  }, [deliveryFilter, mountedAt, orders, paymentFilter, search, sortOption, statusFilter, statusOverrides, periodFilter])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const paginatedOrders = useMemo(() => {
    const start = (currentPageSafe - 1) * PAGE_SIZE
    return filteredOrders.slice(start, start + PAGE_SIZE)
  }, [currentPageSafe, filteredOrders])

  function resetFilters() {
    setSearch('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDeliveryFilter('all')
    setPeriodFilter('7d')
    setSortOption('recent')
    setCurrentPage(1)
  }

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
        title: 'WhatsApp indisponível',
        description: 'Esse pedido não possui telefone para contato.',
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
        description: 'Não foi possível copiar a mensagem agora.',
      })
    }
  }

  async function handleDelete(order: StoreOrder) {
    const confirmed = await confirm({
      title: 'Apagar pedido?',
      description: `O pedido ${getOrderCode(order.id)} será removido permanentemente.`,
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

  function handleOpenDetails(order: StoreOrder, currentStatus: string) {
    if (!messageDrafts[order.id]) {
      updateDraft(order, getStatusTemplateKey(currentStatus))
    }

    router.push(`/dashboard/pedidos/${order.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total de pedidos" value={String(totalOrders)} helper="Pedidos registrados" icon={<ShoppingBag className="h-5 w-5 text-[#2563eb]" />} accent="bg-blue-50 text-blue-600" />
        <MetricCard label="Receita total" value={formatMoney(totalRevenue)} helper="Valor bruto acumulado" icon={<Banknote className="h-5 w-5 text-emerald-600" />} accent="bg-emerald-50 text-emerald-600" />
        <MetricCard label="Pendentes" value={String(pendingOrders)} helper="Aguardando andamento" icon={<Clock3 className="h-5 w-5 text-amber-500" />} accent="bg-amber-50 text-amber-600" />
        <MetricCard label="Concluídos" value={String(completedOrders)} helper="Pedidos finalizados" icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} accent="bg-emerald-50 text-emerald-600" />
        <MetricCard label="Pedidos hoje" value={String(recentOrdersCount)} helper="Últimas 24h" icon={<CalendarDays className="h-5 w-5 text-rose-600" />} accent="bg-rose-50 text-rose-600" />
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <CardContent className="px-5 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[260px] flex-1 space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-transparent select-none">
                Busca
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Buscar por pedido, cliente ou telefone..."
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </label>

            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'Todos' },
                ...getStatusOptions('delivery'),
              ]}
              className="w-[180px] shrink-0"
            />

            <FilterSelect
              label="Pagamento"
              value={paymentFilter}
              onChange={(value) => {
                setPaymentFilter(value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'pix', label: 'Pix' },
                { value: 'cash', label: 'Dinheiro' },
                { value: 'card', label: 'Cartão' },
              ]}
              className="w-[180px] shrink-0"
            />

            <FilterSelect
              label="Entrega"
              value={deliveryFilter}
              onChange={(value) => {
                setDeliveryFilter(value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'delivery', label: 'Entrega' },
                { value: 'pickup', label: 'Retirada' },
              ]}
              className="w-[180px] shrink-0"
            />

            <FilterSelect
              label="Periodo"
              value={periodFilter}
              onChange={(value) => {
                setPeriodFilter(value)
                setCurrentPage(1)
              }}
              options={[
                { value: '7d', label: 'Últimos 7 dias' },
                { value: '24h', label: 'Últimas 24h' },
                { value: '30d', label: 'Últimos 30 dias' },
                { value: 'all', label: 'Todo período' },
              ]}
              className="w-[180px] shrink-0"
            />

            <Button variant="outline" className="h-11 shrink-0 rounded-xl px-4" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-[1.35rem] font-semibold text-slate-900 dark:text-slate-50">Pedidos recentes</CardTitle>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {filteredOrders.length} pedido{filteredOrders.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Ordenar"
                value={sortOption}
                onChange={(value) => setSortOption(value as SortOption)}
                options={[
                  { value: 'recent', label: 'Mais recentes' },
                  { value: 'oldest', label: 'Mais antigos' },
                  { value: 'highest', label: 'Maior valor' },
                  { value: 'lowest', label: 'Menor valor' },
                ]}
                hideLabel
                className="min-w-[170px]"
              />

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  className="rounded-lg"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  className="rounded-lg"
                  onClick={() => setViewMode('compact')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {filteredOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Nenhum pedido encontrado com os filtros atuais.</div>
        ) : (
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <div className={cn(viewMode === 'compact' ? 'grid gap-4 md:grid-cols-2 2xl:grid-cols-3' : 'space-y-4')}>
              {paginatedOrders.map((order) => {
              const currentStatus = statusOverrides[order.id] || order.status
              const currentPaymentStatus = paymentStatusOverrides[order.id] ?? normalizePaymentStatus(order.payment_status, order.status)
              const isExpanded = expandedOrderId === order.id
              const isDeleting = busyDeleteId === order.id
              const PaymentIcon = getPaymentIcon(order.payment_method)

              if (viewMode === 'compact') {
                return (
                  <article key={order.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className="space-y-4 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[1.05rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50">{getOrderCode(order.id)}</p>
                            <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getStatusBadgeClasses(currentStatus)}`}>
                              {getStatusLabel(currentStatus, order.delivery_method)}
                            </span>
                            <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getPaymentStatusBadgeClasses(currentPaymentStatus)}`}>
                              Pagamento: {getPaymentStatusLabel(currentPaymentStatus)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[1.05rem] font-semibold text-slate-900 dark:text-slate-50">{order.customer_name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{order.customer_phone || 'Sem telefone'}</p>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{order.customer_email || 'Sem e-mail'}</p>
                          </div>
                        </div>

                        <div className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          <span className="inline-flex items-center gap-1.5">
                            <PaymentIcon className="h-3.5 w-3.5" />
                            {getPaymentLabel(order)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
                        <p className="text-[1.55rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50">{formatMoney(order.total_price)}</p>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400">
                          {order.total_items} {order.total_items === 1 ? 'item' : 'itens'} • {order.store_order_items.length} produto{order.store_order_items.length === 1 ? '' : 's'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                            <Truck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            {getDeliveryLabel(order)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                            <PaymentIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            {getPaymentLabel(order)}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-2.5 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-200">Criado em</p>
                            <p>{formatDate(order.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                          <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <div>
                            <p className="font-medium text-slate-600 dark:text-slate-300">Atualizado em</p>
                            <p>{formatDate(order.updated_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                          onClick={() => handleOpenDetails(order, currentStatus)}
                        >
                          <ArrowRight className="h-4 w-4" />
                          Ver detalhes
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                          onClick={() => {
                            if (!messageDrafts[order.id]) {
                              updateDraft(order, getStatusTemplateKey(currentStatus))
                            }
                            openWhatsApp(order)
                          }}
                        >
                          <MessageCircleMore className="h-4 w-4" />
                          WhatsApp
                        </Button>
                      </div>

                      <div className="grid gap-2">
                        <OrderStatusSelect
                          order={{ ...order, status: currentStatus }}
                          onUpdated={(status) => {
                            setStatusOverrides((current) => ({ ...current, [order.id]: status }))
                            updateDraft(order, getStatusTemplateKey(status))
                            router.refresh()
                          }}
                        />

                        <PaymentStatusSelect
                          orderId={order.id}
                          currentPaymentStatus={currentPaymentStatus}
                          onUpdated={(status) => {
                            setPaymentStatusOverrides((current) => ({ ...current, [order.id]: status }))
                            router.refresh()
                          }}
                        />

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-9 w-full rounded-lg px-4 text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300"
                          disabled={isDeleting}
                          onClick={() => handleDelete(order)}
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Excluir pedido
                        </Button>
                      </div>

                      {isExpanded ? (
                        <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                          <section className="grid gap-3">
                            <InfoPanel
                              title="Resumo"
                              content={
                                <div className="space-y-3">
                                  <p><span className="font-medium text-slate-800 dark:text-slate-100">Total:</span> {formatMoney(order.total_price)}</p>
                                  <p><span className="font-medium text-slate-800 dark:text-slate-100">Itens:</span> {order.total_items} {order.total_items === 1 ? 'item' : 'itens'}</p>
                                  <p><span className="font-medium text-slate-800 dark:text-slate-100">Pagamento:</span> {getPaymentLabel(order)}</p>
                                  <p><span className="font-medium text-slate-800 dark:text-slate-100">Entrega:</span> {getDeliveryLabel(order)}</p>
                                </div>
                              }
                            />

                            <InfoPanel
                              title="Cliente"
                              content={
                                <div className="space-y-2">
                                  <p>{order.customer_name}</p>
                                  <p>{order.customer_phone || 'Sem telefone informado.'}</p>
                                  <p>{order.customer_email || 'Sem e-mail informado.'}</p>
                                </div>
                              }
                            />
                          </section>

                          <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Itens do pedido</h3>
                            <div className="mt-3 space-y-2">
                              {order.store_order_items.map((item) => (
                                <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-950/80">
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
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              }

              return (
                <Fragment key={order.id}>
                  <article className="h-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className={cn('border-b border-slate-100 px-4 dark:border-slate-800 sm:px-5', viewMode === 'compact' ? 'py-4' : 'py-5')}>
                      <div className={cn('grid gap-4', viewMode === 'compact' ? 'lg:grid-cols-1' : 'xl:grid-cols-[1fr_0.95fr_0.9fr_440px] xl:items-center')}>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <p className="text-[1.05rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50">{getOrderCode(order.id)}</p>
                            <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getStatusBadgeClasses(currentStatus)}`}>
                              {getStatusLabel(currentStatus, order.delivery_method)}
                            </span>
                            <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getPaymentStatusBadgeClasses(currentPaymentStatus)}`}>
                              Pagamento: {getPaymentStatusLabel(currentPaymentStatus)}
                            </span>
                            {mountedAt - new Date(order.created_at).getTime() <= 1000 * 60 * 60 * 24 ? (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Novo
                              </span>
                            ) : null}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[1.05rem] font-semibold text-slate-900 dark:text-slate-50">{order.customer_name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{order.customer_phone || 'Sem telefone'}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{order.customer_email || 'Sem e-mail'}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                              <PaymentIcon className="h-3.5 w-3.5" />
                              {getPaymentLabel(order)}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[1.7rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50">{formatMoney(order.total_price)}</p>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">
                              {order.total_items} {order.total_items === 1 ? 'item' : 'itens'} • {order.store_order_items.length} produto{order.store_order_items.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium dark:bg-slate-800">
                              <Truck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              {getDeliveryLabel(order)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium dark:bg-slate-800">
                              <PaymentIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              {getPaymentLabel(order)}
                            </span>
                          </div>
                        </div>

                        <div className={cn('space-y-3 border-slate-100 dark:border-slate-800', viewMode === 'compact' ? 'border-t pt-4' : 'border-l-0 xl:border-l xl:pl-5')}>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                              <div>
                                <p className="font-medium text-slate-700 dark:text-slate-200">Criado em</p>
                                <p>{formatDate(order.created_at)}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                              <div>
                                <p className="font-medium text-slate-600 dark:text-slate-300">Atualizado em</p>
                                <p>{formatDate(order.updated_at)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-9 rounded-lg px-3 text-sm bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                              onClick={() => handleOpenDetails(order, currentStatus)}
                            >
                              <ArrowRight className="h-4 w-4" />
                              Ver detalhes
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-lg px-3 text-sm border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                              onClick={() => {
                                if (!messageDrafts[order.id]) {
                                  updateDraft(order, getStatusTemplateKey(currentStatus))
                                }
                                openWhatsApp(order)
                              }}
                            >
                              <MessageCircleMore className="h-4 w-4" />
                              WhatsApp
                            </Button>

                            <OrderStatusSelect
                              order={{ ...order, status: currentStatus }}
                              onUpdated={(status) => {
                                setStatusOverrides((current) => ({ ...current, [order.id]: status }))
                                updateDraft(order, getStatusTemplateKey(status))
                                router.refresh()
                              }}
                            />

                            <PaymentStatusSelect
                              orderId={order.id}
                              currentPaymentStatus={currentPaymentStatus}
                              onUpdated={(status) => {
                                setPaymentStatusOverrides((current) => ({ ...current, [order.id]: status }))
                                router.refresh()
                              }}
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-9 w-full sm:w-auto sm:min-w-[180px] rounded-lg px-4 text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300"
                              disabled={isDeleting}
                              onClick={() => handleDelete(order)}
                            >
                              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              Excluir pedido
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="space-y-5 bg-slate-50/70 px-4 py-5 dark:bg-slate-950/40 sm:px-5">
                        <section className="grid gap-4 lg:grid-cols-3">
                          <InfoPanel
                            title="Resumo"
                            content={
                              <div className="space-y-3">
                                <p><span className="font-medium text-slate-800 dark:text-slate-100">Total:</span> {formatMoney(order.total_price)}</p>
                                <p><span className="font-medium text-slate-800 dark:text-slate-100">Itens:</span> {order.total_items} {order.total_items === 1 ? 'item' : 'itens'}</p>
                                <p><span className="font-medium text-slate-800 dark:text-slate-100">Pagamento:</span> {getPaymentLabel(order)}</p>
                                <p><span className="font-medium text-slate-800 dark:text-slate-100">Entrega:</span> {getDeliveryLabel(order)}</p>
                                <div className="pt-1 space-y-2">
                                  <OrderStatusSelect
                                    order={{ ...order, status: currentStatus }}
                                    onUpdated={(status) => {
                                      setStatusOverrides((current) => ({ ...current, [order.id]: status }))
                                      updateDraft(order, getStatusTemplateKey(status))
                                      router.refresh()
                                    }}
                                  />
                                  <PaymentStatusSelect
                                    orderId={order.id}
                                    currentPaymentStatus={currentPaymentStatus}
                                    onUpdated={(status) => {
                                      setPaymentStatusOverrides((current) => ({ ...current, [order.id]: status }))
                                      router.refresh()
                                    }}
                                  />
                                </div>
                              </div>
                            }
                          />

                          <InfoPanel
                            title="Cliente"
                            content={
                              <div className="space-y-2">
                                <p>{order.customer_name}</p>
                                <p>{order.customer_phone || 'Sem telefone informado.'}</p>
                                <p>{order.customer_email || 'Sem e-mail informado.'}</p>
                              </div>
                            }
                          />

                          <InfoPanel
                            title="Observacoes"
                            content={<p>{order.notes?.trim() || 'Nenhuma observacao enviada pelo cliente.'}</p>}
                          />
                        </section>

                        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
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
                          </div>

                          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Mensagens por WhatsApp</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                  Use a mensagem do status atual e edite apenas se precisar complementar algo.
                                </p>
                              </div>
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {order.customer_phone || 'Sem telefone'}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {(isPickup(order.delivery_method) ? TEMPLATE_BUTTONS_PICKUP : TEMPLATE_BUTTONS_DELIVERY).map((template) => {
                                const isAllowed = isTemplateAllowed(currentStatus, template.key as MessageTemplateKey, order.delivery_method)
                                const isCurrent = getStatusTemplateKey(currentStatus, order.delivery_method) === template.key

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
                              Status atual: <span className="font-semibold text-slate-700 dark:text-slate-200">{getStatusLabel(currentStatus, order.delivery_method)}</span>. Só a mensagem correspondente a esse status fica habilitada.
                            </p>

                            <div className="mt-4 space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Mensagem editável</label>
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
                      </div>
                    ) : null}
                  </article>
                </Fragment>
              )
            })}
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mostrando {filteredOrders.length === 0 ? 0 : (currentPageSafe - 1) * PAGE_SIZE + 1} a {Math.min(currentPageSafe * PAGE_SIZE, filteredOrders.length)} de {filteredOrders.length} pedidos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-xl"
                  disabled={currentPageSafe === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                  {currentPageSafe}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-xl"
                  disabled={currentPageSafe === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  accent,
}: {
  label: string
  value: string
  helper: string
  icon: ReactNode
  accent: string
}) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" size="sm">
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', accent)}>
            {icon}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="truncate text-2xl leading-none font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{helper}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  hideLabel,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  hideLabel?: boolean
  className?: string
}) {
  return (
    <label className={cn('min-w-0 space-y-1.5', className)}>
      <span className={cn('block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400', hideLabel ? 'sr-only' : '')}>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
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
