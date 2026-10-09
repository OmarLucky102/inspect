import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

/**
 * Text input primitive (package-composed, not from scratch):
 * accessible focus ring, error state via aria-invalid, mono-safe sizing.
 */
export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'h-11 w-full rounded-xl border border-hairline bg-white px-3.5 text-[15px] text-ink shadow-[inset_0_1px_2px_rgba(20,23,26,0.05)] transition-colors outline-none placeholder:text-ink-mute/70 hover:border-ink/20 focus:border-accent focus:ring-2 focus:ring-accent/25 aria-invalid:border-red-600/60 aria-invalid:focus:border-red-600 aria-invalid:focus:ring-red-600/15 disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
