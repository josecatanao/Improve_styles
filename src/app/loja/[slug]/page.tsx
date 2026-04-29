import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Filters } from '@/components/store/Filters'
import { ProductCard } from '@/components/store/ProductCard'
import { StoreShell } from '@/components/store/StoreShell'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { getStoreCategoryBySlug } from '@/lib/products'
import { slugifyStoreValue, type StoreSortOption } from '@/lib/storefront'

function parseSort(value: string | string[] | undefined): StoreSortOption {
  if (value === 'price_asc' || value === 'price_desc') {
    return value
  }

  return 'popular'
}

export default async function StoreCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const queryParams = await searchParams
  const query = typeof queryParams.q === 'string' ? queryParams.q : ''
  const sort = parseSort(queryParams.sort)
  const [categoryPage, settings] = await Promise.all([
    getStoreCategoryBySlug(slug, { query, sort }),
    getPublicStoreSettings(),
  ])

  if (!categoryPage.setupRequired && categoryPage.errorMessage === 'Categoria nao encontrada.') {
    notFound()
  }

  const categories = categoryPage.categoryHighlights.map((item) => ({
    label: item.label,
    href: `/loja/${slugifyStoreValue(item.label)}`,
  }))

  return (
    <StoreShell
      categories={categories}
      query={query}
      branding={{ logoUrl: settings.store_logo_url, storeName: settings.store_name }}
    >
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition-colors hover:text-slate-900">
              Inicio
            </Link>
            <span>/</span>
            <span>{categoryPage.category ?? 'Categoria'}</span>
          </div>
          <h1 className="text-[1.85rem] font-semibold tracking-tight text-slate-950 sm:text-3xl">{categoryPage.category ?? 'Categoria'}</h1>
          <p className="text-sm text-slate-500">Lista filtrada por categoria com busca e ordenacao.</p>
        </div>

        <Filters
          action={`/loja/${slug}`}
          query={query}
          category=""
          sort={sort}
          categories={categoryPage.categoryHighlights.map((item) => item.label)}
          showCategory={false}
        />

        {categoryPage.setupRequired ? (
          <div className="rounded-none border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Configure o catalogo para publicar esta categoria na loja.
          </div>
        ) : categoryPage.products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
            {categoryPage.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-none border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">Nenhum produto nesta categoria.</p>
            <p className="mt-2 text-sm text-slate-500">Tente outra busca ou volte para a home da loja.</p>
          </div>
        )}
      </main>
    </StoreShell>
  )
}
