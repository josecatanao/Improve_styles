import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PermissionsProvider } from '@/components/permissions-provider'
import { getRecentOrderSignals } from '@/lib/orders'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { buildStoreBrandStyle, normalizeStoreSettings } from '@/lib/store-settings'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getRoleLabel, permissionOptions, type StaffPermission } from '@/lib/staff-shared'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicStoreSettings()
  const normalized = normalizeStoreSettings(settings)
  const logoUrl = normalized.store_logo_url?.trim() || null

  return {
    title: {
      default: `${normalized.store_name} — Dashboard`,
      template: `%s | ${normalized.store_name}`,
    },
    icons: logoUrl ? { icon: logoUrl, shortcut: logoUrl, apple: logoUrl } : undefined,
  }
}

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

  const accountType = user.user_metadata?.account_type

  if (accountType !== 'admin' && accountType !== 'staff') {
    const { data: staffData } = await supabase
      .from('staff_members')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!staffData) {
      redirect('/')
    }
  }

  let userPermissions: StaffPermission[] = []
  let userDisplayName = user.user_metadata?.full_name ?? user.email ?? ''
  let userRoleLabel: string | null = null

  if (accountType === 'admin') {
    userPermissions = permissionOptions.map((p) => p.key)
    userRoleLabel = 'Administrador'
  } else {
    const { data: staffData } = await supabase
      .from('staff_members')
      .select('permissions, full_name, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    userPermissions = (staffData?.permissions as StaffPermission[]) ?? []
    userDisplayName = staffData?.full_name || userDisplayName
    if (staffData?.role) {
      userRoleLabel = getRoleLabel(staffData.role)
    }
  }

  const userIdentity = {
    displayName: userDisplayName,
    roleLabel: userRoleLabel,
    email: user.email,
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
        <Sidebar
          permissions={userPermissions}
          branding={{ logoUrl: normalizedSettings.store_logo_url, storeName: normalizedSettings.store_name }}
          recentOrders={recentOrders}
          userDisplayName={userIdentity.displayName}
          userRoleLabel={userIdentity.roleLabel ?? undefined}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          branding={{ logoUrl: normalizedSettings.store_logo_url, storeName: normalizedSettings.store_name }}
          recentOrders={recentOrders}
          userDisplayName={userIdentity.displayName}
          userRoleLabel={userIdentity.roleLabel ?? undefined}
        />

        <main className="flex-1 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            <PermissionsProvider permissions={userPermissions}>
              <Breadcrumb />
              {children}
            </PermissionsProvider>
          </div>
        </main>
      </div>
    </div>
  )
}
