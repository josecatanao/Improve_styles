import Link from 'next/link'
import { ArrowRight, BarChart3, ChartColumn, FolderKanban, TriangleAlert } from 'lucide-react'
import { ProductMetricsGrid } from '@/components/products/ProductMetricsGrid'
import { ProductSetupNotice } from '@/components/products/ProductSetupNotice'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getProductMetrics, getProductOverviewData, getLowStockProducts } from '@/lib/products'
import { getProductStatusClasses, getProductStatusLabel } from '@/lib/product-shared'
import { HorizontalBarChart } from '@/components/ui/chart-components'

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default async function ProductsPage() {
  const [metrics, overview, lowStockProducts] = await Promise.all([
    getProductMetrics(),
    getProductOverviewData(),
    getLowStockProducts(),
  ])

  return (
    <div className="space-y-5">
      <ProductWorkspaceHeader
        title="Produtos"
        description="Gerencie o cadastro e acompanhe o catálogo da sua loja em uma área organizada."
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
            <HorizontalBarChart
              title="Produtos por categoria"
              description="Onde o catálogo está mais concentrado hoje."
              items={overview.categoryBreakdown}
            />
            <HorizontalBarChart
              title="Faixas de estoque"
              description="Distribuição entre ruptura, baixo volume e estoque saudável."
              items={overview.stockBands}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Maior valor em estoque</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Produtos que concentram mais capital parado.</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {overview.topInventoryProducts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                    Nenhum produto disponível para análise.
                  </div>
                ) : (
                  overview.topInventoryProducts.slice(0, 3).map((product, index) => (
                    <div
                      key={product.id}
                      className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{product.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {product.stock} un. • {formatMoney(product.price)} por un.
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {formatMoney(product.value)}
                      </div>
                      <Link
                        href={`/dashboard/produtos/${product.id}/editar`}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
                      >
                        Abrir
                      </Link>
                    </div>
                  ))
                )}
                {overview.topInventoryProducts.length > 3 && (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    +{overview.topInventoryProducts.length - 3} outros produtos
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <ChartColumn className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Status do catálogo</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Distribuição entre ativos, ocultos e rascunho.</p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                {overview.statusBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getProductStatusClasses(
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
                    <span className="text-base font-semibold text-slate-900 dark:text-slate-50">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <HorizontalBarChart
              title="Marcas com mais itens"
              description="Peso de cada marca no sortimento do catálogo."
              items={overview.brandBreakdown}
            />

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Últimos produtos cadastrados</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhamento rápido dos itens mais recentes.</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/produtos/catalogo"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  Ver catalogo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-4 space-y-2">
                {overview.recentProducts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                    Nenhum produto cadastrado ainda.
                  </div>
                ) : (
                  overview.recentProducts.slice(0, 3).map((product) => {
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
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                              sem foto
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{product.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatMoney(Number(product.price ?? 0))}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{product.stock} em estoque</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getProductStatusClasses(product.status)}`}
                            >
                              {getProductStatusLabel(product.status)}
                            </span>
                            {product.product_variants?.length ? (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {product.product_variants.length} variação(ões)
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                {overview.recentProducts.length > 3 && (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    +{overview.recentProducts.length - 3} outros produtos
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
