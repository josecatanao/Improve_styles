import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { AuthPanel } from '@/components/auth/AuthPanel'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error
  const message = resolvedParams?.message
  const next = typeof resolvedParams?.next === 'string' ? resolvedParams.next : '/dashboard'

  return (
    <AuthPageShell isStoreContext={false}>
        <AuthPanel
          allowSignup={false}
          error={error}
          initialView="login"
          isStoreContext={false}
          message={message}
          next={next}
        />
    </AuthPageShell>
  )
}
