import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  FolderKanban,
  Package,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { ProductSetupNotice } from '@/components/products/ProductSetupNotice'
import { getProductStatusClasses, getProductStatusLabel } from '@/lib/product-shared'
import { getCustomerProfiles } from '@/lib/customers'
import { getStoreOrders, type StoreOrder } from '@/lib/orders'
import { getProductMetrics, getProductOverviewData } from '@/lib/products'

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getOrderStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendentes'
    case 'processing':
      return 'Em separacao'
    case 'shipped':
      return 'Em entrega'
    case 'completed':
      return 'Concluidos'
    case 'cancelled':
      return 'Cancelados'
    default:
      return status
  }
}

function getOrderStatusClasses(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700'
    case 'processing':
      return 'bg-blue-50 text-blue-700'
    case 'shipped':
      return 'bg-indigo-50 text-indigo-700'
    case 'completed':
      return 'bg-emerald-50 text-emerald-700'
    case 'cancelled':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function getPaymentLabel(method: string) {
  switch (method) {
    case 'pix':
      return 'Pix'
    case 'credit_card':
      return 'Cartao'
    case 'cash':
      return 'Dinheiro'
    default:
      return method || 'Nao informado'
  }
}

function getDeliveryLabel(method: string) {
  return method === 'pickup' ? 'Retirada' : 'Entrega'
}

function buildSalesTimeline(orders: StoreOrder[], days = 7) {
  const now = new Date()
  const base = startOfDay(now)
  const entries = Array.from({ length: days }, (_, index) => {
    const date = new Date(base)
    date.setDate(base.getDate() - (days - 1 - index))

    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date),
      revenue: 0,
      orders: 0,
    }
  })

  const map = new Map(entries.map((entry) => [entry.key, entry]))

  orders.forEach((order) => {
    const key = startOfDay(new Date(order.created_at)).toISOString().slice(0, 10)
    const entry = map.get(key)

    if (!entry) {
      return
    }

    entry.revenue += Number(order.total_price ?? 0)
    entry.orders += 1
  })

  return entries
}

function buildBreakdown(items: string[]) {
  const counts = new Map<string, number>()

  items.forEach((item) => {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function getTopSellingProducts(orders: StoreOrder[]) {
  const map = new Map<string, { name: string; quantity: number; revenue: number }>()

  orders.forEach((order) => {
    order.store_order_items.forEach((item) => {
      const current = map.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 }
      current.quantity += Number(item.quantity ?? 0)
      current.revenue += Number(item.price ?? 0) * Number(item.quantity ?? 0)
      map.set(item.name, current)
    })
  })

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 5)
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = 'slate',
}: {
  title: string
  value: string
  helper: string
  icon: typeof Wallet
  tone?: 'slate' | 'emerald' | 'blue' | 'amber'
}) {
  const toneStyles = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  )
}

