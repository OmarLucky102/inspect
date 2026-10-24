import {
  IdentificationBadge,
  CheckCircle,
  XCircle,
  MapPin,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchRepresentativeOverview } from '../api';

export function RepresentativeOverviewStats() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['representatives', 'overview'],
    queryFn: fetchRepresentativeOverview,
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs hover:border-ink/20 transition-all">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase">{t('representatives.statsTotal', 'Total Agents')}</span>
          <IdentificationBadge className="size-4 text-ink-mute" />
        </div>
        <p className="text-2xl font-bold text-ink tracking-tight">
          {isLoading ? '—' : stats?.total ?? 0}
        </p>
        <span className="text-[11px] text-ink-mute mt-0.5 block">
          {t('representatives.statsTotalDesc', 'Registered representatives')}
        </span>
      </div>

      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs hover:border-emerald-200 transition-all">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase text-emerald-700">{t('representatives.statsActive', 'Active In Field')}</span>
          <CheckCircle className="size-4 text-emerald-600" />
        </div>
        <p className="text-2xl font-bold text-emerald-950 tracking-tight">
          {isLoading ? '—' : stats?.active ?? 0}
        </p>
        <span className="text-[11px] text-emerald-700/80 mt-0.5 block font-medium">
          {t('representatives.statsActiveDesc', 'Ready for assignment')}
        </span>
      </div>

      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs hover:border-amber-200 transition-all">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase text-amber-700">{t('representatives.statsInactive', 'Inactive')}</span>
          <XCircle className="size-4 text-amber-600" />
        </div>
        <p className="text-2xl font-bold text-ink tracking-tight">
          {isLoading ? '—' : stats?.inactive ?? 0}
        </p>
        <span className="text-[11px] text-ink-mute mt-0.5 block">
          {t('representatives.statsInactiveDesc', 'Paused or on-leave')}
        </span>
      </div>

      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs hover:border-sky-200 transition-all">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase text-sky-700">{t('representatives.statsBranches', 'Branches')}</span>
          <MapPin className="size-4 text-sky-600" />
        </div>
        <p className="text-2xl font-bold text-ink tracking-tight">
          {isLoading ? '—' : stats?.locationsCount ?? 0}
        </p>
        <span className="text-[11px] text-ink-mute mt-0.5 block">
          {t('representatives.statsBranchesDesc', 'Active zones & branches')}
        </span>
      </div>
    </div>
  );
}
