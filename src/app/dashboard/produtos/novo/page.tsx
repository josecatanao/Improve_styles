import { ProductForm } from '@/components/products/ProductForm'
import { ProductSetupNotice } from '@/components/products/ProductSetupNotice'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getProductFormOptions, getProductMetrics } from '@/lib/products'

export default async function NewProductPage() {
  const [metrics, options] = await Promise.all([getProductMetrics(), getProductFormOptions()])

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Cadastrar produto"
        description="Preencha os dados do item, envie imagens e salve o produto no catálogo."
      />

      {metrics.setupRequired ? (
        <ProductSetupNotice />
      ) : (
        <ProductForm options={options} />
      )}
    </div>
  )
}