function ProgressChartCard({
  title,
  description,
  items,
  tone = 'slate',
}: {
  title: string
  description: string
  items: Array<{ label: string; value: number; helper?: string }>
  tone?: 'slate' | 'blue'
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)
  const barClass = tone === 'blue' ? 'bg-blue-600' : 'bg-slate-900'

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Nenhum dado disponivel para este bloco.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{item.label}</p>
                  {item.helper ? <p className="text-xs text-slate-500">{item.helper}</p> : null}
                </div>
                <span className="text-sm font-medium text-slate-600">{formatCompactNumber(item.value)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{ width: `${Math.max((item.value / maxValue) * 100, 6)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function SalesTimelineCard({
  items,
  totalRevenue,
  totalOrders,
}: {
  items: Array<{ key: string; label: string; revenue: number; orders: number }>
  totalRevenue: number
  totalOrders: number
}) {
  const maxRevenue = Math.max(...items.map((item) => item.revenue), 1)

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Vendas nos ultimos 7 dias</h2>
          <p className="mt-1 text-sm text-slate-500">Receita e volume recente para leitura rapida da operacao.</p>
        </div>
        <div className="grid gap-2 text-right">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Receita total</p>
            <p className="text-lg font-semibold text-slate-900">{formatMoney(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Pedidos no periodo</p>
            <p className="text-sm font-medium text-slate-600">{totalOrders}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid h-[220px] grid-cols-7 items-end gap-3">
        {items.map((item) => (
          <div key={item.key} className="flex h-full flex-col justify-end gap-3">
            <div className="text-center">
              <p className="text-[11px] font-medium text-slate-500">{item.orders} pedidos</p>
            </div>
            <div className="flex h-full items-end">
              <div
                className="w-full rounded-t-2xl bg-slate-900 transition-all"
                style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 14 : 2)}%` }}
                title={`${item.label}: ${formatMoney(item.revenue)}`}
              />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xs font-semibold text-slate-700">{item.label}</p>
              <p className="text-[11px] text-slate-500">{formatMoney(item.revenue)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function DashboardPage() {
  const [productMetrics, productOverview, ordersResult, customersResult] = await Promise.all([
    getProductMetrics(),
    getProductOverviewData(),
    getStoreOrders(),
    getCustomerProfiles(),
  ])

  const orders = ordersResult.orders
  const completedOrders = orders.filter((order) => order.status === 'completed')
  const openOrders = orders.filter((order) => ['pending', 'processing', 'shipped'].includes(order.status))
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0)
  const completedRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0)
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0
  const averageItemsPerOrder = orders.length > 0 ? orders.reduce((sum, order) => sum + Number(order.total_items ?? 0), 0) / orders.length : 0
  const activeCustomers = customersResult.summary.active
  const customersWithAddressRate =
    customersResult.summary.total > 0 ? (customersResult.summary.withAddress / customersResult.summary.total) * 100 : 0
  const salesTimeline = buildSalesTimeline(orders, 7)
  const orderStatusBreakdown = buildBreakdown(orders.map((order) => getOrderStatusLabel(order.status)))
  const paymentBreakdown = buildBreakdown(orders.map((order) => getPaymentLabel(order.payment_method)))
  const deliveryBreakdown = buildBreakdown(orders.map((order) => getDeliveryLabel(order.delivery_method)))
  const topSellingProducts = getTopSellingProducts(orders)
  const recentOrders = orders.slice(0, 5)
  const lowStockProducts = productOverview.topInventoryProducts
    .filter((product) => product.stock <= 3)
    .sort((a, b) => a.stock - b.stock || b.value - a.value)
    .slice(0, 5)

  const hasAnySetupRequired =
    productMetrics.setupRequired || productOverview.setupRequired || ordersResult.setupRequired || customersResult.setupRequired

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe vendas, operacao, clientes e saude do catalogo a partir de dados reais da aplicacao.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/pedidos"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Ver pedidos
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/produtos/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Novo produto
            <PlusCircle className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Receita total"
          value={formatMoney(totalRevenue)}
          helper={`${orders.length} pedidos registrados na operacao.`}
          icon={Wallet}
          tone="emerald"
        />
        <MetricCard
          title="Ticket medio"
          value={formatMoney(averageTicket)}
          helper={`${averageItemsPerOrder.toFixed(1).replace('.', ',')} itens por pedido em media.`}
          icon={Banknote}
          tone="blue"
        />
        <MetricCard
          title="Pedidos em andamento"
          value={String(openOrders.length)}
          helper="Soma de pendentes, em separacao e em entrega."
          icon={ShoppingBag}
          tone="amber"
        />
        <MetricCard
          title="Clientes ativos"
          value={String(activeCustomers)}
          helper={`${customersResult.summary.total} clientes na base da loja.`}
          icon={Users}
        />
      </div>

      {hasAnySetupRequired ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {productMetrics.setupRequired || productOverview.setupRequired ? <ProductSetupNotice /> : null}

          {(ordersResult.setupRequired || customersResult.setupRequired) && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Dados pendentes</p>
              <h3 className="mt-2 text-lg font-semibold">Nem todos os modulos do dashboard estao prontos no banco.</h3>
              <div className="mt-3 space-y-2 text-sm text-amber-900/80">
                {ordersResult.setupRequired ? <p>Os dados de pedidos ainda nao estao disponiveis.</p> : null}
                {customersResult.setupRequired ? <p>Os dados de clientes ainda nao estao disponiveis.</p> : null}
              </div>
            </section>
          )}
        </div>
      ) : null}

      {ordersResult.errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {ordersResult.errorMessage}
        </div>
      ) : null}
      {customersResult.errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {customersResult.errorMessage}
        </div>
      ) : null}
      {productOverview.errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {productOverview.errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <SalesTimelineCard
          items={salesTimeline}
          totalRevenue={salesTimeline.reduce((sum, item) => sum + item.revenue, 0)}
          totalOrders={salesTimeline.reduce((sum, item) => sum + item.orders, 0)}
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Resumo comercial</h2>
              <p className="text-sm text-slate-500">Leitura rapida dos pontos mais importantes da operacao.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Receita de pedidos concluidos</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatMoney(completedRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Base com endereco preenchido</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {customersWithAddressRate.toFixed(0).replace('.', ',')}%
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Produtos ativos</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{productMetrics.activeProducts}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Capital estimado em estoque</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatMoney(productMetrics.inventoryValue)}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ProgressChartCard
          title="Pedidos por status"
          description="Mostra onde a operacao esta concentrada no fluxo atual."
          items={orderStatusBreakdown}
        />
        <ProgressChartCard
          title="Formas de pagamento"
          description="Ajuda a entender como os clientes estao comprando."
          items={paymentBreakdown}
          tone="blue"
        />
        <ProgressChartCard
          title="Metodo de entrega"
          description="Comparativo entre entrega e retirada."
          items={deliveryBreakdown}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Produtos mais vendidos</h2>
                <p className="text-sm text-slate-500">Itens que mais geraram volume e faturamento nos pedidos.</p>
              </div>
            </div>
            <Link
              href="/dashboard/pedidos"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
            >
              Abrir pedidos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {topSellingProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Ainda nao existem pedidos suficientes para rankear produtos vendidos.
              </div>
            ) : (
              topSellingProducts.map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.quantity} unidades vendidas</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{formatMoney(product.revenue)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Ultimos pedidos</h2>
                <p className="text-sm text-slate-500">Pedidos mais recentes para acompanhamento imediato.</p>
              </div>
            </div>
            <Link
              href="/dashboard/pedidos"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Ver tudo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {recentOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Nenhum pedido registrado ainda.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{order.customer_name}</p>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getOrderStatusClasses(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(order.created_at)}</span>
                      <span className="text-slate-300">•</span>
                      <span>{order.total_items} itens</span>
                      <span className="text-slate-300">•</span>
                      <span>{getPaymentLabel(order.payment_method)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{formatMoney(order.total_price)}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <ProgressChartCard
          title="Categorias com mais itens"
          description="Mostra em quais frentes o catalogo esta mais concentrado."
          items={productOverview.categoryBreakdown}
          tone="blue"
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Alertas operacionais</h2>
                <p className="text-sm text-slate-500">Itens que pedem atencao rapida na operacao.</p>
              </div>
            </div>
            <Link
              href="/dashboard/produtos/catalogo"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
            >
              Ver catalogo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Estoque baixo</p>
                  <Boxes className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{productMetrics.lowStockCount}</p>
                <p className="mt-1 text-xs text-slate-500">Produtos com 3 unidades ou menos.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Clientes sem WhatsApp</p>
                  <UserRound className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {Math.max(customersResult.summary.total - customersResult.summary.withWhatsapp, 0)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Base ainda sem canal direto de contato.</p>
              </div>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Nenhum produto critico de estoque no momento.
                </div>
              ) : (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatMoney(product.price)} por unidade</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {product.stock} un.
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Status do catalogo</h2>
                <p className="text-sm text-slate-500">Distribuicao real entre ativos, rascunhos e itens ocultos.</p>
              </div>
            </div>
            <Link
              href="/dashboard/produtos"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
            >
              Gerenciar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {productOverview.statusBreakdown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Nenhum dado de status disponivel.
              </div>
            ) : (
              productOverview.statusBreakdown.map((item) => {
                const statusKey =
                  item.label === 'Ativos'
                    ? 'active'
                    : item.label === 'Rascunhos'
                      ? 'draft'
                      : item.label === 'Esgotados'
                        ? 'out_of_stock'
                        : 'hidden'

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getProductStatusClasses(statusKey)}`}>
                      {getProductStatusLabel(statusKey)}
                    </span>
                    <span className="text-lg font-semibold text-slate-900">{item.value}</span>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Ultimos produtos cadastrados</h2>
                <p className="text-sm text-slate-500">Acompanhamento rapido do que entrou por ultimo no catalogo.</p>
              </div>
            </div>
            <Link
              href="/dashboard/produtos/catalogo"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Abrir catalogo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {productOverview.recentProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Nenhum produto cadastrado ainda.
              </div>
            ) : (
              productOverview.recentProducts.map((product) => {
                const cover = product.product_images?.[0]?.public_url

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">sem foto</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatMoney(Number(product.price ?? 0))}</span>
                        <span className="text-slate-300">•</span>
                        <span>{product.stock} em estoque</span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/produtos/${product.id}/editar`}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                    >
                      Abrir
                    </Link>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Link
          href="/dashboard/pedidos"
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <p className="mt-5 text-base font-semibold text-slate-900">Central de pedidos</p>
          <p className="mt-2 text-sm text-slate-500">Acompanhe status, confirme entregas e opere o fluxo comercial.</p>
        </Link>

        <Link
          href="/dashboard/clientes"
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-5 text-base font-semibold text-slate-900">Base de clientes</p>
          <p className="mt-2 text-sm text-slate-500">Veja quem compra, quem precisa de contato e como esta a base ativa.</p>
        </Link>

        <Link
          href="/dashboard/produtos"
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <FolderKanban className="h-5 w-5" />
          </div>
          <p className="mt-5 text-base font-semibold text-slate-900">Operacao de catalogo</p>
          <p className="mt-2 text-sm text-slate-500">Gerencie estoque, cobertura de categorias e saude do mix de produtos.</p>
        </Link>
      </div>
    </div>
  )
}
