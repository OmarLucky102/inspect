import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowsClockwise,
  Buildings,
  Plus,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { BankSelect } from '@/components/ui/bank-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WorkspaceRequiredView } from '@/components/errors/WorkspaceRequiredView';
import { ErrorView } from '@/components/errors/ErrorView';
import { parseApiError } from '@/lib/errors/app-error';
import {
  fetchInspectionAnalytics,
  type InspectionAnalyticsData,
} from '@/features/inspection-requests/api';
import { KpiTelemetryGrid } from '@/features/dashboard/components/KpiTelemetryGrid';
import { OperationalPipelineFlow } from '@/features/dashboard/components/OperationalPipelineFlow';
import { VolumeTrendChart } from '@/features/dashboard/components/VolumeTrendChart';
import { StatusBreakdownChart } from '@/features/dashboard/components/StatusBreakdownChart';
import { CategoryDistributionChart } from '@/features/dashboard/components/CategoryDistributionChart';
import { QualityAndPriorityCard } from '@/features/dashboard/components/QualityAndPriorityCard';
import { RecentRequestsTable } from '@/features/dashboard/components/RecentRequestsTable';
import { cn } from '@/lib/cn';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const navigate = useNavigate();
  const { user, banks, activeBankId, setActiveBankId } = useWorkspace();

  const periodOptions = useMemo(
    () => [
      { label: t('dashboard.days7', '7 Days'), value: 7 },
      { label: t('dashboard.days30', '30 Days'), value: 30 },
      { label: t('dashboard.days90', '90 Days'), value: 90 },
    ],
    [t],
  );

  const [periodDays, setPeriodDays] = useState<number>(30);

  const isGlobalStaff =
    user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';

  const canCreateRequest =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'MANAGER';

  const [selectedBankScope, setSelectedBankScope] = useState<string>(
    isGlobalStaff ? 'all' : activeBankId || '',
  );

  const queryBankId = isGlobalStaff
    ? selectedBankScope === 'all'
      ? undefined
      : selectedBankScope
    : activeBankId || undefined;

  const {
    data: analytics,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery<InspectionAnalyticsData>({
    queryKey: ['inspection-analytics', queryBankId, periodDays],
    queryFn: () =>
      fetchInspectionAnalytics({
        bankId: queryBankId,
        periodDays,
      }),
    enabled: isGlobalStaff || !!activeBankId,
    refetchInterval: 30000,
  });

  const activeBankObj = useMemo(() => {
    if (queryBankId) {
      return banks.find((b) => b.id === queryBankId);
    }
    return null;
  }, [banks, queryBankId]);

  if (!isGlobalStaff && (!activeBankId || banks.length === 0)) {
    return (
      <div className="py-8">
        <WorkspaceRequiredView
          featureName="inspection analytics and dashboard"
          featureNameAr="لوحة القيادة ومؤشرات الأداء"
        />
      </div>
    );
  }

  if (isError) {
    const parsed = error ? parseApiError(error) : null;
    const isWorkspaceMembershipError =
      !isGlobalStaff &&
      parsed?.status === 403 &&
      (banks.length === 0 ||
        parsed.message.toLowerCase().includes('membership') ||
        parsed.message.toLowerCase().includes('assigned to any bank'));

    if (isWorkspaceMembershipError) {
      return (
        <div className="py-8">
          <WorkspaceRequiredView
            featureName="inspection analytics and dashboard"
            featureNameAr="لوحة القيادة ومؤشرات الأداء"
          />
        </div>
      );
    }

    return (
      <div className="py-8">
        <ErrorView error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-0 duration-300">
      {/* Top Glass Command Banner & Telemetry Controls */}
      <Card variant="glass" className="overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 end-10 size-48 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" dot pulse>
                <ShieldCheck className="size-3.5" />
                {t('dashboard.analyticsTag', 'EuroInspect 360 · Analytics')}
              </Badge>

              {analytics?.scope.isGlobal ? (
                <Badge variant="purple">
                  <Buildings className="size-3" />
                  {t(
                    'dashboard.allPartnerBanks',
                    'All Partner Banks (Global Overview)',
                  )}
                </Badge>
              ) : (
                <Badge variant="sky">
                  <Buildings className="size-3" />
                  {analytics?.scope.bankName ||
                    activeBankObj?.name ||
                    t('dashboard.selectedBank', 'Selected Bank')}
                </Badge>
              )}
            </div>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {t('dashboard.title', 'Inspection Operations Dashboard')}
            </h2>
            <p className="mt-0.5 text-xs text-ink-mute leading-relaxed">
              {t(
                'dashboard.subtitle',
                'Live business intelligence, operational workflow velocity, and market valuation metrics.',
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            {isGlobalStaff && banks.length > 0 && (
              <BankSelect
                banks={banks}
                value={selectedBankScope}
                onChange={(val) => {
                  setSelectedBankScope(val);
                  if (val !== 'all') {
                    setActiveBankId(val);
                  }
                }}
                includeAllOption
                variant="subtle"
                size="sm"
                align="end"
                headerTitle={t(
                  'dashboard.filterBankScope',
                  'Filter by bank scope',
                )}
                ariaLabel={t(
                  'dashboard.filterBankScope',
                  'Filter by bank scope',
                )}
                triggerClassName="w-full sm:w-auto max-w-full sm:max-w-[260px]"
              />
            )}

            {/* Period Selector Pills */}
            <div
              role="group"
              aria-label={t('dashboard.periodFilter', 'Time period')}
              className="glass-subtle flex flex-wrap items-center rounded-xl p-1 text-xs"
            >
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriodDays(opt.value)}
                  aria-pressed={periodDays === opt.value}
                  className={cn(
                    'cursor-pointer rounded-lg px-2.5 py-1 font-medium transition-all',
                    periodDays === opt.value
                      ? 'bg-white dark:bg-white/15 font-semibold text-ink shadow-2xs'
                      : 'text-ink-mute hover:text-ink',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="glass-subtle inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-ink-mute transition-all hover:text-ink disabled:opacity-60"
              title={t('dashboard.refreshAnalytics', 'Refresh analytics data')}
              aria-label={t(
                'dashboard.refreshAnalytics',
                'Refresh analytics data',
              )}
            >
              <ArrowsClockwise
                className={`size-4 ${isRefetching ? 'animate-spin text-accent' : ''}`}
              />
            </button>

            {/* Create Request CTA */}
            {canCreateRequest && (
              <Button
                type="button"
                size="sm"
                onClick={() => navigate('/requests/new')}
                className="text-xs font-semibold"
              >
                <Plus className="size-3.5" weight="bold" />
                <span>{t('dashboard.newRequest', 'New Request')}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Top Bento KPI Telemetry Cards */}
      <KpiTelemetryGrid
        analytics={analytics}
        isLoading={isLoading}
        isArabic={Boolean(isArabic)}
      />

      {/* Interactive 5-Stage Operational Pipeline Flow */}
      <OperationalPipelineFlow
        overview={analytics?.overview}
        isLoading={isLoading}
      />

      {/* Primary Charts Row: Volume Trend + Status Donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <VolumeTrendChart
          volumeTrend={analytics?.volumeTrend}
          isLoading={isLoading}
          isArabic={Boolean(isArabic)}
        />
        <StatusBreakdownChart
          statusBreakdown={analytics?.statusBreakdown}
          isLoading={isLoading}
        />
      </div>

      {/* Secondary Charts Row: Vehicle Category Distribution + Audit Quality & Priority */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CategoryDistributionChart
          categoryDistribution={analytics?.categoryDistribution}
          isLoading={isLoading}
          isArabic={Boolean(isArabic)}
        />
        <QualityAndPriorityCard
          checklistPerformance={analytics?.checklistPerformance}
          priorityDistribution={analytics?.priorityDistribution}
          isLoading={isLoading}
        />
      </div>

      {/* Real-time Operations Feed */}
      <RecentRequestsTable
        recentRequests={analytics?.recentRequests}
        isGlobal={Boolean(analytics?.scope.isGlobal)}
        isLoading={isLoading}
        isArabic={Boolean(isArabic)}
        queryBankId={queryBankId}
        activeBankId={activeBankId}
      />
    </div>
  );
}
