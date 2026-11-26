/**
 * Shared liquid-glass button styles consumed by both `Button` and `GlassButton`
 * so all buttons across the app share a single DRY optical glass foundation.
 */
export const GLASS_INTERACTIVE_BASE =
  'glassPill group relative inline-flex cursor-pointer items-center justify-center gap-2 font-semibold whitespace-nowrap select-none transition-[transform,box-shadow,background-color,border-color,filter] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bone disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02] active:translate-y-px active:scale-[0.98] [&_svg]:shrink-0'

export const GLASS_INTENT_VARIANTS = {
  emerald: 'text-slate-900 dark:text-emerald-100 hover:shadow-emerald-500/25',
  primary: 'text-slate-900 dark:text-emerald-100 hover:shadow-emerald-500/25',
  amber: 'text-slate-900 dark:text-amber-100 hover:shadow-amber-500/25',
  rose: 'text-slate-900 dark:text-rose-100 hover:shadow-rose-500/25',
  neutral: 'text-slate-900 dark:text-white hover:shadow-slate-500/20',
} as const

export type GlassIntent = keyof typeof GLASS_INTENT_VARIANTS
