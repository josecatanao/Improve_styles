import { Suspense } from 'react'
import Link from 'next/link'
import { Grid2X2 } from 'lucide-react'
import { HomeHeroCarousel } from '@/components/store/HomeHeroCarousel'
import { ProductCarouselRail } from '@/components/store/ProductCarouselRail'
import { ProductCard } from '@/components/store/ProductCard'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { StoreShell } from '@/components/store/StoreShell'
import { resolveCategoryIcon } from '@/lib/category-visuals'
import { getStorefrontData } from '@/lib/products'
import { getStorefrontCategories } from '@/lib/store-categories'
import { buildStorefrontThemeStyle } from '@/lib/store-settings'
import { HomeLoading } from '@/components/store/HomeLoading'
import {
  getCategorySectionId,
  getCategorySectionSlug,
  getStoreCategoryKey,
  normalizeHomepageLayout,
  normalizeStoreCategoryLabel,
  slugifyStoreValue,
  type ExtendedStoreSortOption,
} from '@/lib/storefront'
import { createClient } from '@/utils/supabase/server'

function parseSort(value: string | string[] | undefined): ExtendedStoreSortOption {
  if (value === 'price_asc' || value === 'price_desc' || value === 'recent') {
    return value
  }
  return 'popular'
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
  const supabase = await createClient()

  const [storefront, settings, bannersResponse, storefrontCategoryResult] = await Promise.all([
    getStorefrontData({ query, category, sort }),
    getPublicStoreSettings(),
    supabase.from('store_banners').select('*').eq('is_active', true).order('order_index', { ascending: true }),
    getStorefrontCategories(),
  ])

  const storefrontCategories = storefrontCategoryResult.categories
  const banners = bannersResponse.data || []

  const categorySectionMap = new Map<
    string,
    {
      key: string
      label: string
      href: string
      products: typeof storefront.allProducts
      sortOrder: number
    }
  >()

  storefrontCategories.forEach((storeCategory, index) => {
    categorySectionMap.set(storeCategory.slug, {
      key: storeCategory.slug,
      label: storeCategory.name,
      href: `/loja/${storeCategory.slug}`,
      products: [],
      sortOrder: index,
    })
  })

  storefront.allProducts.forEach((product) => {
    const label = normalizeStoreCategoryLabel(product.category)
    const key = getStoreCategoryKey(product.category)
    const existing = categorySectionMap.get(key)

    if (existing) {
      existing.products.push(product)
      return
    }

    if (storefrontCategoryResult.source !== 'fallback') {
      return
    }

    categorySectionMap.set(key, {
      key,
      label,
      href: `/loja/${key}`,
      products: [product],
      sortOrder: storefrontCategories.length + categorySectionMap.size,
    })
  })

  const categories = Array.from(categorySectionMap.values())
    .sort((a, b) => a.sortOrder - b.sortOrder || b.products.length - a.products.length)
    .slice(0, 7)
    .map(({ label, href, key }) => {
      const managedCategory = storefrontCategories.find((category) => category.slug === key)

      return {
        label,
        href,
        iconName: managedCategory?.icon_name || null,
        imageUrl: managedCategory?.image_url || null,
      }
    })

  const categorySections = Array.from(categorySectionMap.values())
    .map((section) => ({
      ...section,
      products: section.products.slice(0, 8),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || b.products.length - a.products.length)

  // Filter products for the dynamic sections
  const promotionalProducts = storefront.allProducts.filter(p => p.compare_at_price && p.compare_at_price > (p.price || 0)).slice(0, 8)
  const featuredProducts = storefront.allProducts.filter(p => p.is_featured).slice(0, 8)
  const isSearchMode = query.trim().length > 0
  const matchedCategories = storefront.filteredProducts
    .map((product) => product.category)
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeStoreCategoryLabel(value))
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 5)
  const matchedBrands = storefront.filteredProducts
    .map((product) => product.brand?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 5)
  
  // se nao houver nenhum "destacado" manualmente, a gente cai para o mais vendido ou mais recente
  const finalFeatured = featuredProducts.length > 0 
    ? featuredProducts 
    : (storefront.popularProducts.length > 0 ? storefront.popularProducts : storefront.newestProducts).slice(0, 8)

  return (
    <StoreShell 
      categories={categories} 
      query={query} 
      branding={{ logoUrl: settings.store_logo_url, storeName: settings.store_name }}
      brandStyle={buildStorefrontThemeStyle(settings)}
      announcement={settings.announcement_active ? {
        active: settings.announcement_active,
        text: settings.announcement_text,
        link: settings.announcement_link,
        backgroundColor: settings.announcement_background_color,
      } : null}
    >
      <Suspense fallback={<HomeLoading />}>
        <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-4 sm:px-6 sm:py-5 lg:space-y-8 lg:px-8">
        {isSearchMode ? (
          <section className="space-y-5">
            <div className="border border-slate-200 bg-white px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Busca na loja</p>
                  <div className="space-y-1">
                    <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                      Resultados para &quot;{query}&quot;
                    </h1>
                    <p className="text-sm text-slate-500">
                      {storefront.filteredProducts.length} produto{storefront.filteredProducts.length === 1 ? '' : 's'} encontrado{storefront.filteredProducts.length === 1 ? '' : 's'}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  {matchedCategories.map((item) => (
                    <Link key={`category:${item}`} href={`/?q=${encodeURIComponent(item)}`} className="border border-slate-200 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950">
                      {item}
                    </Link>
                  ))}
                  {matchedBrands.map((item) => (
                    <Link key={`brand:${item}`} href={`/?q=${encodeURIComponent(item)}`} className="border border-slate-200 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950">
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {storefront.filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
                {storefront.filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="border border-slate-200 bg-white px-5 py-10 text-center">
                <p className="text-lg font-semibold text-slate-900">Nenhum produto encontrado.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Tente buscar por nome do produto, categoria, marca, cor ou outra palavra relacionada.
                </p>
              </div>
            )}
          </section>
        ) : (
        (() => {
          const layoutArray = normalizeHomepageLayout(
            settings.homepage_layout,
            categorySections.map((section) => getCategorySectionId(section.key))
          )
          
          return layoutArray.map((sectionId: string) => {
            switch (sectionId) {
              case 'banners':
                return banners.length > 0 ? (
                  <HomeHeroCarousel key="banners" banners={banners} />
                ) : null

            case 'promotions':
              return promotionalProducts.length > 0 ? (
                <div key="promotions" id="promocoes">
                  <ProductCarouselRail title="Ofertas Especiais" href="#promocoes" products={promotionalProducts} />
                </div>
              ) : null

            case 'featured':
              return finalFeatured.length > 0 ? (
                <div key="featured" id="produtos">
                  <ProductCarouselRail title="Produtos em Destaque" href="#produtos" products={finalFeatured} />
                </div>
              ) : null

            case 'category-nav':
              return (
                <section key="category-nav" className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[1.08rem] font-semibold tracking-tight text-slate-950 sm:text-[1.2rem] lg:text-[1.35rem]">Categorias</h2>
                    <span className="text-xs text-slate-500 sm:text-sm">Navegacao rapida</span>
                  </div>

                  <div className="flex items-start gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {categories.length > 0 ? (
                      <>
                        {categories.slice(0, 7).map((item) => {
                          const Icon = resolveCategoryIcon(item.iconName)
                          return (
                            <Link key={item.href} href={item.href} className="shrink-0 text-center">
                              <span className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-transform hover:-translate-y-0.5 sm:h-16 sm:w-16">
                                {item.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.imageUrl} alt={item.label} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                  <Icon className="h-4.5 w-4.5 text-slate-700 sm:h-5 sm:w-5" />
                                )}
                              </span>
                              <span className="mt-2 block max-w-20 text-[11px] font-medium leading-4 text-slate-700 sm:mt-2 sm:max-w-[84px] sm:text-[12px]">
                                {item.label}
                              </span>
                            </Link>
                          )
                        })}
                        <a href="#produtos" className="shrink-0 text-center">
                          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 sm:h-16 sm:w-16">
                            <Grid2X2 className="h-4.5 w-4.5 text-slate-700 sm:h-5 sm:w-5" />
                          </span>
                          <span className="mt-2 block text-[11px] font-medium leading-4 text-slate-700 sm:mt-2 sm:text-[12px]">Ver todas</span>
                        </a>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                        Publique produtos para preencher as categorias da loja.
                      </div>
                    )}
                  </div>
                </section>
              )
            
            default:
              if (!sectionId.startsWith('category:')) {
                return null
              }

              {
                const categorySlug = getCategorySectionSlug(sectionId)
                const categorySection = categorySections.find((section) => section.key === categorySlug)

                if (!categorySection) {
                  return null
                }

                return (
                  <section key={sectionId} id={slugifyStoreValue(categorySection.label)} className="space-y-3">
                    {categorySection.products.length > 0 ? (
                      <ProductCarouselRail title={categorySection.label} href={categorySection.href} products={categorySection.products} />
                    ) : (
                      <div className="space-y-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6">
                        <div className="space-y-1">
                          <h2 className="text-[1.08rem] font-semibold tracking-tight text-slate-950 sm:text-[1.2rem] lg:text-[1.35rem]">
                            {categorySection.label}
                          </h2>
                          <p className="text-sm text-slate-500">Associe produtos a esta categoria para preencher a secao na home.</p>
                        </div>
                      </div>
                    )}
                  </section>
                )
              }
          }
        })})() )}

        {storefront.errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{storefront.errorMessage}</div>
        ) : null}

        {storefront.setupRequired ? (
          <section id="produtos-aviso" className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">A loja esta pronta para receber o catalogo.</p>
            <p className="mt-2 text-sm text-slate-500">Configure os produtos no painel para publicar a vitrine.</p>
          </section>
        ) : null}

        </main>
      </Suspense>
    </StoreShell>
  )
}
