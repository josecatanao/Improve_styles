import { PackageCheck, Navigation2, MapPin, CreditCard, ShieldAlert, Banknote, Package } from 'lucide-react'
import { formatMoney } from '@/lib/storefront'
import { createClient } from '@/utils/supabase/server'
import type { StoreOrderItem } from '@/lib/orders'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pendente</span>
    case 'processing':
      return <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Processando</span>
    case 'shipped':
      return <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">Enviado</span>
    case 'completed':
      return <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Concluido</span>
    case 'cancelled':
      return <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Cancelado</span>
    default:
      return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{status}</span>
  }
}

export async function RecentOrdersPanel() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: orders } = await supabase
    .from('store_orders')
    .select(`
      id,
      created_at,
      total_price,
      total_items,
      status,
      delivery_method,
      payment_method,
      installments,
      delivery_address,
      delivery_lat,
      delivery_lng,
      store_order_items (
        id,
        name,
        quantity,
        price
      )
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Meus Pedidos</h2>
          <p className="mt-1 text-sm text-slate-500">Acompanhe o historico de pedidos feitos na loja.</p>
        </div>
      </div>

      {orders && orders.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">Pedido {order.id.split('-')[0].toUpperCase()}</p>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950">{formatMoney(order.total_price)}</p>
                  <p className="text-xs text-slate-500">{order.total_items} itens</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Entrega</p>
                  <div className="text-xs text-slate-600">
                    {order.delivery_method === 'pickup' ? (
                      <div className="flex items-center gap-1.5 font-medium">
                        <Package className="h-3.5 w-3.5" /> Retirar na loja
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2 leading-tight">
                            {order.delivery_address || 'Endereço não informado'}
                          </span>
                        </div>
                        {order.delivery_lat && order.delivery_lng ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-[#3483fa] hover:underline"
                          >
                            <Navigation2 className="h-3 w-3" /> Abrir no mapa
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Pagamento</p>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    {order.payment_method === 'pix' ? (
                      <><ShieldAlert className="h-3.5 w-3.5" /> Pix</>
                    ) : order.payment_method === 'cash' ? (
                      <><Banknote className="h-3.5 w-3.5" /> Dinheiro</>
                    ) : (
                      <><CreditCard className="h-3.5 w-3.5" /> Cartão {order.installments}x</>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Itens</p>
                {order.store_order_items.map((item: Pick<StoreOrderItem, 'id' | 'name' | 'quantity' | 'price'>) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-slate-700">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="shrink-0 text-slate-500">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-sm text-slate-500">
          Você ainda não realizou nenhum pedido.
        </div>
      )}
    </section>
  )
}
