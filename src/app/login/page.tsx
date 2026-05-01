import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { AuthPanel } from '@/components/auth/AuthPanel'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { buildStorefrontThemeStyle } from '@/lib/store-settings'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [resolvedParams, settings] = await Promise.all([
    searchParams,
    getPublicStoreSettings(),
  ])

  const error = resolvedParams?.error
  const success = resolvedParams?.success
  const message = resolvedParams?.message
  const mode = typeof resolvedParams?.mode === 'string' ? resolvedParams.mode : null
  const defaultNext = mode === 'customer' ? '/' : '/dashboard'
  const next = typeof resolvedParams?.next === 'string' ? resolvedParams.next : defaultNext
  const authView = resolvedParams?.view === 'signup' ? 'signup' : 'login'
  const isStoreContext = mode === 'customer'

  const branding = {
    logoUrl: settings.store_logo_url,
    storeName: settings.store_name,
  }

  const brandStyle = buildStorefrontThemeStyle(settings)

  return (
    <AuthPageShell isStoreContext={isStoreContext} branding={branding} brandStyle={brandStyle}>
        <AuthPanel
          error={error}
          initialView={authView}
          isStoreContext={isStoreContext}
          message={message}
          next={next}
          success={success}
          brandStyle={brandStyle}
        />
    </AuthPageShell>
  )
}
