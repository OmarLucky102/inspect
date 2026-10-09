import type { Icon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface ModuleEmptyStateProps {
  kicker: string
  title: string
  body: string
  icon: Icon
  actionLabel: string
}

/** Composed empty state for not-yet-wired modules (stage 2 target). */
export function ModuleEmptyState({
  kicker,
  title,
  body,
  icon: Icon,
  actionLabel,
}: ModuleEmptyStateProps) {
  return (
    <section>
      <p className="font-mono text-[11px] tracking-[0.24em] text-ink-mute">
        {kicker}
      </p>
      <h2 className="mt-3 max-w-[24ch] text-3xl font-semibold tracking-tighter text-balance sm:text-4xl">
        {title}
      </h2>
      <div className="mt-6 max-w-3xl rounded-3xl border border-hairline bg-white p-6 shadow-[0_20px_40px_-24px_rgba(20,23,26,0.25)] sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-bone text-ink">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-[15px] font-semibold">Nothing to show yet</p>
            <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
              {body}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
          <Button type="button" disabled title="Available in stage 2">
            {actionLabel}
          </Button>
          <span className="font-mono text-[11px] tracking-[0.14em] text-ink-mute">
            STAGE 02 · WIRES TO API
          </span>
        </div>
      </div>
    </section>
  )
}
