import { notFound } from 'next/navigation'
import { getStoreOrderById } from '@/lib/orders'
import { OrderDetailView } from '@/components/orders/OrderDetailView'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { order, setupRequired, errorMessage } = await getStoreOrderById(id)

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

  return <OrderDetailView order={order} />
}
