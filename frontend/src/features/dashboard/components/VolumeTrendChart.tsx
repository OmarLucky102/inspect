import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Car, ChartBar, ChartLine, ChartLineUp } from '@phosphor-icons/react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { InspectionAnalyticsData } from '@/features/inspection-requests/api'

interface VolumeTrendChartProps {
  volumeTrend?: InspectionAnalyticsData['volumeTrend']
  isLoading: boolean
  isArabic: boolean
}

export function VolumeTrendChart({
  volumeTrend,
  isLoading,
  isArabic,
}: VolumeTrendChartProps) {
  const { t } = useTranslation()
  const [chartMode, setChartMode] = useState<'line' | 'area' | 'bar'>('line')
  const [visibleSeries, setVisibleSeries] = useState<{
    created: boolean
    approved: boolean
  }>({ created: true, approved: true })

  const formattedData = useMemo(() => {
    if (!volumeTrend) return []
    return volumeTrend.map((item) => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString(
        isArabic ? 'ar-EG-u-nu-latn' : 'en-US',
        { month: 'short', day: 'numeric' },
      ),
    }))
  }, [volumeTrend, isArabic])

  const summary = useMemo(() => {
    const totalCreated = formattedData.reduce((acc, d) => acc + d.created, 0)
    const totalApproved = formattedData.reduce((acc, d) => acc + d.approved, 0)
    const dailyAvg =
      formattedData.length > 0
        ? Math.round((totalCreated / formattedData.length) * 10) / 10
        : 0
    const peakDay = formattedData.reduce(
      (best, d) => (d.created > best.created ? d : best),
      { created: 0, displayDate: '—' },
    )
    return { totalCreated, totalApproved, dailyAvg, peakDay }
  }, [formattedData])

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      created: {
        label: t('dashboard.created', 'Created'),
        theme: { light: '#0284c7', dark: '#38bdf8' },
      },
      approved: {
        label: t('dashboard.completed', 'Completed'),
        theme: { light: '#0d7a57', dark: '#34d399' },
      },
    }),
    [t],
  )

  const toggleSeries = (key: 'created' | 'approved') => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (!next.created && !next.approved) return prev
      return next
    })
  }

  const showNodes = formattedData.length <= 32

  return (
    <Card variant="glass" className="relative overflow-hidden lg:col-span-2">
      {/* Subtle optical corner refraction */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 end-12 size-44 rounded-full bg-sky-500/14 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 start-12 size-44 rounded-full bg-emerald-500/12 blur-3xl"
      />

      <CardHeader className="relative flex flex-col gap-3 border-b border-hairline/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/12 text-sky-600 dark:text-sky-400">
            <ChartLine className="size-4" weight="duotone" />
          </span>
          <div>
            <CardTitle>
              {t('dashboard.chartVolumeTrend', 'Inspection Volume Trend')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.chartVolumeSubtitle', 'Daily created vs completed volume')}
            </CardDescription>
          </div>
        </div>

        <CardAction className="flex flex-wrap items-center gap-2">
          {/* Interactive Series Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleSeries('created')}
              aria-pressed={visibleSeries.created}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium backdrop-blur-xs transition-all',
                visibleSeries.created
                  ? 'border-sky-500/35 bg-sky-500/14 text-sky-700 dark:text-sky-300 shadow-[0_0_16px_-6px_rgba(56,189,248,0.5)]'
                  : 'border-hairline bg-transparent text-ink-mute opacity-60 hover:opacity-100',
              )}
            >
              <span className="size-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              <span>{t('dashboard.created', 'Created')}</span>
              <span className="font-mono font-bold tabular-nums">
                {summary.totalCreated}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleSeries('approved')}
              aria-pressed={visibleSeries.approved}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium backdrop-blur-xs transition-all',
                visibleSeries.approved
                  ? 'border-emerald-500/35 bg-emerald-500/14 text-emerald-700 dark:text-emerald-300 shadow-[0_0_16px_-6px_rgba(16,185,129,0.5)]'
                  : 'border-hairline bg-transparent text-ink-mute opacity-60 hover:opacity-100',
              )}
            >
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>{t('dashboard.completed', 'Completed')}</span>
              <span className="font-mono font-bold tabular-nums">
                {summary.totalApproved}
              </span>
            </button>
          </div>

          {/* Chart Type Switcher: Line (Wave) / Area / Bar */}
          <div
            role="group"
            aria-label={t('dashboard.chartViewMode', 'Chart view mode')}
            className="glass-subtle inline-flex items-center rounded-xl p-0.5"
          >
            <button
              type="button"
              onClick={() => setChartMode('line')}
              title={t('dashboard.lineView', 'Line view')}
              aria-pressed={chartMode === 'line'}
              className={cn(
                'flex size-7 cursor-pointer items-center justify-center rounded-lg transition-all',
                chartMode === 'line'
                  ? 'bg-white/90 dark:bg-white/18 text-ink shadow-2xs'
                  : 'text-ink-mute hover:text-ink',
              )}
            >
              <ChartLine className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('area')}
              title={t('dashboard.areaView', 'Area view')}
              aria-pressed={chartMode === 'area'}
              className={cn(
                'flex size-7 cursor-pointer items-center justify-center rounded-lg transition-all',
                chartMode === 'area'
                  ? 'bg-white/90 dark:bg-white/18 text-ink shadow-2xs'
                  : 'text-ink-mute hover:text-ink',
              )}
            >
              <ChartLineUp className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              title={t('dashboard.barView', 'Bar view')}
              aria-pressed={chartMode === 'bar'}
              className={cn(
                'flex size-7 cursor-pointer items-center justify-center rounded-lg transition-all',
                chartMode === 'bar'
                  ? 'bg-white/90 dark:bg-white/18 text-ink shadow-2xs'
                  : 'text-ink-mute hover:text-ink',
              )}
            >
              <ChartBar className="size-3.5" />
            </button>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="relative pt-4">
        {/* Peak, Daily Avg & Ratio Telemetry Strip */}
        {!isLoading && formattedData.length > 0 && (
          <div className="glass-subtle mb-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-ink-mute">
                {t('dashboard.peakDay', 'Peak Day')}:{' '}
                <strong className="font-mono text-ink">
                  {summary.peakDay.displayDate} ({summary.peakDay.created})
                </strong>
              </span>
              <span className="text-ink-mute">
                {t('dashboard.dailyAvg', 'Daily Avg')}:{' '}
                <strong className="font-mono text-sky-600 dark:text-sky-400">
                  {summary.dailyAvg}
                </strong>
              </span>
              <span className="hidden text-ink-mute sm:inline">
                {t('dashboard.settlementRatio', 'Completion Ratio')}:{' '}
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                  {summary.totalCreated > 0
                    ? Math.round((summary.totalApproved / summary.totalCreated) * 100)
                    : 0}
                  %
                </strong>
              </span>
            </div>
            <span className="font-mono text-[10px] text-ink-mute">
              {formattedData.length} {t('dashboard.dataPoints', 'days')}
            </span>
          </div>
        )}

        {/* Double-Layered Frosted Glass Chart Stage */}
        <div className="glass-subtle relative overflow-hidden rounded-2xl p-3 sm:p-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,rgba(56,189,248,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,rgba(56,189,248,0.12),transparent_70%)]"
          />
          <div className="relative h-68 w-full">
            {isLoading ? (
              <div className="flex h-full flex-col justify-end gap-3 p-4">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <div className="flex justify-between gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-10" />
                  ))}
                </div>
              </div>
            ) : formattedData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                {chartMode === 'line' ? (
                  <LineChart
                    data={formattedData}
                    margin={{ top: 14, right: 14, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <filter id="glassLineGlow" x="-10%" y="-25%" width="120%" height="150%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      minTickGap={24}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    {summary.dailyAvg > 0 && (
                      <ReferenceLine
                        y={summary.dailyAvg}
                        stroke="var(--color-created)"
                        strokeOpacity={0.35}
                        strokeDasharray="5 5"
                      />
                    )}
                    <ChartTooltip
                      cursor={{
                        stroke: 'var(--color-created)',
                        strokeWidth: 1.5,
                        strokeDasharray: '4 4',
                        strokeOpacity: 0.45,
                      }}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    {visibleSeries.created && (
                      <Line
                        type="monotone"
                        dataKey="created"
                        name="created"
                        stroke="var(--color-created)"
                        strokeWidth={3}
                        filter="url(#glassLineGlow)"
                        dot={
                          showNodes
                            ? {
                                r: 3.5,
                                strokeWidth: 2,
                                stroke: 'var(--color-created)',
                                fill: 'var(--theme-bone)',
                              }
                            : false
                        }
                        activeDot={{
                          r: 6,
                          strokeWidth: 2.5,
                          stroke: '#ffffff',
                          fill: 'var(--color-created)',
                        }}
                      />
                    )}
                    {visibleSeries.approved && (
                      <Line
                        type="monotone"
                        dataKey="approved"
                        name="approved"
                        stroke="var(--color-approved)"
                        strokeWidth={3}
                        filter="url(#glassLineGlow)"
                        dot={
                          showNodes
                            ? {
                                r: 3.5,
                                strokeWidth: 2,
                                stroke: 'var(--color-approved)',
                                fill: 'var(--theme-bone)',
                              }
                            : false
                        }
                        activeDot={{
                          r: 6,
                          strokeWidth: 2.5,
                          stroke: '#ffffff',
                          fill: 'var(--color-approved)',
                        }}
                      />
                    )}
                  </LineChart>
                ) : chartMode === 'area' ? (
                  <AreaChart
                    data={formattedData}
                    margin={{ top: 14, right: 14, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="glassCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-created)" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="var(--color-created)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="glassApprovedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-approved)" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="var(--color-approved)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      minTickGap={24}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      cursor={{ strokeDasharray: '4 4' }}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    {visibleSeries.created && (
                      <Area
                        type="monotone"
                        dataKey="created"
                        name="created"
                        stroke="var(--color-created)"
                        strokeWidth={2.75}
                        fillOpacity={1}
                        fill="url(#glassCreatedGrad)"
                        activeDot={{ r: 5.5, strokeWidth: 2, stroke: '#fff' }}
                      />
                    )}
                    {visibleSeries.approved && (
                      <Area
                        type="monotone"
                        dataKey="approved"
                        name="approved"
                        stroke="var(--color-approved)"
                        strokeWidth={2.75}
                        fillOpacity={1}
                        fill="url(#glassApprovedGrad)"
                        activeDot={{ r: 5.5, strokeWidth: 2, stroke: '#fff' }}
                      />
                    )}
                  </AreaChart>
                ) : (
                  <BarChart
                    data={formattedData}
                    margin={{ top: 14, right: 14, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      minTickGap={24}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    {visibleSeries.created && (
                      <Bar
                        dataKey="created"
                        name="created"
                        fill="var(--color-created)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={22}
                      />
                    )}
                    {visibleSeries.approved && (
                      <Bar
                        dataKey="approved"
                        name="approved"
                        fill="var(--color-approved)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={22}
                      />
                    )}
                  </BarChart>
                )}
              </ChartContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-xs text-ink-mute">
                <Car className="mb-1.5 size-8 text-ink-mute/50" />
                {t('dashboard.noRequestsPeriod', 'No request activity recorded in this period')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
