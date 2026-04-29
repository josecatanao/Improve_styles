import { redirect } from 'next/navigation'
import { OrdersOverview } from '@/components/customers/OrdersOverview'
import { getAccountProfile, getCustomerOrders } from '@/lib/account'
import { getStoreCustomerSession } from '@/lib/customer-session'
import { getPublicStoreSettings } from '@/lib/store-branding'

export default async function AccountOrdersPage() {
  const session = await getStoreCustomerSession()

  if (!session) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  const [orders, profile, settings] = await Promise.all([
    getCustomerOrders(session.userId),
    getAccountProfile(session.userId),
    getPublicStoreSettings(),
  ])

  return (
    <OrdersOverview
      orders={orders}
      customer={{
        email: session.email,
        fullName: profile?.full_name ?? session.profile?.full_name ?? null,
        whatsapp: profile?.whatsapp ?? session.profile?.whatsapp ?? null,
      }}
      brandPrimaryColor={settings.brand_primary_color}
    />
  )
}
