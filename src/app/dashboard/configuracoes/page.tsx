import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { StoreAppearanceManager } from '@/components/settings/StoreAppearanceManager'
import { normalizeStoreSettings, isMissingStoreSettingsColumnError } from '@/lib/store-settings'
import { createClient } from '@/utils/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('store_settings').select('*').limit(1).maybeSingle()

  const schemaReady = !isMissingStoreSettingsColumnError(error)
  const settings = normalizeStoreSettings(data)

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Configuracoes"
        description="Ajuste a identidade visual da loja, controle a paleta dos botoes e escolha o tema do dashboard."
      />

      <StoreAppearanceManager
        initialSettings={{
          store_logo_url: settings.store_logo_url,
          brand_primary_color: settings.brand_primary_color,
          brand_secondary_color: settings.brand_secondary_color,
          dashboard_theme: settings.dashboard_theme,
        }}
        schemaReady={schemaReady}
      />
    </div>
  )
}
