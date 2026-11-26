import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Car,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  TrendUp,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { NumberTicker } from '@/components/ui/number-ticker'
import type { InspectionAnalyticsData } from '@/features/inspection-requests/api'

interface KpiTelemetryGridProps {
  analytics?: InspectionAnalyticsData
  isLoading: boolean
  isArabic: boolean
}

function MiniSparkline({ values }: { values: number[] }) {
  const path = useMemo(() => {
    if (values.length < 2) return null
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const range = Math.max(1, max - min)
    const w = 120
    const h = 28
    const stepX = w / (values.length - 1)
    const pts = values.map((v, i) => {
      const x = i * stepX
      const y = h - 3 - ((v - min) / range) * (h - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return {
      line: `M ${pts.join(' L ')}`,
      area: `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`,
    }
  }, [values])

  if (!path) {
    return (
      <div className="h-7 w-24 rounded-md bg-ink/[0.04] dark:bg-white/[0.04]" />
    )
  }

  return (
    <svg
      viewBox="0 0 120 28"
      className="h-7 w-24 shrink-0 overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="kpiSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path.area} fill="url(#kpiSparkFill)" />
      <path
        d={path.line}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function KpiTelemetryGrid({
  analytics,
  isLoading,
  isArabic,
}: KpiTelemetryGridProps) {
  const { t } = useTranslation()
  const overview = analytics?.overview

  const sparkValues = useMemo(
    () => (analytics?.volumeTrend ?? []).slice(-14).map((d) => d.created),
    [analytics?.volumeTrend],
  )

  const formatCurrencyParts = (val: number | undefined) => {
    const unit = isArabic ? 'ج.م' : 'EGP'
    return { num: val ?? 0, unit }
  }

  const totalPortfolio = formatCurrencyParts(overview?.totalValuation)
  const avgPortfolio = overview?.averageValuation
    ? `${overview.averageValuation.toLocaleString('en-US')} ${isArabic ? 'ج.م' : 'EGP'}`
    : `0 ${isArabic ? 'ج.م' : 'EGP'}`

  const turnaround = overview?.averageTurnaroundDays ?? 0
  // SLA benchmark target is <= 2 days (48h)
  const slaHealthPct =
    turnaround === 0 ? 100 : Math.max(15, Math.min(100, Math.round((2 / Math.max(turnaround, 0.5)) * 85)))
  const slaHealthy = turnaround <= 2

  const passRate = analytics?.checklistPerformance.passRate ?? 0
  const approvalRate = overview?.approvalRate ?? 0

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Total Inspection Volume */}
      <Card variant="interactive" className="overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -end-10 size-28 rounded-full bg-sky-500/12 blur-2xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiTotalRequests', 'Total Inspection Requests')}
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-ink">
                <NumberTicker value={overview?.totalRequests ?? 0} />
              </span>
              <span className="text-[11px] font-medium text-ink-mute">
                {t('dashboard.kpiAllTimeLogged', 'all-time logged')}
              </span>
            </div>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/12 text-sky-600 dark:text-sky-400">
            <Car className="size-5" weight="duotone" />
          </span>
        </div>

        <div className="relative mt-4 flex items-end justify-between gap-3 border-t border-hairline/70 pt-3">
          <div className="min-w-0 text-[11px] text-ink-mute">
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
              {overview?.activePipeline ?? 0} {t('dashboard.kpiActive', 'active')}
            </span>
            <p className="truncate">
              {t('dashboard.kpiCurrentlyInPipeline', 'currently in workflow pipeline')}
            </p>
          </div>
          <MiniSparkline values={sparkValues} />
        </div>
      </Card>

      {/* 2. Approved & Completion Rate */}
      <Card variant="interactive" className="overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -end-10 size-28 rounded-full bg-emerald-500/14 blur-2xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiApprovedCompleted', 'Approved & Completed')}
            </span>
            <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-ink">
                <NumberTicker value={overview?.approved ?? 0} />
              </span>
              <Badge variant="emerald" className="px-2 py-0.5 text-[10px]">
                <TrendUp className="size-3" />
                {approvalRate}%
              </Badge>
            </div>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-5" weight="duotone" />
          </span>
        </div>

        <div className="relative mt-4 space-y-2 border-t border-hairline/70 pt-3">
          <Progress
            value={approvalRate}
            className="h-1.5"
            indicatorClassName="from-emerald-500 to-teal-400"
          />
          <div className="flex items-center justify-between text-[11px] text-ink-mute">
            <span>
              {t('statuses.rejected', 'Rejected')}:{' '}
              <strong className="font-mono text-rose-600 dark:text-rose-400">
                {overview?.rejected ?? 0}
              </strong>
            </span>
            <span>
              {t('statuses.cancelled', 'Cancelled')}:{' '}
              <strong className="font-mono text-ink-soft">
                {overview?.cancelled ?? 0}
              </strong>
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Estimated Portfolio Valuation */}
      <Card variant="interactive" className="overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -end-10 size-28 rounded-full bg-indigo-500/14 blur-2xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiEstimatedPortfolio', 'Estimated Portfolio Value')}
            </span>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight text-ink sm:text-[26px]">
                <NumberTicker value={totalPortfolio.num} />
              </span>
              <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {totalPortfolio.unit}
              </span>
            </div>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/12 text-indigo-600 dark:text-indigo-400">
            <CurrencyCircleDollar className="size-5" weight="duotone" />
          </span>
        </div>

        <div className="relative mt-4 space-y-2 border-t border-hairline/70 pt-3 text-[11px] text-ink-mute">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">
              {t('dashboard.kpiAssessedValuation', 'assessed vehicle valuation')}
            </span>
            <strong className="shrink-0 font-mono text-ink">
              {avgPortfolio}
            </strong>
          </div>
          <div className="flex items-center gap-1" aria-hidden>
            <span className="h-1 flex-1 rounded-full bg-indigo-500/70" />
            <span className="h-1 w-1/4 rounded-full bg-indigo-500/35" />
            <span className="h-1 w-1/6 rounded-full bg-indigo-500/15" />
          </div>
        </div>
      </Card>

      {/* 4. Turnaround Velocity & SLA */}
      <Card variant="interactive" className="overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -end-10 size-28 rounded-full bg-amber-500/14 blur-2xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-ink-mute">
              {t('dashboard.kpiPipelineVelocity', 'Pipeline Velocity')}
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-ink">
                {turnaround === 0 ? '< 1' : <NumberTicker value={turnaround} decimalPlaces={turnaround % 1 === 0 ? 0 : 1} />}
              </span>
              <span className="text-[11px] font-medium text-ink-mute">
                {t('dashboard.kpiDaysUnit', 'days')} · {t('dashboard.kpiAvgCompletionTime', 'avg')}
              </span>
            </div>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/12 text-amber-600 dark:text-amber-400">
            <Clock className="size-5" weight="duotone" />
          </span>
        </div>

        <div className="relative mt-4 space-y-2 border-t border-hairline/70 pt-3">
          <Progress
            value={slaHealthPct}
            className="h-1.5"
            indicatorClassName={
              slaHealthy
                ? 'from-amber-500 to-emerald-500'
                : 'from-rose-500 to-amber-500'
            }
          />
          <div className="flex items-center justify-between text-[11px] text-ink-mute">
            <span>{t('dashboard.kpiTargetBenchmark', 'target: <48h benchmark')}</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">
              {passRate}% {t('dashboard.pass', 'Pass')}
            </strong>
          </div>
        </div>
      </Card>
    </div>
  )
}
