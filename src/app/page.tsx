import Link from 'next/link'
import { Briefcase, Grid2X2, MonitorPlay, Shirt, ShoppingBag, Sparkles, UserRound } from 'lucide-react'
import { HomeHeroCarousel } from '@/components/store/HomeHeroCarousel'
import { ProductCarouselRail } from '@/components/store/ProductCarouselRail'
import { StoreShell } from '@/components/store/StoreShell'
import { getStorefrontData } from '@/lib/products'
import { getStoreCategoryKey, normalizeStoreCategoryLabel, slugifyStoreValue, type ExtendedStoreSortOption } from '@/lib/storefront'

function parseSort(value: string | string[] | undefined): ExtendedStoreSortOption {
  if (value === 'price_asc' || value === 'price_desc' || value === 'recent') {
    return value
  }

  return 'popular'
}

function getCategoryIcon(index: number) {
  const icons = [Shirt, ShoppingBag, Sparkles, Briefcase, MonitorPlay, UserRound, Grid2X2]
  return icons[index % icons.length]
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q : ''
  const category = typeof params.category === 'string' ? params.category : ''
  const sort = parseSort(params.sort)
  const storefront = await getStorefrontData({ query, category, sort })
  const categorySectionMap = new Map<
    string,
    {
      label: string
      href: string
      products: typeof storefront.allProducts
    }
  >()

  storefront.allProducts.forEach((product) => {
    const label = normalizeStoreCategoryLabel(product.category)
    const key = getStoreCategoryKey(product.category)
    const existing = categorySectionMap.get(key)

    if (existing) {
      existing.products.push(product)
      return
    }

    categorySectionMap.set(key, {
      label,
      href: `/loja/${key}`,
      products: [product],
    })
  })

  const categories = Array.from(categorySectionMap.values())
    .sort((a, b) => b.products.length - a.products.length)
    .slice(0, 7)
    .map(({ label, href }) => ({ label, href }))

  const categorySections = Array.from(categorySectionMap.values())
    .map((section) => ({
      ...section,
      products: section.products.slice(0, 8),
    }))
    .filter((section) => section.products.length > 0)
    .sort((a, b) => b.products.length - a.products.length)
  const offers = (storefront.featuredProducts.length > 0 ? storefront.featuredProducts : storefront.newestProducts).slice(0, 4)
  const bestSellers = storefront.popularProducts.slice(0, 8)
  const newestProducts = storefront.newestProducts.slice(0, 8)
  const heroProducts = [...storefront.featuredProducts, ...storefront.newestProducts].filter(
    (product, index, array) => array.findIndex((item) => item.id === product.id) === index
  )

  return (
    <StoreShell categories={categories} query={query}>
      <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-4 sm:px-6 sm:py-5 lg:space-y-8 lg:px-8">
        <HomeHeroCarousel products={heroProducts} />

        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[1.45rem] font-semibold tracking-tight text-slate-950 sm:text-[1.8rem]">Categorias</h2>
            <span className="text-xs text-slate-500 sm:text-sm">Navegacao rapida</span>
          </div>

          <div className="flex items-start gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.length > 0 ? (
              <>
                {categories.slice(0, 7).map((item, index) => {
                  const Icon = getCategoryIcon(index)
                  return (
                    <Link key={item.href} href={item.href} className="shrink-0 text-center">
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-transform hover:-translate-y-0.5 sm:h-20 sm:w-20">
                        <Icon className="h-5 w-5 text-slate-700 sm:h-7 sm:w-7" />
                      </span>
                      <span className="mt-2 block max-w-20 text-xs font-medium text-slate-700 sm:mt-3 sm:max-w-none sm:text-sm">
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
                <a href="#produtos" className="shrink-0 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 sm:h-20 sm:w-20">
                    <Grid2X2 className="h-5 w-5 text-slate-700 sm:h-7 sm:w-7" />
                  </span>
                  <span className="mt-2 block text-xs font-medium text-slate-700 sm:mt-3 sm:text-sm">Ver todas</span>
                </a>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                Publique produtos para preencher as categorias da loja.
              </div>
            )}
          </div>
        </section>

        <div id="produtos">
          <ProductCarouselRail title="Ofertas em destaque" href="#produtos" products={offers} />
        </div>

        {newestProducts.length > 0 ? (
          <div id="novidades">
            <ProductCarouselRail title="Novidades" href="/?sort=recent" products={newestProducts} />
          </div>
        ) : null}

        {bestSellers.length > 0 ? (
          <div id="mais-vendidos">
            <ProductCarouselRail title="Mais vendidos" href="#mais-vendidos" products={bestSellers} />
          </div>
        ) : null}

        {storefront.errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{storefront.errorMessage}</div>
        ) : null}

        {storefront.setupRequired ? (
          <section id="produtos" className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">A loja esta pronta para receber o catalogo.</p>
            <p className="mt-2 text-sm text-slate-500">Configure os produtos no painel para publicar a vitrine.</p>
          </section>
        ) : categorySections.length > 0 ? (
          categorySections.map((section) => (
            <div key={section.label} id={slugifyStoreValue(section.label)}>
              <ProductCarouselRail title={section.label} href={section.href} products={section.products} />
            </div>
          ))
        ) : (
          <section id="produtos" className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">Nenhum produto encontrado.</p>
            <p className="mt-2 text-sm text-slate-500">Publique produtos para preencher as secoes por categoria.</p>
          </section>
        )}
      </main>
    </StoreShell>
  )
}
