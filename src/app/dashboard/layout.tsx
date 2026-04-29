import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
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

  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('store_logo_url, brand_primary_color, brand_secondary_color, dashboard_theme')
    .limit(1)
    .maybeSingle()

  const settings = normalizeStoreSettings(storeSettings)
  const brandStyle = buildStoreBrandStyle(settings)

  return (
    <div
      className={`flex h-screen w-full ${settings.dashboard_theme === 'dark' ? 'dashboard-theme-dark bg-slate-950' : 'bg-slate-50/50'}`}
      style={brandStyle}
    >
      <div className="hidden lg:flex lg:flex-col">
        <Sidebar branding={{ logoUrl: settings.store_logo_url }} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header branding={{ logoUrl: settings.store_logo_url }} />

        <main className="flex-1 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
