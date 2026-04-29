import { redirect } from 'next/navigation'
import { OrdersOverview } from '@/components/customers/OrdersOverview'
import { getCustomerOrders } from '@/lib/account'
import { getStoreCustomerSession } from '@/lib/customer-session'

export default async function AccountOrdersPage() {
  const session = await getStoreCustomerSession()

  if (!session) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  const orders = await getCustomerOrders(session.userId)

  return <OrdersOverview orders={orders} />
}
