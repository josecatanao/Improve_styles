import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { AuthPanel } from '@/components/auth/AuthPanel'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error
  const message = resolvedParams?.message
  const mode = typeof resolvedParams?.mode === 'string' ? resolvedParams.mode : null
  const defaultNext = mode === 'customer' ? '/' : '/dashboard'
  const next = typeof resolvedParams?.next === 'string' ? resolvedParams.next : defaultNext
  const authView = resolvedParams?.view === 'signup' ? 'signup' : 'login'
  const isStoreContext = mode === 'customer'

  return (
    <AuthPageShell isStoreContext={isStoreContext}>
        <AuthPanel
          error={error}
          initialView={authView}
          isStoreContext={isStoreContext}
          message={message}
          next={next}
        />
    </AuthPageShell>
  )
}
