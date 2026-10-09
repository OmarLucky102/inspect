import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap transition-[transform,background-color,box-shadow] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bone disabled:pointer-events-none disabled:opacity-55 active:translate-y-px active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-white shadow-[0_12px_28px_-12px_rgba(14,107,78,0.65)] hover:bg-accent-deep',
        outline:
          'border border-hairline bg-white text-ink hover:border-ink/25 hover:bg-paper',
        ghost: 'text-ink-soft hover:bg-paper hover:text-ink',
      },
      size: {
        md: 'h-11 rounded-xl px-5 text-[15px]',
        sm: 'h-9 rounded-lg px-3.5 text-sm',
        lg: 'h-12 rounded-xl px-6 text-base',
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
