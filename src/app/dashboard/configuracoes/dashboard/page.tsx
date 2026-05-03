import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { DashboardAppearanceManager } from '@/components/settings/DashboardAppearanceManager'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { isMissingStoreSettingsColumnError, normalizeStoreSettings } from '@/lib/store-settings'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardSettingsPage() {
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
        title="Aparencia do dashboard"
        description="Personalize o tema e as cores do painel administrativo."
      />

      <DashboardAppearanceManager
        initialTheme={settings.dashboard_theme}
        initialBrandPrimaryColor={settings.brand_primary_color}
        initialBrandSecondaryColor={settings.brand_secondary_color}
        schemaReady={schemaReady}
      />
    </div>
  )
}
