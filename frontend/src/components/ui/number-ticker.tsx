import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

interface NumberTickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number
  startValue?: number
  durationMs?: number
  decimalPlaces?: number
  prefix?: string
  suffix?: string
}

function formatNumber(n: number, decimalPlaces: number, prefix: string, suffix: string) {
  const formatted = Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(n.toFixed(decimalPlaces)))
  return `${prefix}${formatted}${suffix}`
}

/**
 * Smooth requestAnimationFrame numeric counter writing directly to the DOM ref
 * to avoid React re-renders and respect prefers-reduced-motion.
 */
export function NumberTicker({
  value,
  startValue = 0,
  durationMs = 650,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
  className,
  ...props
}: NumberTickerProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const previousRef = useRef<number>(startValue)

  useEffect(() => {
    const el = spanRef.current
    if (!el) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || durationMs <= 0 || previousRef.current === value) {
      previousRef.current = value
      el.textContent = formatNumber(value, decimalPlaces, prefix, suffix)
      return
    }

    const from = previousRef.current
    const to = value
    let rafId = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - progress, 4)
      const current = from + (to - from) * eased

      if (spanRef.current) {
        spanRef.current.textContent = formatNumber(
          current,
          decimalPlaces,
          prefix,
          suffix,
        )
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        previousRef.current = to
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [value, durationMs, decimalPlaces, prefix, suffix])

  return (
    <span
      ref={spanRef}
      className={cn('inline-block tabular-nums', className)}
      {...props}
    >
      {formatNumber(value, decimalPlaces, prefix, suffix)}
    </span>
  )
}
