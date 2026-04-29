import { Logo } from '@/components/ui/Logo'

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />
}

function Spinner() {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
    </span>
  )
}

export function AppLoadingScreen({
  title = 'Carregando a aplicacao',
  description = 'Estamos preparando os dados desta tela para voce.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
        <div className="flex flex-col items-center">
          <Logo className="h-20 w-20 rounded-[1.75rem]" />
          <div className="mt-5">
            <Spinner />
          </div>
          <div className="mt-5 space-y-2">
            <p className="text-lg font-semibold tracking-tight text-slate-950">{title}</p>
            <p className="mx-auto max-w-xs text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  )
}

export function DashboardLoadingShell() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50/60">
      <aside className="hidden w-[292px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <Logo className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
        </div>
        <div className="space-y-3 px-4 py-5">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </aside>

      <main className="flex-1 p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <Logo className="h-16 w-16 rounded-[1.5rem]" />
              <div className="mt-4">
                <Spinner />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-lg font-semibold tracking-tight text-slate-950">Carregando o painel</p>
                <p className="text-sm text-slate-500">Estamos organizando os dados e montando os indicadores desta area.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-8 w-16" />
                <Skeleton className="mt-3 h-4 w-full" />
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72 max-w-full" />
              <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function StorefrontLoadingShell({
  title = 'Carregando a vitrine',
  description = 'Estamos separando os produtos e organizando a pagina para voce.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12 rounded-[1.25rem]" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="hidden h-11 w-[380px] lg:block" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <Logo className="h-16 w-16 rounded-[1.5rem]" />
            <div className="mt-4">
              <Spinner />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-lg font-semibold tracking-tight text-slate-950">{title}</p>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
        </div>

        <Skeleton className="h-52 w-full rounded-[2rem]" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="mt-4 h-4 w-20" />
              <Skeleton className="mt-3 h-5 w-4/5" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-4 h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
