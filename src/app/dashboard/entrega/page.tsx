import { ShippingManagement } from '@/components/shipping/ShippingManagement'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getShippingZones } from '@/lib/shipping'

export default async function EntregaPage() {
  const { zones, setupRequired, errorMessage } = await getShippingZones()

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Zonas de entrega"
        description="Cadastre zonas de entrega por faixa de CEP, preços de frete e prazos estimados."
      />

      {setupRequired ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Configuração necessária</h2>
          <p className="mt-2 text-sm text-amber-800">
            Execute o script SQL <code>supabase/10_shipping.sql</code> no seu Supabase para criar a tabela de zonas de entrega.
          </p>
        </section>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : (
        <ShippingManagement initialZones={zones} />
      )}
    </div>
  )
}
