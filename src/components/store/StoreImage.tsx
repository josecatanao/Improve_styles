'use client'

import { useState } from 'react'

export function StoreImage({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackLabel,
}: {
  src: string | null | undefined
  alt: string
  className: string
  fallbackClassName: string
  fallbackLabel: string
}) {
  const [failedSrcs, setFailedSrcs] = useState<Record<string, true>>({})

  if (!src || failedSrcs[src]) {
    return <div className={fallbackClassName}>{fallbackLabel}</div>
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrcs((current) => ({ ...current, [src]: true }))}
    />
  )
}
