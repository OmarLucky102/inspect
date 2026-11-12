import type { Icon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface ModuleEmptyStateProps {
  kicker: string
  title: string
  body: string
  icon: Icon
  actionLabel?: string
  onAction?: () => void
}

/** Composed empty state for not-yet-wired modules (stage 2 target). */
export function ModuleEmptyState({
  kicker,
  title,
  body,
  icon: Icon,
  actionLabel,
  onAction,
}: ModuleEmptyStateProps) {
  return (
    <section className="mx-auto max-w-2xl py-8">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-[0.24em] text-ink-mute uppercase">
          {kicker}
        </p>
        <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-balance text-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      <div className="mt-6 rounded-2xl border border-hairline bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-bone text-ink">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">Nothing to show yet</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {body}
            </p>
          </div>
        </div>
        {actionLabel && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-hairline pt-5 sm:justify-start">
            <Button
              type="button"
              disabled={!onAction}
              onClick={onAction}
              title={!onAction ? 'Available in stage 2' : undefined}
            >
              {actionLabel}
            </Button>
            {!onAction && (
              <span className="font-mono text-[11px] tracking-[0.14em] text-ink-mute">
                STAGE 02 · WIRES TO API
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
