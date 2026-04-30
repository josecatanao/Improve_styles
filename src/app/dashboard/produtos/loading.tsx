export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="animate-pulse rounded-xl bg-slate-200/80 h-8 w-48" />
        <div className="animate-pulse rounded-xl bg-slate-200/80 h-10 w-36" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="animate-pulse bg-slate-50 h-10" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse border-t border-slate-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-200/80" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded-lg bg-slate-200/80" />
                <div className="h-3 w-72 rounded-lg bg-slate-200/80" />
              </div>
              <div className="h-9 w-28 rounded-lg bg-slate-200/80" />
              <div className="h-9 w-28 rounded-lg bg-slate-200/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
