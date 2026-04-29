import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/store/ProductDetailClient'
import { ProductCard } from '@/components/store/ProductCard'
import { StoreShell } from '@/components/store/StoreShell'
import { ProductReviews } from '@/components/store/ProductReviews'
import { getPublicProductById, getStorefrontData } from '@/lib/products'
import { getStoreCategoryKey, slugifyStoreValue } from '@/lib/storefront'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const [
    productResult,
    storefront,
    {
      data: { user },
    },
    { data: reviewsData },
  ] = await Promise.all([
    getPublicProductById(id),
    getStorefrontData(),
    supabase.auth.getUser(),
    adminSupabase
      .from('product_reviews')
      .select('id, rating, comment, created_at, customer:customer_profiles(full_name)')
      .eq('product_id', id)
      .order('created_at', { ascending: false }),
  ])

  const reviews = (reviewsData || []).map((r) => ({
    ...r,
    customer: r.customer ? (Array.isArray(r.customer) ? r.customer[0] : r.customer) : null,
  }))

  if (!productResult.setupRequired && !productResult.product) {
    notFound()
  }

  const categories = storefront.categoryHighlights.map((item) => ({
    label: item.label,
    href: `/loja/${slugifyStoreValue(item.label)}`,
  }))

  if (!productResult.product) {
    return (
      <StoreShell categories={categories}>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Produto indisponivel.
          </div>
        </main>
      </StoreShell>
    )
  }

  const product = productResult.product

  return (
    <StoreShell categories={categories}>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="transition-colors hover:text-slate-900">
            Inicio
          </Link>
          {product.category?.trim() ? (
            <>
              <span>/</span>
              <Link href={`/loja/${getStoreCategoryKey(product.category)}`} className="transition-colors hover:text-slate-900">
                {product.category}
              </Link>
            </>
          ) : null}
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <ProductDetailClient product={product} isAuthenticated={Boolean(user)} />

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Descricao do produto</h2>
          {product.short_description?.trim() ? (
            <p className="mt-3 text-base font-medium text-slate-900">{product.short_description.trim()}</p>
          ) : null}
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {product.description?.trim() || 'Adicione mais detalhes do produto no painel para enriquecer esta pagina.'}
          </p>
        </section>

        <ProductReviews productId={product.id} reviews={reviews} isLoggedIn={Boolean(user)} />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Produtos relacionados</h2>
            <p className="text-sm text-slate-500">Mais opcoes da mesma categoria ou marca.</p>
          </div>

          {productResult.relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {productResult.relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Ainda nao ha produtos relacionados publicados.
            </div>
          )}
        </section>
      </main>
    </StoreShell>
  )
}
