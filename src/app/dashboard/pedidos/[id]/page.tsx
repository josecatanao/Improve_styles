import { notFound } from 'next/navigation'
import { getStoreOrderById } from '@/lib/orders'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { normalizeStoreSettings } from '@/lib/store-settings'
import { OrderDetailView } from '@/components/orders/OrderDetailView'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [orderResult, settings] = await Promise.all([
    getStoreOrderById(id),
    getPublicStoreSettings(),
  ])
  const { order, setupRequired, errorMessage } = orderResult

  if (setupRequired) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-amber-900">Configuracao necessaria</h2>
        <p className="mt-2 text-sm text-amber-800">
          Execute o script SQL <code>supabase/02_orders.sql</code> no seu Supabase para criar as tabelas de pedidos.
        </p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {errorMessage}
      </div>
    )
  }

  if (!order) {
    notFound()
  }

  const normalizedSettings = normalizeStoreSettings(settings)

  return (
    <OrderDetailView
      order={order}
      storeName={normalizedSettings.store_name}
      storeLogoUrl={normalizedSettings.store_logo_url}
      storeWhatsapp={normalizedSettings.store_whatsapp}
      storeAddress={normalizedSettings.store_address}
    />
  )
}
