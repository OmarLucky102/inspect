import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export const glassButtonVariants = cva(
  'glassPill group relative inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap select-none transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100 shadow-md text-slate-900 dark:text-white',
  {
    variants: {
      intent: {
        emerald:
          'text-slate-900 dark:text-emerald-100 hover:shadow-emerald-500/25',
        primary:
          'text-slate-900 dark:text-emerald-100 hover:shadow-emerald-500/25',
        amber:
          'text-slate-900 dark:text-amber-100 hover:shadow-amber-500/25',
        rose:
          'text-slate-900 dark:text-rose-100 hover:shadow-rose-500/25',
        neutral:
          'text-slate-900 dark:text-white hover:shadow-neutral-500/20',
      },
      size: {
        sm: 'h-8 px-3.5 py-1 text-xs gap-1.5',
        md: 'h-9.5 px-4 py-2 text-xs gap-2',
        lg: 'h-11 px-5 py-2.5 text-sm gap-2.5',
      },
    },
    defaultVariants: {
      intent: 'emerald',
      size: 'md',
    },
  },
);

export const glassIconBubbleVariants: Record<string, string> = {
  emerald: 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-sm',
  primary: 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-sm',
  amber: 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-sm',
  rose: 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-sm',
  neutral: 'bg-gradient-to-tr from-slate-600 to-slate-400 text-white shadow-sm',
};

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
  /** Optional icon to render inside the signature glowing bubble */
  icon?: React.ReactNode;
  /** Optional trailing icon */
  trailingIcon?: React.ReactNode;
  /** Whether to show the animated trailing chevron */
  showChevron?: boolean;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      intent = 'emerald',
      size = 'md',
      asChild = false,
      icon,
      trailingIcon,
      showChevron = false,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const activeIntent = intent || 'emerald';

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(glassButtonVariants({ intent, size, className }))}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const bubbleClass =
      glassIconBubbleVariants[activeIntent] || glassIconBubbleVariants.emerald;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(glassButtonVariants({ intent, size, className }))}
        {...props}
      >
        {icon && (
          <span
            className={cn(
              'flex size-5 items-center justify-center rounded-full shrink-0 transition-transform duration-300 group-hover:scale-110 [&_svg]:size-3',
              bubbleClass,
            )}
          >
            {icon}
          </span>
        )}

        <span className="relative z-10 font-bold tracking-tight text-slate-900 dark:text-inherit">
          {children}
        </span>

        {trailingIcon && (
          <span className="relative z-10 text-slate-800 dark:text-white/80 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 shrink-0 [&_svg]:size-3.5">
            {trailingIcon}
          </span>
        )}

        {showChevron && (
          <ChevronRight className="size-3.5 relative z-10 text-slate-600 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-emerald-400 transition-colors group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 shrink-0" />
        )}
      </button>
    );
  },
);

GlassButton.displayName = 'GlassButton';
