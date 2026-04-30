export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="animate-pulse mb-4 h-4 w-24 rounded-lg bg-slate-200/80" />
            <div className="animate-pulse mb-2 h-8 w-16 rounded-lg bg-slate-200/80" />
            <div className="animate-pulse h-4 w-full rounded-lg bg-slate-200/80" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="animate-pulse bg-slate-50 px-6 py-5">
          <div className="h-6 w-48 rounded-lg bg-slate-200/80" />
          <div className="mt-2 h-4 w-72 rounded-lg bg-slate-200/80" />
        </div>
        <div className="animate-pulse bg-slate-50 h-10" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse border-t border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200/80" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-lg bg-slate-200/80" />
                <div className="h-3 w-56 rounded-lg bg-slate-200/80" />
              </div>
              <div className="h-4 w-20 rounded-lg bg-slate-200/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
