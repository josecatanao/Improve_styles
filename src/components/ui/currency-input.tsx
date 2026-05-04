'use client'

import { useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { formatCurrencyForInput, parseCurrencyFromInput } from '@/lib/currency-mask'
import { cn } from '@/lib/utils'

type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'value' | 'onChange' | 'inputMode'
> & {
  value: string
  onChange: (rawValue: string) => void
}

export function CurrencyInput({
  value,
  onChange,
  className,
  ...props
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = formatCurrencyForInput(value)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseCurrencyFromInput(e.target.value)
      onChange(raw)
    },
    [onChange]
  )

  return (
    <Input
      {...props}
      ref={inputRef}
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={cn('font-variant-numeric tabular-nums', className)}
    />
  )
}
