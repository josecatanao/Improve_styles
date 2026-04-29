import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { getRecentOrderSignals } from '@/lib/orders'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { buildStoreBrandStyle, normalizeStoreSettings } from '@/lib/store-settings'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Protect all dashboard routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (user.user_metadata.account_type === 'customer') {
    redirect('/')
  }

  const [settings, recentOrders] = await Promise.all([
    getPublicStoreSettings(),
    getRecentOrderSignals(),
  ])
  const normalizedSettings = normalizeStoreSettings(settings)
  const brandStyle = buildStoreBrandStyle(normalizedSettings)

  return (
    <div
      className={`flex h-screen w-full ${normalizedSettings.dashboard_theme === 'dark' ? 'dark dashboard-theme-dark bg-slate-950' : 'bg-slate-50/50'}`}
      style={brandStyle}
    >
      <div className="hidden lg:flex lg:flex-col">
        <Sidebar branding={{ logoUrl: normalizedSettings.store_logo_url, storeName: normalizedSettings.store_name }} recentOrders={recentOrders} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header branding={{ logoUrl: normalizedSettings.store_logo_url, storeName: normalizedSettings.store_name }} recentOrders={recentOrders} />

        <main className="flex-1 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
