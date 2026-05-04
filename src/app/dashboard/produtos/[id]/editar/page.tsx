import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ProductForm } from '@/components/products/ProductForm'
import { ProductSetupNotice } from '@/components/products/ProductSetupNotice'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getProductById, getProductFormOptions } from '@/lib/products'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [result, options] = await Promise.all([getProductById(id), getProductFormOptions()])

  if (result.setupRequired) {
    return <ProductSetupNotice />
  }

  if (result.errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {result.errorMessage}
      </div>
    )
  }

  if (!result.product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Editar produto"
        description="Atualize as informações do item, reorganize imagens e ajuste o status do catálogo."
      />

      <div className="flex">
        <Link
          href="/dashboard/produtos/catalogo"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o catálogo
        </Link>
      </div>

      <ProductForm mode="edit" product={result.product} options={options} />
    </div>
  )
}
