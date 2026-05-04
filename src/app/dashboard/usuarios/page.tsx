import { TeamManagement } from '@/components/users/TeamManagement'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getStaffMembers } from '@/lib/staff'

export default async function UsersPage() {
  const { staff, summary, setupRequired, errorMessage } = await getStaffMembers()

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Usuarios"
        description="Cadastre funcionarios, distribua acessos e controle a equipe administrativa da loja."
      />

      {setupRequired ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Configuração necessária</h2>
          <p className="mt-2 text-sm text-amber-800">
            Execute o SQL de <code>supabase/staff.sql</code> no Supabase para habilitar a gestão de funcionários.
          </p>
        </section>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : (
        <TeamManagement
          initialStaff={staff}
          summary={summary}
        />
      )}
    </div>
  )
}
