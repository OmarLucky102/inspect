import * as LabelPrimitive from '@radix-ui/react-label'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'mb-1.5 block text-[13px] font-medium tracking-wide text-ink-soft',
        className,
      )}
      {...props}
    />
  )
}
