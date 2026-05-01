import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { UpdatePasswordForm } from './UpdatePasswordForm'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { buildStorefrontThemeStyle } from '@/lib/store-settings'

export const metadata = { title: 'Atualizar Senha' }

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [resolvedParams, settings] = await Promise.all([
    searchParams,
    getPublicStoreSettings(),
  ])

  const error = resolvedParams?.error
  const message = resolvedParams?.message

  const branding = {
    logoUrl: settings.store_logo_url,
    storeName: settings.store_name,
  }

  const brandStyle = buildStorefrontThemeStyle(settings)

  return (
    <AuthPageShell
      isStoreContext
      title="Atualizar Senha"
      subtitle="Defina sua nova senha de acesso."
      branding={branding}
      brandStyle={brandStyle}
    >
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
          {typeof message === 'string' ? message : 'Ocorreu um erro ao atualizar a senha.'}
        </div>
      ) : null}
      <UpdatePasswordForm />
    </AuthPageShell>
  )
}
