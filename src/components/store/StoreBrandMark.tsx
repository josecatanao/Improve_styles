import Link from 'next/link'

export function StoreBrandMark({
  href = '/',
  logoUrl,
  storeName,
  compact = false,
  tagline,
  className = '',
}: {
  href?: string
  logoUrl?: string | null
  storeName?: string | null
  compact?: boolean
  tagline?: string | null
  className?: string
}) {
  const resolvedStoreName = storeName?.trim() || 'Improve Styles'

  return (
    <Link href={href} className={`flex items-center gap-3 ${className}`.trim()}>
      {logoUrl ? (
        <span
          className={`flex shrink-0 items-center justify-start overflow-hidden ${
            compact ? 'h-9' : 'h-11'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={`Logo da loja ${resolvedStoreName}`}
            className={`block h-full w-auto object-contain object-left ${
              compact ? 'max-w-[40px]' : 'max-w-[56px]'
            }`}
          />
        </span>
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--store-header-fg)]/10 font-semibold text-[var(--store-header-fg)] ${
            compact ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base'
          }`}
        >
          {resolvedStoreName.slice(0, 1).toUpperCase()}
        </span>
      )}

      <span className="min-w-0">
        <span
          className={`block truncate font-bold tracking-tight ${
            compact ? 'text-[0.95rem] sm:text-lg' : 'text-base sm:text-xl'
          }`}
        >
          {resolvedStoreName}
        </span>
        {tagline ? (
          <span className="block truncate text-[11px] font-medium text-[var(--store-header-muted,#64748b)] sm:text-xs">
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
