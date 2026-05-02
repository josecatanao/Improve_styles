import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/store/ProductDetailClient'
import { ProductCard } from '@/components/store/ProductCard'
import { StoreShell } from '@/components/store/StoreShell'
import { ProductReviews } from '@/components/store/ProductReviews'
import { getPublicProductById, getStorefrontData } from '@/lib/products'
import { getPublicStoreSettings } from '@/lib/store-branding'
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
    settings,
  ] = await Promise.all([
    getPublicProductById(id),
    getStorefrontData(),
    supabase.auth.getUser(),
    adminSupabase
      .from('product_reviews')
      .select('id, rating, comment, created_at, customer:customer_profiles(full_name, photo_url)')
      .eq('product_id', id)
      .order('created_at', { ascending: false }),
    getPublicStoreSettings(),
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
          <div className="rounded-none border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Produto indisponivel.
          </div>
        </main>
      </StoreShell>
    )
  }

  const product = productResult.product
  const deliverySettings = {
    delivery_enabled: settings.delivery_enabled,
    pickup_enabled: settings.pickup_enabled,
  }

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

        <ProductDetailClient product={product} isAuthenticated={Boolean(user)} deliverySettings={deliverySettings} />

        {product.short_description?.trim() || product.description?.trim() ? (
          <section className="rounded-none border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">Descricao do produto</h2>
            {product.short_description?.trim() ? (
              <p className="mt-3 text-base font-medium text-slate-900">{product.short_description.trim()}</p>
            ) : null}
            {product.description?.trim() ? (
              <p className="mt-3 text-sm leading-7 text-slate-600">{product.description.trim()}</p>
            ) : null}
          </section>
        ) : null}

        {product.show_specs && (product.weight != null || product.width != null || product.height != null || product.length != null) ? (
          <section className="rounded-none border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">Especificacoes tecnicas</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {product.weight != null ? (
                <div className="rounded-none border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Peso</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{product.weight} g</p>
                </div>
              ) : null}
              {product.width != null ? (
                <div className="rounded-none border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Largura</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{product.width} cm</p>
                </div>
              ) : null}
              {product.height != null ? (
                <div className="rounded-none border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Altura</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{product.height} cm</p>
                </div>
              ) : null}
              {product.length != null ? (
                <div className="rounded-none border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Comprimento</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{product.length} cm</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

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
            <div className="rounded-none border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Ainda nao ha produtos relacionados publicados.
            </div>
          )}
        </section>
      </main>
    </StoreShell>
  )
}
