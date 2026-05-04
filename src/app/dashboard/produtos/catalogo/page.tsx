import { ProductMetricsGrid } from '@/components/products/ProductMetricsGrid'
import { ProductSetupNotice } from '@/components/products/ProductSetupNotice'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { CatalogClient } from '@/components/products/CatalogClient'
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
        title="Catalogo"
        description="Gerencie seus produtos, acompanhe precos e estoque de forma rapida."
      />

      <ProductMetricsGrid metrics={metrics} />

      {productList.setupRequired ? (
        <ProductSetupNotice />
      ) : (
        <CatalogClient initialData={productList} />
      )}
    </div>
  )
}
