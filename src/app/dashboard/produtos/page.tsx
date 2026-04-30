import Link from 'next/link'
import { ArrowRight, BarChart3, ChartColumn, FolderKanban, PackageSearch, Tags, TriangleAlert } from 'lucide-react'
import { ProductMetricsGrid } from '@/components/products/ProductMetricsGrid'
import { ProductSetupNotice } from '@/components/products/ProductSetupNotice'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getProductMetrics, getProductOverviewData, getLowStockProducts } from '@/lib/products'
import { getProductStatusClasses, getProductStatusLabel } from '@/lib/product-shared'

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function BarChartCard({
  title,
  description,
  icon: Icon,
  items,
  tone = 'dark',
}: {
  title: string
  description: string
  icon: typeof ChartColumn
  items: Array<{ label: string; value: number }>
  tone?: 'dark' | 'blue'
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)
  const barClass = tone === 'blue' ? 'bg-blue-600' : 'bg-slate-900'
  const iconClass = tone === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Nenhum dado disponivel para este grafico.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-900">{item.label}</p>
                <span className="text-sm text-slate-500">{item.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default async function ProductsPage() {
  const [metrics, overview, lowStockProducts] = await Promise.all([
    getProductMetrics(),
    getProductOverviewData(),
    getLowStockProducts(),
  ])

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Produtos"
        description="Gerencie o cadastro e acompanhe o catalogo da sua loja em uma area organizada."
      />

      <ProductMetricsGrid metrics={metrics} />

      {metrics.setupRequired || overview.setupRequired ? (
        <ProductSetupNotice />
      ) : (
        <>
          {lowStockProducts.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    {lowStockProducts.length} produto(s) com estoque baixo
                  </p>
                  <p className="mt-1 text-sm text-amber-700/80">
                    {lowStockProducts
                      .slice(0, 5)
                      .map((p) => `${p.name} (${p.stock} un.)`)
                      .join(' • ')}
                    {lowStockProducts.length > 5 ? ` • +${lowStockProducts.length - 5} outros` : ''}
                  </p>
                </div>
                <Link
                  href="/dashboard/produtos?status=active"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200"
                >
                  Ver catalogo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
          {overview.errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {overview.errorMessage}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-2">
            <BarChartCard
              title="Produtos por categoria"
              description="Mostra onde o catalogo esta mais concentrado hoje."
              icon={Tags}
              items={overview.categoryBreakdown}
            />
            <BarChartCard
              title="Faixas de estoque"
              description="Ajuda a identificar distribuicao entre ruptura, baixo volume e estoque saudavel."
              icon={PackageSearch}
              items={overview.stockBands}
              tone="blue"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Produtos com maior valor em estoque</h2>
                  <p className="text-sm text-slate-500">Produtos que concentram mais capital parado no catalogo.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {overview.topInventoryProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum produto disponivel para analise.
                  </div>
                ) : (
                  overview.topInventoryProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {product.stock} un. • {formatMoney(product.price)} por unidade
                        </p>
                      </div>
                      <div className="text-sm text-slate-500">
                        <span className="font-medium text-slate-900">{formatMoney(product.value)}</span>
                      </div>
                      <Link
                        href={`/dashboard/produtos/${product.id}/editar`}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                      >
                        Abrir
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <ChartColumn className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Status do catalogo</h2>
                  <p className="text-sm text-slate-500">Distribuicao real entre itens ativos, ocultos e em rascunho.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {overview.statusBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getProductStatusClasses(
                          item.label === 'Ativos'
                            ? 'active'
                            : item.label === 'Rascunhos'
                              ? 'draft'
                              : item.label === 'Esgotados'
                                ? 'out_of_stock'
                                : 'hidden'
                        )}`}
                      >
                        {item.label === 'Ativos'
                          ? getProductStatusLabel('active')
                          : item.label === 'Rascunhos'
                            ? getProductStatusLabel('draft')
                            : item.label === 'Esgotados'
                              ? getProductStatusLabel('out_of_stock')
                              : getProductStatusLabel('hidden')}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <BarChartCard
              title="Marcas com mais itens"
              description="Ajuda a entender o peso de cada marca no sortimento."
              icon={FolderKanban}
              items={overview.brandBreakdown}
            />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Ultimos produtos cadastrados</h2>
                    <p className="text-sm text-slate-500">Acompanhamento rapido dos itens mais recentes.</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/produtos/catalogo"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Ver catalogo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {overview.recentProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum produto cadastrado ainda.
                  </div>
                ) : (
                  overview.recentProducts.map((product) => {
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
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              sem foto
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatMoney(Number(product.price ?? 0))}</span>
                            <span className="text-slate-300">•</span>
                            <span>{product.stock} em estoque</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getProductStatusClasses(product.status)}`}
                            >
                              {getProductStatusLabel(product.status)}
                            </span>
                            {product.product_variants?.length ? (
                              <span className="text-[11px] text-slate-500">
                                {product.product_variants.length} variacao(oes)
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
