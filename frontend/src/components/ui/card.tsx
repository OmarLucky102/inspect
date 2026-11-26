import * as React from 'react'
import { cn } from '@/lib/cn'

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'glass' | 'subtle' | 'solid' | 'interactive'
}

export function Card({
  className,
  variant = 'glass',
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'relative flex flex-col rounded-2xl text-ink transition-all duration-300',
        variant === 'glass' && 'glass-card',
        variant === 'interactive' && 'glass-card glass-card-hover',
        variant === 'subtle' && 'glass-subtle',
        variant === 'solid' && 'border border-hairline bg-white dark:bg-[#121826] shadow-xs',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'flex flex-col gap-1.5 px-5 pt-5 sm:px-6 sm:pt-6',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        'text-base font-semibold leading-tight tracking-tight text-ink',
        className,
      )}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-xs text-ink-mute leading-relaxed', className)}
      {...props}
    />
  )
}

export function CardAction({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-action"
      className={cn('flex items-center gap-2 self-start', className)}
      {...props}
    />
  )
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-5 py-4 sm:px-6', className)}
      {...props}
    />
  )
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center border-t border-hairline/70 px-5 py-3.5 sm:px-6',
        className,
      )}
      {...props}
    />
  )
}
