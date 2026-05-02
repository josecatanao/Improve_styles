import { Search } from 'lucide-react'
import { ProductMetricsGrid } from '@/components/products/ProductMetricsGrid'
import { ProductSetupNotice } from '@/components/products/ProductSetupNotice'
import { ProductTable } from '@/components/products/ProductTable'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getProductMetrics, getProducts } from '@/lib/products'

export default async function ProductCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const page = typeof params.page === 'string' ? params.page : '1'

  const [productList, metrics] = await Promise.all([
    getProducts({ query, status, page }),
    getProductMetrics(),
  ])

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Estoque"
        description="Consulte o estoque interno, acompanhe variacoes e filtre os produtos por situacao comercial."
      />

      <ProductMetricsGrid metrics={metrics} />

      {productList.setupRequired ? (
        <ProductSetupNotice />
      ) : (
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Filtrar produtos</h2>
              <p className="text-sm text-slate-500">
                Busque por nome, SKU, categoria ou marca e ajuste a listagem pelo status do item.
              </p>
            </div>

            <form className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar por nome, SKU, categoria ou marca"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <select
                name="status"
                defaultValue={status}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="draft">Rascunhos</option>
                <option value="out_of_stock">Esgotados</option>
                <option value="hidden">Ocultos</option>
              </select>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Filtrar
              </button>
            </form>
          </div>

          {productList.errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {productList.errorMessage}
            </div>
          ) : (
            <ProductTable
              products={productList.products}
              currentPage={productList.currentPage}
              totalPages={productList.totalPages}
              query={query}
              status={status}
              basePath="/dashboard/produtos/catalogo"
            />
          )}
        </section>
      )}
    </div>
  )
}
