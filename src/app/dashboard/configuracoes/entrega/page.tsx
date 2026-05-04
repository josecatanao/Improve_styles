import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { DeliverySettingsManager } from '@/components/settings/DeliverySettingsManager'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { isMissingStoreSettingsColumnError, normalizeStoreSettings } from '@/lib/store-settings'
import { createClient } from '@/utils/supabase/server'

export default async function DeliverySettingsPage() {
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
        title="Métodos de entrega"
        description="Ative ou desative opções de delivery e retirada na loja, e configure o endereço de retirada."
      />

      <DeliverySettingsManager
        initialSettings={{
          delivery_enabled: settings.delivery_enabled,
          pickup_enabled: settings.pickup_enabled,
          store_address: settings.store_address,
          store_address_lat: settings.store_address_lat,
          store_address_lng: settings.store_address_lng,
        }}
        schemaReady={schemaReady}
      />
    </div>
  )
}
