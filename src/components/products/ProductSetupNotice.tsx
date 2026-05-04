import Link from 'next/link'

export function ProductSetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Configuração pendente
      </p>
      <h3 className="mt-2 text-lg font-semibold">A estrutura de produtos ainda não existe no banco.</h3>
      <p className="mt-2 max-w-2xl text-sm text-amber-900/80">
        Rode o script SQL da ETAPA 3 no Supabase para habilitar cadastro, listagem, imagens e as regras de segurança.
      </p>
      <div className="mt-4">
        <Link
          href="/dashboard/produtos"
          className="inline-flex items-center rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-950"
        >
          Ir para a central de produtos
        </Link>
      </div>
    </div>
  )
}
