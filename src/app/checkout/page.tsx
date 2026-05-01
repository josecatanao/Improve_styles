import { CheckoutClient } from '@/components/store/CheckoutClient'
import { StoreShell } from '@/components/store/StoreShell'
import { getStorefrontData } from '@/lib/products'
import { slugifyStoreValue } from '@/lib/storefront'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { DeliverySettings } from '@/components/store/CheckoutClient'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; orderId?: string; coupon?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?mode=customer&next=%2Fcheckout')
  }

  const [{ data: profile }, settings] = await Promise.all([
    supabase.from('customer_profiles').select('*').eq('id', user.id).single(),
    getPublicStoreSettings(),
  ])

  const storefront = await getStorefrontData()
  const categories = storefront.categoryHighlights.map((item) => ({
    label: item.label,
    href: `/loja/${slugifyStoreValue(item.label)}`,
  }))

  const params = await searchParams
  const orderId = params.orderId

  const deliverySettings: DeliverySettings = {
    delivery_enabled: settings.delivery_enabled,
    pickup_enabled: settings.pickup_enabled,
    allow_shipping_other_states: settings.allow_shipping_other_states,
  }

  return (
    <StoreShell categories={categories}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">Revise os itens e informe os dados do pedido.</p>
        </div>

        <CheckoutClient
          initialProfile={profile}
          orderId={orderId}
          initialCoupon={params.coupon ?? null}
          deliverySettings={deliverySettings}
        />
      </main>
    </StoreShell>
  )
}
