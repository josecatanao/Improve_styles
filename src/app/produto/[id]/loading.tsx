export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200/80" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200/80" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-4 w-12 animate-pulse rounded bg-slate-200/80" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-200/80" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200/80" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-slate-200/80" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 w-20 animate-pulse rounded-xl bg-slate-200/80" />
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200/80" />
            <div className="space-y-2">
              <div className="h-7 w-3/4 animate-pulse rounded-lg bg-slate-200/80" />
              <div className="h-5 w-1/2 animate-pulse rounded-lg bg-slate-200/80" />
            </div>
            <div className="space-y-2">
              <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200/80" />
              <div className="h-5 w-24 animate-pulse rounded-lg bg-slate-200/80" />
            </div>
            <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200/80" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-slate-200/80" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200/80" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/80" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
