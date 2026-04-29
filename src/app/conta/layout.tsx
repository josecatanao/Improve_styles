import { StoreShell } from '@/components/store/StoreShell'
import { getStorefrontData } from '@/lib/products'
import { slugifyStoreValue } from '@/lib/storefront'
import { getStoreCustomerSession } from '@/lib/customer-session'
import { redirect } from 'next/navigation'
import { AccountSidebar } from '@/components/customers/AccountSidebar'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [customerSession, storefront] = await Promise.all([getStoreCustomerSession(), getStorefrontData()])

  if (!customerSession) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  const categories = storefront.categoryHighlights.map((item) => ({
    label: item.label,
    href: `/loja/${slugifyStoreValue(item.label)}`,
  }))

  const profile = customerSession.profile
  const customerName = profile?.full_name?.trim() || customerSession.email || 'Minha conta'

  return (
    <StoreShell categories={categories}>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Olá, {customerName}</h1>
          <p className="mt-2 text-sm text-slate-500">Gerencie seus dados, endereços e acompanhe seus pedidos.</p>
        </div>

        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <aside className="w-full shrink-0 md:w-64">
            <AccountSidebar />
          </aside>
          
          <div className="min-w-0 flex-1">
            {children}
          </div>
        </div>
      </main>
    </StoreShell>
  )
}
