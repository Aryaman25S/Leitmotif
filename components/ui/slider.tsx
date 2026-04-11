'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  min?: number
  max?: number
  step?: number
  value?: number[]
  onValueChange?: (value: number[]) => void
  className?: string
}

function Slider({
  min = 0,
  max = 100,
  step = 1,
  value = [50],
  onValueChange,
  className,
}: SliderProps) {
  const pct = ((value[0] - min) / (max - min)) * 100

  return (
    <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-secondary
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-0
          [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:ring-0 [&::-webkit-slider-thumb]:hover:ring-4 [&::-webkit-slider-thumb]:hover:ring-primary/20
          [&::-webkit-slider-thumb]:transition-shadow
          [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--color-primary) ${pct}%, var(--color-secondary) ${pct}%)`,
        }}
      />
    </div>
  )
}

export { Slider }
