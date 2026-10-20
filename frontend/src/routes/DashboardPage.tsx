import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
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
} from 'recharts'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import {
  fetchInspectionAnalytics,
  type InspectionAnalyticsData,
} from '@/features/inspection-requests/api'
import { RequestDetailModal } from '@/features/inspection-requests/components/RequestDetailModal'

const PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, banks, activeBankId, setActiveBankId } = useWorkspace()

  // Period filter (7, 30, 90 days)
  const [periodDays, setPeriodDays] = useState<number>(30)

  // Selected bank for Super Admin / Reviewer filter ('all' or specific bank id)
  const isGlobalStaff =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'REVIEWER'

  const [selectedBankScope, setSelectedBankScope] = useState<string>(
    isGlobalStaff ? 'all' : activeBankId || '',
  )

  // Modal inspection inspection detail preview
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  // Determine query bankId parameter
  const queryBankId = isGlobalStaff
    ? selectedBankScope === 'all'
      ? undefined
      : selectedBankScope
    : activeBankId || undefined

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
  })

  // Format currency helper
  const formatCurrency = (val: number | undefined) => {
    if (!val) return '0 EGP'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Active bank name for display
  const activeBankObj = useMemo(() => {
    if (queryBankId) {
      return banks.find((b) => b.id === queryBankId)
    }
    return null
  }, [banks, queryBankId])

  const overview = analytics?.overview

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-0 duration-300">
      {/* Top Banner / Filter Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
              <ShieldCheck className="size-3.5" />
              EuroInspect 360 · Analytics
            </span>
            {analytics?.scope.isGlobal ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 font-mono text-[10px] font-medium text-purple-700 border border-purple-100">
                <Buildings className="size-3" />
                All Partner Banks (Global Overview)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-medium text-blue-700 border border-blue-100">
                <Buildings className="size-3" />
                {analytics?.scope.bankName || activeBankObj?.name || 'Selected Bank'}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Inspection Operations Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-ink-mute">
            Live business intelligence, operational workflow velocity, and market valuation metrics.
          </p>
        </div>

        {/* Controls: Bank Selector & Period */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bank Scope Selector for Super Admin & Reviewer */}
          {isGlobalStaff && (
            <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-paper px-3 py-1.5 text-xs">
              <Funnel className="size-3.5 text-ink-mute" />
              <select
                aria-label="Filter by bank scope"
                value={selectedBankScope}
                onChange={(e) => {
                  setSelectedBankScope(e.target.value)
                  if (e.target.value !== 'all') {
                    setActiveBankId(e.target.value)
                  }
                }}
                className="bg-transparent font-medium text-ink outline-hidden cursor-pointer"
              >
                <option value="all">🌐 All Banks (Global View)</option>
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
            {PERIOD_OPTIONS.map((opt) => (
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
            title="Refresh analytics data"
          >
            <ArrowsClockwise
              className={`size-4 ${isRefetching ? 'animate-spin text-accent' : ''}`}
            />
          </button>

          {/* Create Request CTA */}
          <button
            type="button"
            onClick={() => navigate('/requests/new')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 transition-colors"
          >
            <Plus className="size-3.5" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Volume */}
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-mute">
              Total Inspection Requests
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Car className="size-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-ink">
              {isLoading ? '—' : overview?.totalRequests.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-ink-mute">all-time logged</span>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3 text-[11px] text-ink-mute">
            <span className="font-semibold text-accent">
              {overview?.activePipeline || 0} active
            </span>
            <span>currently in workflow pipeline</span>
          </div>
        </div>

        {/* 2. Completed & Approval Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-mute">
              Approved & Completed
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="size-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-ink">
              {isLoading ? '—' : overview?.approved.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
              <TrendUp className="size-3" />
              {overview?.approvalRate ?? 0}% rate
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-[11px] text-ink-mute">
            <span>
              Rejected: <strong className="text-rose-600">{overview?.rejected || 0}</strong>
            </span>
            <span>
              Cancelled: <strong>{overview?.cancelled || 0}</strong>
            </span>
          </div>
        </div>

        {/* 3. Total Market Valuation */}
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-mute">
              Authorized Market Valuation
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
            <span>Average per approved vehicle:</span>
            <strong className="font-mono text-ink">
              {formatCurrency(overview?.averageValuation)}
            </strong>
          </div>
        </div>

        {/* 4. Turnaround Velocity */}
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-mute">
              Avg Turnaround Time
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
            <span className="text-xs font-medium text-ink-mute">days to approval</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-[11px] text-ink-mute">
            <span>First-time pass rate:</span>
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
            Live Inspection Pipeline Status
          </h3>
          <span className="text-[11px] font-mono text-ink-mute">
            Stage 1 Intake → Stage 5 Final Authorization
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Stage 1: Initial Review */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-700">
                1. Initial Review
              </span>
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.pendingInitialApproval || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">Awaiting Reviewer Approval</p>
          </div>

          {/* Stage 2: Assignment */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-700">
                2. Assignment
              </span>
              <span className="size-2 rounded-full bg-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.pendingAssignment || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">Awaiting Field Rep</p>
          </div>

          {/* Stage 3: Field Inspection */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-700">
                3. In-Field Capture
              </span>
              <span className="size-2 rounded-full bg-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.inField || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">Assigned / In Progress</p>
          </div>

          {/* Stage 4: Media & Valuation Review */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-cyan-700">
                4. Media & Valuation
              </span>
              <span className="size-2 rounded-full bg-cyan-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.underValuationReview || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">Media Review & Pricing</p>
          </div>

          {/* Stage 5: Final Authorization */}
          <div className="rounded-xl border border-hairline bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700">
                5. Authorized
              </span>
              <span className="size-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {overview?.approved || 0}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-mute">Final Approved</p>
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
                  Inspection Volume & Approval Velocity
                </h3>
              </div>
              <p className="mt-1 text-xs text-ink-mute">
                Daily trend of new inspection requests vs authorized completions over the last {periodDays} days.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" />
                <span className="text-ink-soft">Created Requests</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-ink-soft">Approved Inspections</span>
              </div>
            </div>
          </div>

          <div className="mt-6 h-72 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-ink-mute">
                Loading volume trends...
              </div>
            ) : analytics?.volumeTrend && analytics.volumeTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.volumeTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="formattedDate"
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
                    name="Requests Created"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#createdGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="approved"
                    name="Inspections Approved"
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
                No request activity recorded in this period
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
                Status Pipeline Share
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-mute">
              Relative proportion across active and completed lifecycle states.
            </p>

            <div className="mt-4 h-56 w-full">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-xs text-ink-mute">
                  Loading status share...
                </div>
              ) : analytics?.statusBreakdown &&
                analytics.statusBreakdown.some((s) => s.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusBreakdown.filter((s) => s.count > 0)}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="label"
                    >
                      {analytics.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any, name: any) => [
                        `${val} requests`,
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
                  No inspection requests found
                </div>
              )}
            </div>
          </div>

          {/* Donut Legend */}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-hairline pt-3 text-[11px]">
            {analytics?.statusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-ink-soft">{item.label}</span>
                <span className="ml-auto font-mono font-bold text-ink">
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
                  Vehicle Category Distribution
                </h3>
                <p className="text-xs text-ink-mute">
                  Inspection volume classified by vehicle segment.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 h-64 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-ink-mute">
                Loading categories...
              </div>
            ) : analytics?.categoryDistribution &&
              analytics.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.categoryDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
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
                    formatter={(val: any) => [`${val} vehicles`, 'Volume']}
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
                No category data available
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
                Checklist Audit Quality
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-mute">
              Evidence compliance from Reviewer media evaluations.
            </p>

            <div className="mt-5 space-y-4">
              {/* Pass Rate Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-soft">
                    First-Time Pass Rate
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
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Pass</p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {analytics?.checklistPerformance.passCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-600">Reshoot</p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {analytics?.checklistPerformance.reshootCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-rose-600">Fail</p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {analytics?.checklistPerformance.failCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Priority SLA breakdown */}
          <div className="mt-6 border-t border-hairline pt-4">
            <h4 className="text-xs font-semibold text-ink-soft">Priority Demands</h4>
            <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[10px]">
              {analytics?.priorityDistribution.map((p) => (
                <div
                  key={p.priority}
                  className="rounded-lg border border-hairline bg-white p-1.5"
                >
                  <span className="block text-ink-mute uppercase font-mono">
                    {p.priority}
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
              Recent Inspection Requests
            </h3>
            <p className="text-xs text-ink-mute">
              Real-time feed of submitted and ongoing inspections.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <span>View All Inspection Requests</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper font-mono uppercase tracking-wider text-ink-mute text-[10px]">
              <tr>
                <th className="px-5 py-3">Request Number</th>
                <th className="px-5 py-3">Vehicle Details</th>
                <th className="px-5 py-3">Customer</th>
                {analytics?.scope.isGlobal && (
                  <th className="px-5 py-3">Partner Bank</th>
                )}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Submitted At</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-mute">
                    Loading recent requests...
                  </td>
                </tr>
              ) : analytics?.recentRequests && analytics.recentRequests.length > 0 ? (
                analytics.recentRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-paper/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequestId(req.id)}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-accent">
                      {req.requestNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {req.vehicleDescription}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {req.customerName}
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
                            : req.status === 'REJECTED' || req.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : req.status === 'IN_PROGRESS' || req.status === 'ASSIGNED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : req.status === 'UNDER_REVIEW' || req.status === 'COMPLETED'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-ink-mute text-[11px]">
                      {new Date(req.requestedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRequestId(req.id)
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-hairline bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:text-accent hover:border-accent transition-colors"
                      >
                        <Eye className="size-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-mute">
                    No inspection requests found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for viewing Request Details directly from dashboard */}
      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </div>
  )
}
