import { createAdminClient } from '@/utils/supabase/admin'
import { MarketingManager } from '@/components/marketing/MarketingManager'
import { getManagedStoreCategories } from '@/lib/store-categories'
import { normalizeStoreSettings } from '@/lib/store-settings'
import { getCategorySectionId, normalizeHomepageLayout } from '@/lib/storefront'

export default async function MarketingPage() {
  const supabase = createAdminClient()

  const [settingsResponse, bannersResponse, managedCategoryResult] = await Promise.all([
    supabase.from('store_settings').select('*').single(),
    supabase.from('store_banners').select('*').order('order_index', { ascending: true }),
    getManagedStoreCategories(),
  ])
  const managedCategories = managedCategoryResult.categories

  const setupRequired =
    settingsResponse.error?.code === 'PGRST205' ||
    bannersResponse.error?.code === 'PGRST205' ||
    settingsResponse.error?.message?.includes("Could not find the table 'public.store_") ||
    bannersResponse.error?.message?.includes("Could not find the table 'public.store_")

  // Fallbacks just in case
  const settings = normalizeStoreSettings(settingsResponse.data)

  const banners = bannersResponse.data || []
  const availableSections = [
    {
      id: 'banners',
      label: 'Banners principais',
      description: 'Carrossel do topo da pagina inicial para campanhas, lancamentos e avisos visuais.',
    },
    {
      id: 'promotions',
      label: 'Ofertas especiais',
      description: 'Faixa de produtos em promocao para destacar descontos e oportunidades de compra.',
    },
    {
      id: 'featured',
      label: 'Produtos em destaque',
      description: 'Secao com os produtos mais importantes da loja ou itens que merecem maior visibilidade.',
    },
    {
      id: 'category-nav',
      label: 'Atalhos de categorias',
      description: 'Bloco com categorias em evidência para facilitar a navegacao logo no inicio da home.',
    },
    ...managedCategories.map((category) => ({
      id: getCategorySectionId(category.slug),
      label: `Categoria: ${category.name}`,
      description: `Mostra uma vitrine com produtos da categoria ${category.name} dentro da pagina inicial.`,
    })),
  ]
  const normalizedSettings = {
    ...settings,
    homepage_layout: normalizeHomepageLayout(settings.homepage_layout, availableSections.slice(4).map((section) => section.id)),
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Marketing & Vitrine</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gerencie banners da loja, faixas de anuncio e reordene as secoes da sua pagina inicial.
        </p>
      </div>

      {setupRequired ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Configuracao necessaria</h2>
          <p className="mt-2 text-sm text-amber-800">
            Execute o script SQL <code>supabase/04_marketing_and_reviews.sql</code> no seu Supabase para criar
            <code> store_settings</code>, <code> store_banners</code> e as politicas de marketing.
          </p>
        </section>
      ) : (
        <MarketingManager initialSettings={normalizedSettings} initialBanners={banners} availableSections={availableSections} />
      )}
    </div>
  )
}
