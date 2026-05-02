import { CheckoutClient } from '@/components/store/CheckoutClient'
import { StoreShell } from '@/components/store/StoreShell'
import { getStorefrontData } from '@/lib/products'
import { slugifyStoreValue } from '@/lib/storefront'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { createClient } from '@/utils/supabase/server'
import { calculateShipping } from '@/lib/shipping'
import { redirect } from 'next/navigation'
import type { DeliverySettings } from '@/components/store/CheckoutClient'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; orderId?: string; coupon?: string; cep?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?mode=customer&next=%2Fcheckout')
  }

  const params = await searchParams
  const orderId = params.orderId
  const queryCep = params.cep?.replace(/\D/g, '').slice(0, 8) || null

  const [{ data: profile }, settings] = await Promise.all([
    supabase.from('customer_profiles').select('*').eq('id', user.id).single(),
    getPublicStoreSettings(),
  ])

  const profileCep = (profile as any)?.delivery_zip_code?.replace(/\D/g, '').slice(0, 8) || null
  const effectiveCep = queryCep || profileCep

  let initialShippingCep: string | null = null
  let initialShippingResult: Awaited<ReturnType<typeof calculateShipping>> | null = null

  if (effectiveCep && effectiveCep.length === 8) {
    initialShippingCep = effectiveCep
    initialShippingResult = await calculateShipping(effectiveCep, { orderTotal: 0 })
  }

  const storefront = await getStorefrontData()
  const categories = storefront.categoryHighlights.map((item) => ({
    label: item.label,
    href: `/loja/${slugifyStoreValue(item.label)}`,
  }))

  const deliverySettings: DeliverySettings = {
    delivery_enabled: settings.delivery_enabled,
    pickup_enabled: settings.pickup_enabled,
  }

  const storeAddress = settings.store_address?.trim() || null
  const storeAddressLat = settings.store_address_lat ?? null
  const storeAddressLng = settings.store_address_lng ?? null

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
          initialShippingCep={initialShippingCep}
          initialShippingResult={initialShippingResult}
          storeAddress={storeAddress}
          storeAddressLat={storeAddressLat}
          storeAddressLng={storeAddressLng}
        />
      </main>
    </StoreShell>
  )
}
