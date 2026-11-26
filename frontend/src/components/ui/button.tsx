import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { GLASS_INTENT_VARIANTS, GLASS_INTERACTIVE_BASE } from './button-styles'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap transition-[transform,background-color,box-shadow,border-color,filter] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none select-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bone disabled:pointer-events-none disabled:opacity-55 active:translate-y-px active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: `${GLASS_INTERACTIVE_BASE} glassPill-primary hover:shadow-emerald-500/30`,
        outline: `${GLASS_INTERACTIVE_BASE} ${GLASS_INTENT_VARIANTS.neutral} shadow-sm`,
        ghost:
          'rounded-full text-ink-soft hover:glass-subtle hover:text-ink',
        glass: `${GLASS_INTERACTIVE_BASE} ${GLASS_INTENT_VARIANTS.neutral} shadow-md`,
        'glass-emerald': `${GLASS_INTERACTIVE_BASE} glassPill-primary hover:shadow-emerald-500/30`,
        'glass-rose': `${GLASS_INTERACTIVE_BASE} glassPill-rose hover:shadow-rose-500/30`,
        'glass-amber': `${GLASS_INTERACTIVE_BASE} glassPill-amber hover:shadow-amber-500/30`,
      },
      size: {
        md: 'h-10 rounded-full px-5 text-sm',
        sm: 'h-9 rounded-full px-4 text-xs',
        lg: 'h-11 rounded-full px-6 text-[15px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { buttonVariants }
