export function HomeLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-4 sm:px-6 sm:py-5 lg:space-y-8 lg:px-8">
      <div className="h-52 w-full animate-pulse rounded-2xl bg-slate-200/80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="h-44 w-full animate-pulse rounded-xl bg-slate-200/80" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200/80" />
            <div className="h-5 w-4/5 animate-pulse rounded-lg bg-slate-200/80" />
            <div className="h-4 w-full animate-pulse rounded-lg bg-slate-200/80" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200/80" />
          </div>
        ))}
      </div>
    </main>
  )
}
