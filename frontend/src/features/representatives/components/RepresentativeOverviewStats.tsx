import {
  IdentificationBadge,
  CheckCircle,
  XCircle,
  MapPin,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { fetchRepresentativeOverview } from '../api';

export function RepresentativeOverviewStats() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['representatives', 'overview'],
    queryFn: fetchRepresentativeOverview,
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      <Card variant="interactive" className="overflow-hidden p-4">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase">
            {t('representatives.statsTotal', 'Total Agents')}
          </span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-ink/[0.06] dark:bg-white/[0.08] text-ink-mute">
            <IdentificationBadge className="size-4" />
          </span>
        </div>
        <p className="text-2xl font-extrabold text-ink tracking-tight">
          {isLoading ? '—' : <NumberTicker value={stats?.total ?? 0} />}
        </p>
        <span className="text-[11px] text-ink-mute mt-1 block">
          {t('representatives.statsTotalDesc', 'Registered representatives')}
        </span>
      </Card>

      <Card variant="interactive" className="overflow-hidden p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 -end-8 size-20 rounded-full bg-emerald-500/12 blur-xl"
        />
        <div className="relative flex items-center justify-between text-ink-mute mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
            {t('representatives.statsActive', 'Active In Field')}
          </span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-4" weight="duotone" />
          </span>
        </div>
        <p className="relative text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight">
          {isLoading ? '—' : <NumberTicker value={stats?.active ?? 0} />}
        </p>
        <span className="relative text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block font-medium">
          {t('representatives.statsActiveDesc', 'Ready for assignment')}
        </span>
      </Card>

      <Card variant="interactive" className="overflow-hidden p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 -end-8 size-20 rounded-full bg-amber-500/12 blur-xl"
        />
        <div className="relative flex items-center justify-between text-ink-mute mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-amber-700 dark:text-amber-400">
            {t('representatives.statsInactive', 'Inactive')}
          </span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
            <XCircle className="size-4" weight="duotone" />
          </span>
        </div>
        <p className="relative text-2xl font-extrabold text-ink tracking-tight">
          {isLoading ? '—' : <NumberTicker value={stats?.inactive ?? 0} />}
        </p>
        <span className="relative text-[11px] text-ink-mute mt-1 block">
          {t('representatives.statsInactiveDesc', 'Paused or on-leave')}
        </span>
      </Card>

      <Card variant="interactive" className="overflow-hidden p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 -end-8 size-20 rounded-full bg-sky-500/12 blur-xl"
        />
        <div className="relative flex items-center justify-between text-ink-mute mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-sky-700 dark:text-sky-400">
            {t('representatives.statsBranches', 'Branches')}
          </span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
            <MapPin className="size-4" weight="duotone" />
          </span>
        </div>
        <p className="relative text-2xl font-extrabold text-ink tracking-tight">
          {isLoading ? '—' : <NumberTicker value={stats?.locationsCount ?? 0} />}
        </p>
        <span className="relative text-[11px] text-ink-mute mt-1 block">
          {t('representatives.statsBranchesDesc', 'Active zones & branches')}
        </span>
      </Card>
    </div>
  );
}
