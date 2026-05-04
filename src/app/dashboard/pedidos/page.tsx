import { OrderManagement } from '@/components/orders/OrderManagement'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getStoreOrders } from '@/lib/orders'

export default async function OrdersPage() {
  const { orders, setupRequired, errorMessage } = await getStoreOrders()

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Pedidos"
        description="Visualize e gerencie os pedidos realizados na sua loja."
      />

      {setupRequired ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Configuração necessária</h2>
          <p className="mt-2 text-sm text-amber-800">
            Execute o script SQL <code>supabase/02_orders.sql</code> no seu Supabase para criar as tabelas de pedidos.
          </p>
        </section>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : (
        <OrderManagement orders={orders} />
      )}
    </div>
  )
}
