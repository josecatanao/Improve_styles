import { CategoryManagement } from '@/components/products/CategoryManagement'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getManagedStoreCategories } from '@/lib/store-categories'

export default async function ProductCategoriesPage() {
  const { categories, setupRequired, errorMessage } = await getManagedStoreCategories()

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Categorias"
        description="Cadastre e organize as categorias oficiais da loja para usar no catálogo e nas seções da home."
      />

      {setupRequired ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Configuração necessária</h2>
          <p className="mt-2 text-sm text-amber-800">
            Execute o script SQL <code>supabase/05_store_categories.sql</code> no seu Supabase para habilitar a central de categorias.
          </p>
        </section>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMessage}</div>
      ) : (
        <CategoryManagement initialCategories={categories} />
      )}
    </div>
  )
}
