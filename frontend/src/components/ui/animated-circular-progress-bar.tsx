import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface AnimatedCircularProgressBarProps {
  max?: number
  min?: number
  value?: number
  gaugePrimaryColor?: string
  gaugeSecondaryColor?: string
  strokeWidth?: number
  className?: string
  label?: ReactNode
  sublabel?: ReactNode
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor = 'var(--theme-accent)',
  gaugeSecondaryColor = 'var(--glass-track)',
  strokeWidth = 9,
  className,
  label,
  sublabel,
}: AnimatedCircularProgressBarProps) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const range = Math.max(1, max - min)
  const clamped = Math.max(0, Math.min(100, ((value - min) / range) * 100))
  const currentPercent = Math.round(clamped)
  const dashOffset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex size-36 items-center justify-center', className)}
      style={{ transform: 'translateZ(0)' } as CSSProperties}
    >
      <svg
        fill="none"
        className="size-full -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={gaugeSecondaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={gaugePrimaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-2xl font-bold tracking-tight text-ink tabular-nums">
          {label ?? `${currentPercent}%`}
        </span>
        {sublabel && (
          <span className="mt-0.5 text-[10px] font-medium text-ink-mute">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
