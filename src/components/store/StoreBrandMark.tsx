import Link from 'next/link'
import Image from 'next/image'

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
    <Link href={href} className={`flex items-center gap-2 ${className}`.trim()}>
      {logoUrl ? (
        <span
          className={`relative flex shrink-0 items-center justify-start overflow-hidden ${
            compact ? 'h-11 w-11' : 'h-14 w-14'
          }`}
        >
          <Image
            src={logoUrl}
            alt={`Logo da loja ${resolvedStoreName}`}
            fill
            className="object-contain object-left"
            sizes={compact ? '44px' : '56px'}
          />
        </span>
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--store-header-fg)]/10 font-semibold text-[var(--store-header-fg)] ${
            compact ? 'h-11 w-11 text-base' : 'h-14 w-14 text-lg'
          }`}
        >
          {resolvedStoreName.slice(0, 1).toUpperCase()}
        </span>
      )}

      <span className="min-w-0">
        <span
          className={`block truncate font-bold tracking-tight ${
            compact ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'
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
