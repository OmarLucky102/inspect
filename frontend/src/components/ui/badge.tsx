import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase transition-colors whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'border-hairline bg-paper/70 text-ink-soft backdrop-blur-xs',
        accent:
          'border-accent/25 bg-accent/10 text-accent',
        emerald:
          'border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        sky:
          'border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300',
        amber:
          'border-amber-500/30 bg-amber-500/12 text-amber-800 dark:text-amber-300',
        rose:
          'border-rose-500/25 bg-rose-500/12 text-rose-700 dark:text-rose-300',
        indigo:
          'border-indigo-500/25 bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
        purple:
          'border-purple-500/25 bg-purple-500/12 text-purple-700 dark:text-purple-300',
        cyan:
          'border-cyan-500/25 bg-cyan-500/12 text-cyan-700 dark:text-cyan-300',
        neutral:
          'border-zinc-400/25 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  pulse?: boolean
}

export function Badge({
  className,
  variant,
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex size-1.5 shrink-0" aria-hidden>
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          )}
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  )
}
