import * as React from 'react'
import { cn } from '@/lib/cn'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-xl bg-ink/[0.07] dark:bg-white/[0.08]',
        className,
      )}
      {...props}
    />
  )
}
