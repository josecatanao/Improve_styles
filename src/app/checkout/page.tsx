import { CheckoutClient } from '@/components/store/CheckoutClient'
import { StoreShell } from '@/components/store/StoreShell'
import { getStorefrontData } from '@/lib/products'
import { slugifyStoreValue } from '@/lib/storefront'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?mode=customer&next=%2Fcheckout')
  }

  const storefront = await getStorefrontData()
  const categories = storefront.categoryHighlights.map((item) => ({
    label: item.label,
    href: `/loja/${slugifyStoreValue(item.label)}`,
  }))

  return (
    <StoreShell categories={categories}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">Revise os itens e informe os dados basicos do pedido.</p>
        </div>

        <CheckoutClient />
      </main>
    </StoreShell>
  )
}
