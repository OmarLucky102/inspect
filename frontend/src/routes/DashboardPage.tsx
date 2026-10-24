import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Car,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  TrendUp,
  ChartPie,
  ChartBar,
  ChartLineUp,
  ShieldCheck,
  ArrowsClockwise,
  Buildings,
  ArrowRight,
  Plus,
  CheckSquare,
  Funnel,
  Eye,
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import {
  fetchInspectionAnalytics,
  type InspectionAnalyticsData,
} from '@/features/inspection-requests/api';

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

  // Period filter (7, 30, 90 days)
  const [periodDays, setPeriodDays] = useState<number>(30);

  // Selected bank for Super Admin / Reviewer filter ('all' or specific bank id)
  const isGlobalStaff =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'REVIEWER';

  const canCreateRequest =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'MANAGER';

  const [selectedBankScope, setSelectedBankScope] = useState<string>(
    isGlobalStaff ? 'all' : activeBankId || '',
  );

  // Determine query bankId parameter
  const queryBankId = isGlobalStaff
    ? selectedBankScope === 'all'
      ? undefined
      : selectedBankScope
    : activeBankId || undefined;

  // Fetch analytics query
  const {
    data: analytics,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<InspectionAnalyticsData>({
    queryKey: ['inspection-analytics', queryBankId, periodDays],
    queryFn: () =>
      fetchInspectionAnalytics({
        bankId: queryBankId,
        periodDays,
      }),
    refetchInterval: 30000, // automatic 30s live poll
  });

  // Format currency helper - standardizing to consistent Latin numerals
  const formatCurrency = (val: number | undefined) => {
    if (!val) return isArabic ? '0 ج.م' : '0 EGP';
    return `${val.toLocaleString('en-US')} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  // Active bank name for display
  const activeBankObj = useMemo(() => {
    if (queryBankId) {
      return banks.find((b) => b.id === queryBankId);
    }
    return null;
  }, [banks, queryBankId]);

  // Localized date trend for area chart (Arabic month with Latin numerals)
  const formattedVolumeTrend = useMemo(() => {
    if (!analytics?.volumeTrend) return [];
    return analytics.volumeTrend.map((item) => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString(
        isArabic ? 'ar-EG-u-nu-latn' : 'en-US',
        { month: 'short', day: 'numeric' },
      ),
    }));
  }, [analytics?.volumeTrend, isArabic]);

  // Localized status breakdown for donut chart and legend
  const formattedStatusBreakdown = useMemo(() => {
    if (!analytics?.statusBreakdown) return [];
    return analytics.statusBreakdown.map((item) => ({
      ...item,
      displayLabel: t(`statuses.${item.status.toLowerCase()}`, item.label),
    }));
  }, [analytics?.statusBreakdown, t]);

  // Localized vehicle category names for bar chart
  const formattedCategoryDistribution = useMemo(() => {
    if (!analytics?.categoryDistribution) return [];
    const arCategoryMap: Record<string, string> = {
      Sedan: 'سيدان',
      SUV: 'دفع رباعي (SUV)',
      Hatchback: 'هاتشباك',
      Coupe: 'كوبيه',
      Crossover: 'كروس أوفر',
      Truck: 'شاحنة / نقل',
      Van: 'فان',
    };
    return analytics.categoryDistribution.map((item) => ({
      ...item,
      displayName: isArabic ? (arCategoryMap[item.name] || item.name) : item.name,
    }));
  }, [analytics?.categoryDistribution, isArabic]);

  const overview = analytics?.overview;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-0 duration-300">
      {/* Top Banner / Filter Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
              <ShieldCheck className="size-3.5" />
              {t('dashboard.analyticsTag', 'EuroInspect 360 · Analytics')}
            </span>
            {analytics?.scope.isGlobal ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 font-mono text-[10px] font-medium text-purple-700 border border-purple-100">
                <Buildings className="size-3" />
                {t('dashboard.allPartnerBanks', 'All Partner Banks (Global Overview)')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-medium text-blue-700 border border-blue-100">
                <Buildings className="size-3" />
                {analytics?.scope.bankName ||
                  activeBankObj?.name ||
                  t('dashboard.selectedBank', 'Selected Bank')}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {t('dashboard.title', 'Inspection Operations Dashboard')}
          </h1>
          <p className="mt-0.5 text-xs text-ink-mute">
            {t(
              'dashboard.subtitle',
              'Live business intelligence, operational workflow velocity, and market valuation metrics.',
            )}
          </p>
        </div>

        {/* Controls: Bank Selector & Period */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bank Scope Selector for Super Admin & Reviewer */}
          {isGlobalStaff && (
            <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-paper px-3 py-1.5 text-xs">
              <Funnel className="size-3.5 text-ink-mute" />
              <select
                aria-label={t('dashboard.filterBankScope', 'Filter by bank scope')}
                value={selectedBankScope}
                onChange={(e) => {
                  setSelectedBankScope(e.target.value);
                  if (e.target.value !== 'all') {
                    setActiveBankId(e.target.value);
                  }
                }}
                className="bg-transparent font-medium text-ink outline-hidden cursor-pointer"
              >
                <option value="all">
                  {t('dashboard.allBanksGlobal', '🌐 All Banks (Global View)')}
                </option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏦 {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period Selector Pills */}
          <div className="flex items-center rounded-xl border border-hairline bg-paper p-1 text-xs">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriodDays(opt.value)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 font-medium transition-all ${
                  periodDays === opt.value
                    ? 'bg-white text-ink shadow-2xs font-semibold'
                    : 'text-ink-mute hover:text-ink'
                }`}
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
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-hairline bg-white p-2 text-ink-mute hover:text-ink hover:bg-paper transition-colors"
            title={t('dashboard.refreshAnalytics', 'Refresh analytics data')}
          >
            <ArrowsClockwise
              className={`size-4 ${isRefetching ? 'animate-spin text-accent' : ''}`}
            />
          </button>

          {/* Create Request CTA */}
          {canCreateRequest && (
            <button
              type="button"
              onClick={() => navigate('/requests/new')}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>{t('dashboard.newRequest', 'New Request')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Volume */}
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiTotalRequests', 'Total Inspection Requests')}
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Car className="size-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-ink">
              {isLoading ? '—' : overview?.totalRequests.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiAllTimeLogged', 'all-time logged')}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3 text-[11px] text-ink-mute">
            <span className="font-semibold text-accent">
              {overview?.activePipeline || 0} {t('dashboard.kpiActive', 'active')}
            </span>
            <span>{t('dashboard.kpiCurrentlyInPipeline', 'currently in workflow pipeline')}</span>
          </div>
        </div>

        {/* 2. Completed & Approval Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiApprovedCompleted', 'Approved & Completed')}
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="size-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-ink">
              {isLoading ? '—' : overview?.approved.toLocaleString('en-US')}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
              <TrendUp className="size-3" />
              {overview?.approvalRate ?? 0}% {t('dashboard.kpiCompletionRate', 'rate')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-[11px] text-ink-mute">
            <span>
              {t('statuses.rejected', 'Rejected')}:{' '}
              <strong className="text-rose-600">
                {overview?.rejected || 0}
              </strong>
            </span>
            <span>
              {t('statuses.cancelled', 'Cancelled')}: <strong>{overview?.cancelled || 0}</strong>
            </span>
          </div>
        </div>

        {/* 3. Total Market Valuation */}
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiEstimatedPortfolio', 'Estimated Portfolio Value')}
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CurrencyCircleDollar className="size-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold tracking-tight text-ink">
              {isLoading ? '—' : formatCurrency(overview?.totalValuation)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-hairline pt-3 text-[11px] text-ink-mute">
            <span>{t('dashboard.kpiAssessedValuation', 'assessed vehicle valuation')}:</span>
            <strong className="font-mono text-ink">
              {formatCurrency(overview?.averageValuation)}
            </strong>
          </div>
        </div>

        {/* 4. Turnaround Velocity */}
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiPipelineVelocity', 'Pipeline Velocity')}
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="size-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-ink">
              {isLoading
                ? '—'
                : overview?.averageTurnaroundDays === 0
                  ? '< 1'
                  : overview?.averageTurnaroundDays}
            </span>
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiAvgCompletionTime', 'avg completion time')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-[11px] text-ink-mute">
            <span>{t('dashboard.kpiTargetBenchmark', 'target: <48h benchmark')}</span>
            <strong className="font-mono text-emerald-600">
              {analytics?.checklistPerformance.passRate || 0}%
            </strong>
          </div>
        </div>
      </div>

      {/* Operational Pipeline Stage Tracker Cards */}
      <div className="rounded-2xl border border-hairline bg-paper p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute">
            {t('dashboard.pipelineTitle', 'Operational Pipeline Velocity')}
          </h3>
          <span className="text-[11px] font-mono text-ink-mute">
            {t('dashboard.pipelineSubtitle', 'End-to-end lifecycle throughput across 5 core stages')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Stage 1: Initial Review */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-700">
                {t('dashboard.stage1Title', '1. Intake & Drafts')}
              </span>
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.pendingInitialApproval || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">
              {t('dashboard.stage1Desc', 'New intake requests created & pending dispatch')}
            </p>
          </div>

          {/* Stage 2: Assignment */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-700">
                {t('dashboard.stage2Title', '2. Reviewer Triage')}
              </span>
              <span className="size-2 rounded-full bg-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.pendingAssignment || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">
              {t('dashboard.stage2Desc', 'Initial validation & audit by inspection reviewers')}
            </p>
          </div>

          {/* Stage 3: Field Inspection */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-700">
                {t('dashboard.stage3Title', '3. Field Agent Dispatch')}
              </span>
              <span className="size-2 rounded-full bg-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.inField || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">
              {t('dashboard.stage3Desc', 'Assigned to field representatives on mobile apps')}
            </p>
          </div>

          {/* Stage 4: Media & Valuation Review */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-cyan-700">
                {t('dashboard.stage4Title', '4. Inspection & Submission')}
              </span>
              <span className="size-2 rounded-full bg-cyan-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.underValuationReview || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">
              {t('dashboard.stage4Desc', 'Field photos captured, checklists completed & submitted')}
            </p>
          </div>

          {/* Stage 5: Final Authorization */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700">
                {t('dashboard.stage5Title', '5. Final Review & Approval')}
              </span>
              <span className="size-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.approved || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">
              {t('dashboard.stage5Desc', 'Audit approved and inspection certificate finalized')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart 1: Volume Trend Over Time (Area Chart - 2 Cols) */}
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ChartLineUp className="size-4" />
                </span>
                <h3 className="text-base font-bold text-ink">
                  {t('dashboard.chartVolumeTrend', 'Inspection Volume Trend')}
                </h3>
              </div>
              <p className="mt-1 text-xs text-ink-mute">
                {t('dashboard.chartVolumeSubtitle', 'Daily created vs completed volume')}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" />
                <span className="text-ink-soft">{t('dashboard.created', 'Created')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-ink-soft">{t('dashboard.completed', 'Completed')}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 h-72 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-ink-mute">
                {t('common.loading', 'Loading...')}
              </div>
            ) : formattedVolumeTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedVolumeTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="createdGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="approvedGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#888' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#888' }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e7eb',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name={t('dashboard.created', 'Created')}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#createdGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="approved"
                    name={t('dashboard.completed', 'Completed')}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#approvedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-xs text-ink-mute">
                <Car className="size-8 text-ink-mute/50 mb-1" />
                {t('dashboard.noRequestsPeriod', 'No request activity recorded in this period')}
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Pipeline Distribution (Donut Chart - 1 Col) */}
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <ChartPie className="size-4" />
              </span>
              <h3 className="text-base font-bold text-ink">
                {t('dashboard.chartStatusBreakdown', 'Volume Breakdown by Operational Status')}
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-mute">
              {t('dashboard.chartStatusSubtitle', 'Current distribution across all workflow statuses')}
            </p>

            <div className="mt-4 h-56 w-full">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-xs text-ink-mute">
                  {t('common.loading', 'Loading...')}
                </div>
              ) : formattedStatusBreakdown.some((s) => s.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedStatusBreakdown.filter(
                        (s) => s.count > 0,
                      )}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="displayLabel"
                    >
                      {formattedStatusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any, name: any) => [
                        `${val} ${t('dashboard.requests', 'requests')}`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-xs text-ink-mute">
                  <ChartPie className="size-8 text-ink-mute/50 mb-1" />
                  {t('dashboard.noRequestsPeriod', 'No inspection requests found')}
                </div>
              )}
            </div>
          </div>

          {/* Donut Legend */}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-hairline pt-3 text-[11px]">
            {formattedStatusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-ink-soft">
                  {item.displayLabel}
                </span>
                <span className="ms-auto font-mono font-bold text-ink">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Analytics Row: Categories, Quality & Priority */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Breakdown Bar Chart */}
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <ChartBar className="size-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">
                  {t('dashboard.chartCategories', 'Vehicle Category Distribution')}
                </h3>
                <p className="text-xs text-ink-mute">
                  {t(
                    'dashboard.chartCategoriesSubtitle',
                    'Inspection volume classified by vehicle segment.',
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 h-64 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-ink-mute">
                {t('common.loading', 'Loading categories...')}
              </div>
            ) : formattedCategoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedCategoryDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="displayName"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#888' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#888' }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    formatter={(val: any) => [
                      `${val} ${isArabic ? 'مركبة' : 'vehicles'}`,
                      isArabic ? 'العدد' : 'Volume',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-ink-mute">
                {t('dashboard.noCategoriesData', 'No category data available')}
              </div>
            )}
          </div>
        </div>

        {/* Quality & Checklist Pass Rate Card */}
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckSquare className="size-4" />
              </span>
              <h3 className="text-base font-bold text-ink">
                {t('dashboard.qualityTitle', 'Checklist Audit Quality')}
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-mute">
              {t(
                'dashboard.qualitySubtitle',
                'Evidence compliance from Reviewer media evaluations.',
              )}
            </p>

            <div className="mt-5 space-y-4">
              {/* Pass Rate Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-soft">
                    {t('dashboard.firstTimePassRate', 'First-Time Pass Rate')}
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    {analytics?.checklistPerformance.passRate ?? 0}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${analytics?.checklistPerformance.passRate ?? 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-paper p-3 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-600">
                    {t('dashboard.pass', 'Pass')}
                  </p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {analytics?.checklistPerformance.passCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-600">
                    {t('dashboard.reshoot', 'Reshoot')}
                  </p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {analytics?.checklistPerformance.reshootCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-rose-600">
                    {t('dashboard.fail', 'Fail')}
                  </p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {analytics?.checklistPerformance.failCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Priority SLA breakdown */}
          <div className="mt-6 border-t border-hairline pt-4">
            <h4 className="text-xs font-semibold text-ink-soft">
              {t('dashboard.priorityDemands', 'Priority Demands')}
            </h4>
            <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[10px]">
              {analytics?.priorityDistribution.map((p) => (
                <div
                  key={p.priority}
                  className="rounded-lg border border-hairline bg-white p-1.5"
                >
                  <span className="block text-ink-mute font-medium">
                    {t(`priorities.${p.priority.toLowerCase()}`, p.priority)}
                  </span>
                  <span className="mt-0.5 block font-mono font-bold text-ink">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspection Operations Feed */}
      <div className="rounded-2xl border border-hairline bg-white shadow-xs">
        <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-hairline">
          <div>
            <h3 className="text-base font-bold text-ink">
              {t('dashboard.recentRequests', 'Recent Inspection Requests')}
            </h3>
            <p className="text-xs text-ink-mute">
              {t('dashboard.recentSubtitle', 'Real-time feed of submitted and ongoing inspections.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <span>{t('dashboard.viewAllRequests', 'View All Inspection Requests')}</span>
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-paper font-mono uppercase tracking-wider text-ink-mute text-[10px]">
              <tr>
                <th className="px-5 py-3">{t('dashboard.thRequestNumber', 'Request Number')}</th>
                <th className="px-5 py-3">{t('dashboard.thVehicle', 'Vehicle Details')}</th>
                <th className="px-5 py-3">{t('dashboard.thCustomer', 'Customer')}</th>
                {analytics?.scope.isGlobal && (
                  <th className="px-5 py-3">{t('titles.banks', 'Partner Bank')}</th>
                )}
                <th className="px-5 py-3">{t('dashboard.thStatus', 'Status')}</th>
                <th className="px-5 py-3">{t('dashboard.thCreated', 'Submitted At')}</th>
                <th className="px-5 py-3 text-right">{t('dashboard.thActions', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-ink-mute"
                  >
                    {t('common.loading', 'Loading recent requests...')}
                  </td>
                </tr>
              ) : analytics?.recentRequests &&
                analytics.recentRequests.length > 0 ? (
                analytics.recentRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-paper/50 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/requests/${req.id}?bankId=${req.bankId || queryBankId || activeBankId || ''}`,
                      )
                    }
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-accent">
                      {req.requestNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {req.vehicleDescription === 'Vehicle info pending' || req.vehicleDescription === 'Vehicle'
                        ? (isArabic ? 'بيانات المركبة قيد الإدخال' : 'Vehicle info pending')
                        : req.vehicleDescription}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {req.customerName === 'N/A' || !req.customerName
                        ? (isArabic ? 'غير محدد' : 'N/A')
                        : req.customerName}
                    </td>
                    {analytics.scope.isGlobal && (
                      <td className="px-5 py-3.5 font-medium text-ink-soft">
                        <span className="inline-flex items-center gap-1 rounded bg-paper px-1.5 py-0.5 border border-hairline font-mono text-[10px]">
                          🏦 {req.bankName}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'COMPLETED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : req.status === 'REJECTED' ||
                                  req.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : req.status === 'IN_PROGRESS' ||
                                    req.status === 'ASSIGNED'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : req.status === 'UNDER_REVIEW'
                                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status === 'COMPLETED'
                          ? t('requests.awaitingApprovalBadge', 'AWAITING APPROVAL')
                          : t(`statuses.${req.status.toLowerCase()}`, req.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-ink-mute text-[11px]">
                      {new Date(req.requestedAt).toLocaleDateString(
                        isArabic ? 'ar-EG-u-nu-latn' : 'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/requests/${req.id}?bankId=${req.bankId || queryBankId || activeBankId || ''}`,
                          );
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-hairline px-2.5 py-1 text-[11px] font-medium text-ink hover:text-accent hover:border-accent/40 hover:bg-paper transition-colors"
                      >
                        <Eye className="size-3" />
                        <span>{t('common.details', 'Details')}</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-ink-mute"
                  >
                    {t('dashboard.noRequestsPeriod', 'No inspection requests found in database.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
