import { CustomerManagement } from '@/components/customers/CustomerManagement'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getCustomerProfiles } from '@/lib/customers'

export default async function CustomersPage() {
  const { customers, summary, setupRequired, errorMessage } = await getCustomerProfiles()

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Clientes"
        description="Visualize quem criou conta na loja e acompanhe os dados de contato e entrega."
      />

      {setupRequired ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Configuração necessária</h2>
          <p className="mt-2 text-sm text-amber-800">
            Execute o SQL atualizado de <code>supabase/products.sql</code> e configure a service role do Supabase para habilitar a base de clientes.
          </p>
        </section>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : (
        <CustomerManagement customers={customers} summary={summary} />
      )}
    </div>
  )
}
