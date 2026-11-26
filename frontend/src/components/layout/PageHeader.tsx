import type { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  kicker?: string;
  kickerIcon?: Icon;
  badges?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Unified top header card for all admin console routes.
 * Keeps title scale, spacing, and action alignment identical across sidebar tabs.
 */
export function PageHeader({
  kicker,
  kickerIcon: KickerIcon,
  badges,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'glass-card relative overflow-hidden flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 end-8 size-36 rounded-full bg-accent/10 blur-2xl"
      />
      <div className="relative min-w-0">
        {(kicker || badges) && (
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {kicker && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                {KickerIcon && <KickerIcon className="size-3.5 shrink-0" aria-hidden />}
                {kicker}
              </span>
            )}
            {badges}
          </div>
        )}
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-mute leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="relative flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

