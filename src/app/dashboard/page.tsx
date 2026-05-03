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
import { getProductMetrics, getProductOverviewData, getLowStockProducts } from '@/lib/products'
import { HorizontalBarChart, TimelineBarChart } from '@/components/ui/chart-components'

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
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
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </section>
  )
}

export default async function DashboardPage() {
  const [productMetrics, productOverview, ordersResult, customersResult, lowStockProducts] = await Promise.all([
    getProductMetrics(),
    getProductOverviewData(),
    getStoreOrders(),
    getCustomerProfiles(),
    getLowStockProducts(),
  ])

  const orders = ordersResult.orders
  const completedOrders = orders.filter((order) => order.status === 'completed')
  const openOrders = orders.filter((order) => ['pending', 'processing', 'shipped'].includes(order.status))
  const activeOrders = orders.filter((order) => order.status !== 'cancelled')
  const totalRevenue = activeOrders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0)
  const completedRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0)
  const averageTicket = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0
  const averageItemsPerOrder = activeOrders.length > 0 ? activeOrders.reduce((sum, order) => sum + Number(order.total_items ?? 0), 0) / activeOrders.length : 0
  const activeCustomers = customersResult.summary.active
  const customersWithAddressRate =
    customersResult.summary.total > 0 ? (customersResult.summary.withAddress / customersResult.summary.total) * 100 : 0
  const salesTimeline = buildSalesTimeline(activeOrders, 7)
  const orderStatusBreakdown = buildBreakdown(orders.map((order) => getOrderStatusLabel(order.status)))
  const paymentBreakdown = buildBreakdown(orders.map((order) => getPaymentLabel(order.payment_method)))
  const deliveryBreakdown = buildBreakdown(orders.map((order) => getDeliveryLabel(order.delivery_method)))
  const topSellingProducts = getTopSellingProducts(activeOrders)
  const recentOrders = orders.slice(0, 5)

  const hasAnySetupRequired =
    productMetrics.setupRequired || productOverview.setupRequired || ordersResult.setupRequired || customersResult.setupRequired

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe vendas, operação, clientes e saúde do catálogo a partir de dados reais da aplicação.
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
          helper={`${averageItemsPerOrder.toFixed(1).replace('.', ',')} itens por pedido em média.`}
          icon={Banknote}
          tone="blue"
        />
        <MetricCard
          title="Pedidos em andamento"
          value={String(openOrders.length)}
          helper="Soma de pendentes, em separação e em entrega."
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
        <TimelineBarChart
          title="Vendas nos ultimos 7 dias"
          description="Receita diaria para leitura rapida da operacao."
          items={salesTimeline}
        />

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Resumo comercial</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Leitura rapida dos pontos mais importantes da operacao.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Receita concluida</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{formatMoney(completedRevenue)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Endereco preenchido</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                {customersWithAddressRate.toFixed(0).replace('.', ',')}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Produtos ativos</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{productMetrics.activeProducts}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Capital em estoque</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{formatMoney(productMetrics.inventoryValue)}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <HorizontalBarChart
          title="Pedidos por status"
          description="Distribuicao dos pedidos no fluxo operacional atual."
          items={orderStatusBreakdown}
        />
        <HorizontalBarChart
          title="Formas de pagamento"
          description="Como os clientes estao preferindo pagar."
          items={paymentBreakdown}
        />
        <HorizontalBarChart
          title="Metodo de entrega"
          description="Comparativo entre delivery e retirada na loja."
          items={deliveryBreakdown}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Produtos mais vendidos</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Itens que mais geraram faturamento.</p>
              </div>
            </div>
            <Link
              href="/dashboard/pedidos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              Pedidos
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {topSellingProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                Ainda nao existem pedidos suficientes.
              </div>
            ) : (
              topSellingProducts.map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{product.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{product.quantity} un. vendidas</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{formatMoney(product.revenue)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Ultimos pedidos</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhamento imediato dos pedidos recentes.</p>
              </div>
            </div>
            <Link
              href="/dashboard/pedidos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Ver tudo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {recentOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                Nenhum pedido registrado ainda.
              </div>
            ) : (
              recentOrders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{order.customer_name}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getOrderStatusClasses(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDate(order.created_at)}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{order.total_items} itens</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{getPaymentLabel(order.payment_method)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{formatMoney(order.total_price)}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <HorizontalBarChart
          title="Categorias com mais itens"
          description="Em quais frentes o catalogo esta mais concentrado."
          items={productOverview.categoryBreakdown}
        />

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Alertas operacionais</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Itens que pedem atencao rapida.</p>
              </div>
            </div>
            <Link
              href="/dashboard/produtos/catalogo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              Catalogo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Estoque baixo</p>
                  <Boxes className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">{productMetrics.lowStockCount}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">3 un. ou menos.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sem WhatsApp</p>
                  <UserRound className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {Math.max(customersResult.summary.total - customersResult.summary.withWhatsapp, 0)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Sem canal de contato.</p>
              </div>
            </div>

            <div className="max-h-[180px] space-y-1.5 overflow-y-auto">
              {lowStockProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                  Nenhum produto critico no momento.
                </div>
              ) : (
                lowStockProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">{product.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Status: {product.status}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {product.stock} un.
                    </span>
                  </div>
                ))
              )}
              {lowStockProducts.length > 6 && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                  +{lowStockProducts.length - 6} outros produtos
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Status do catalogo</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Distribuicao entre ativos, rascunhos e ocultos.</p>
              </div>
            </div>
            <Link
              href="/dashboard/produtos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              Gerenciar
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-1.5">
            {productOverview.statusBreakdown.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                Nenhum dado disponivel.
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
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getProductStatusClasses(statusKey)}`}>
                      {getProductStatusLabel(statusKey)}
                    </span>
                    <span className="text-base font-semibold text-slate-900 dark:text-slate-50">{item.value}</span>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Ultimos produtos cadastrados</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Itens que entraram por ultimo no catalogo.</p>
              </div>
            </div>
            <Link
              href="/dashboard/produtos/catalogo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Catalogo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {productOverview.recentProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                Nenhum produto cadastrado ainda.
              </div>
            ) : (
              productOverview.recentProducts.slice(0, 3).map((product) => {
                const cover = product.product_images?.[0]?.public_url

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-slate-700">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">sem foto</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{product.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatMoney(Number(product.price ?? 0))}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span>{product.stock} em estoque</span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/produtos/${product.id}/editar`}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
                    >
                      Abrir
                    </Link>
                  </div>
                )
              })
            )}
            {productOverview.recentProducts.length > 3 && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                +{productOverview.recentProducts.length - 3} outros produtos
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Link
          href="/dashboard/pedidos"
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-700">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">Central de pedidos</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Acompanhe status, confirme entregas e opere o fluxo comercial.</p>
        </Link>

        <Link
          href="/dashboard/clientes"
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Users className="h-4 w-4" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">Base de clientes</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Veja quem compra e como esta a base ativa.</p>
        </Link>

        <Link
          href="/dashboard/produtos"
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <FolderKanban className="h-4 w-4" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">Operacao de catalogo</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Gerencie estoque e saude do mix de produtos.</p>
        </Link>
      </div>
    </div>
  )
}
