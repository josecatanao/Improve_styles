import Link from 'next/link'
import { ArrowRight, Package, Boxes, AlertTriangle, Wallet, FolderKanban, PlusCircle } from 'lucide-react'
import { getProductMetrics, getProducts } from '@/lib/products'
import { getProductStatusClasses, getProductStatusLabel } from '@/lib/product-shared'
import { ProductSetupNotice } from '@/components/products/ProductSetupNotice'

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default async function DashboardPage() {
  const [metrics, catalog] = await Promise.all([
    getProductMetrics(),
    getProducts({ page: '1' }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe os indicadores principais e acesse rapidamente as areas do sistema.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total de Produtos</h3>
            <Package className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.totalProducts}</p>
          <p className="mt-2 text-sm text-slate-500">
            {metrics.setupRequired ? 'Configure a base no Supabase para iniciar.' : 'Catalogo total cadastrado.'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Produtos Ativos</h3>
            <Boxes className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.activeProducts}</p>
          <p className="mt-2 text-sm text-slate-500">Itens prontos para operacao e futura vitrine.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Valor do Estoque</h3>
            <Wallet className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatMoney(metrics.inventoryValue)}</p>
          <p className="mt-2 text-sm text-slate-500">Estimativa baseada em preco x quantidade.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Estoque Baixo</h3>
            <AlertTriangle className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.lowStockCount}</p>
          <p className="mt-2 text-sm text-slate-500">Produtos com 3 unidades ou menos.</p>
        </div>
      </div>

      {metrics.setupRequired ? (
        <ProductSetupNotice />
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-[320px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Produtos</h3>
              <p className="text-sm text-slate-500">
                Acesse as telas principais de cadastro e catalogo.
              </p>
            </div>
            <Link
              href="/dashboard/produtos"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Abrir central
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link
              href="/dashboard/produtos/novo"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-slate-300 hover:bg-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <PlusCircle className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">Cadastrar produto</p>
              <p className="mt-2 text-sm text-slate-600">
                Formulario completo para criar um novo item.
              </p>
            </Link>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <Link
                  href="/dashboard/produtos/catalogo"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                >
                  Ver tudo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">Catalogo</p>
              <p className="mt-2 text-sm text-slate-600">
                Produtos mais recentes cadastrados na loja.
              </p>

              <div className="mt-4 space-y-3">
                {catalog.products.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    Nenhum produto cadastrado ainda.
                  </div>
                ) : (
                  catalog.products.slice(0, 4).map((product) => {
                    const cover = product.product_images?.[0]?.public_url

                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
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
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
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
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
