import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { UpdatePasswordForm } from './UpdatePasswordForm'

export const metadata = { title: 'Atualizar Senha' }

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error
  const message = resolvedParams?.message

  return (
    <AuthPageShell isStoreContext title="Atualizar Senha" subtitle="Defina sua nova senha de acesso.">
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
          {typeof message === 'string' ? message : 'Ocorreu um erro ao atualizar a senha.'}
        </div>
      ) : null}
      <UpdatePasswordForm />
    </AuthPageShell>
  )
}
