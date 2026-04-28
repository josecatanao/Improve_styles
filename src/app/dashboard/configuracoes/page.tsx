import { ShieldCheck, Store, UserRound } from 'lucide-react'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'

const settingsCards = [
  {
    title: 'Fluxo da loja',
    description: 'Clientes entram, fazem cadastro e retornam para a vitrine, carrinho e checkout sem desvio para o admin.',
    icon: Store,
  },
  {
    title: 'Fluxo administrativo',
    description: 'Produtos, usuarios e configuracoes ficam isolados no dashboard, acessados apenas pelo menu do painel.',
    icon: ShieldCheck,
  },
  {
    title: 'Conta do cliente',
    description: 'A loja exibe nome e foto do perfil autenticado quando o cadastro do cliente estiver preenchido.',
    icon: UserRound,
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Configuracoes"
        description="Resumo operacional dos fluxos da loja e do painel administrativo."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {settingsCards.map((card) => {
          const Icon = card.icon

          return (
            <section key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
            </section>
          )
        })}
      </div>
    </div>
  )
}
