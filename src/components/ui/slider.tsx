'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

function Slider({
  className,
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  ...props
}: {
  className?: string
  min?: number
  max?: number
  step?: number
  value: number
  onValueChange: (value: number) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max' | 'step'>) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="absolute h-full rounded-full bg-slate-900 transition-all dark:bg-slate-100"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(15,23,42,0.3)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110 dark:[&::-webkit-slider-thumb]:bg-slate-100"
        {...props}
      />
    </div>
  )
}

export { Slider }
