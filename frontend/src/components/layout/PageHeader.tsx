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
        'flex flex-col gap-4 rounded-2xl border border-hairline bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {(kicker || badges) && (
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {kicker && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                {KickerIcon && <KickerIcon className="size-3.5 shrink-0" aria-hidden />}
                {kicker}
              </span>
            )}
            {badges}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-mute">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

