import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { StoreAppearanceManager } from '@/components/settings/StoreAppearanceManager'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { isMissingStoreSettingsColumnError, normalizeStoreSettings } from '@/lib/store-settings'
import { createClient } from '@/utils/supabase/server'

export default async function StoreSettingsPage() {
  const supabase = await createClient()
  const [{ data, error }, cachedSettings] = await Promise.all([
    supabase.from('store_settings').select('*').limit(1).maybeSingle(),
    getPublicStoreSettings(),
  ])

  const schemaReady = !isMissingStoreSettingsColumnError(error)
  const settings = schemaReady ? normalizeStoreSettings(data) : cachedSettings

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Configurações da loja"
        description="Ajuste a identidade visual e a aparência pública da sua vitrine."
      />

      <StoreAppearanceManager
        initialSettings={{
          store_name: settings.store_name,
          store_logo_url: settings.store_logo_url,
          store_header_background_color: settings.store_header_background_color,
          store_button_background_color: settings.store_button_background_color,
          store_card_background_color: settings.store_card_background_color,
          store_card_border_color: settings.store_card_border_color,
          store_cart_button_color: settings.store_cart_button_color,
          dashboard_theme: settings.dashboard_theme,
        }}
        schemaReady={schemaReady}
      />
    </div>
  )
}
