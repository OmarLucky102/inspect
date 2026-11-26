import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartBar } from '@phosphor-icons/react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
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

interface CategoryDistributionChartProps {
  categoryDistribution?: InspectionAnalyticsData['categoryDistribution']
  isLoading: boolean
  isArabic: boolean
}

const AR_CATEGORY_MAP: Record<string, string> = {
  Sedan: 'سيدان',
  SUV: 'دفع رباعي (SUV)',
  Hatchback: 'هاتشباك',
  Coupe: 'كوبيه',
  Crossover: 'كروس أوفر',
  Truck: 'شاحنة / نقل',
  Van: 'فان',
}

export function CategoryDistributionChart({
  categoryDistribution,
  isLoading,
  isArabic,
}: CategoryDistributionChartProps) {
  const { t } = useTranslation()
  const [metricMode, setMetricMode] = useState<'count' | 'totalValuation'>('count')

  const formattedData = useMemo(() => {
    if (!categoryDistribution) return []
    const totalCount = categoryDistribution.reduce((s, c) => s + c.count, 0)
    return [...categoryDistribution]
      .sort((a, b) => b[metricMode] - a[metricMode])
      .map((item) => ({
        ...item,
        displayName: isArabic ? AR_CATEGORY_MAP[item.name] || item.name : item.name,
        sharePct: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
      }))
  }, [categoryDistribution, isArabic, metricMode])

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      count: {
        label: t('dashboard.volumeLabel', 'Vehicles'),
        theme: { light: '#0284c7', dark: '#38bdf8' },
      },
      totalValuation: {
        label: t('dashboard.valuationLabel', 'Portfolio Value'),
        theme: { light: '#6366f1', dark: '#818cf8' },
      },
    }),
    [t],
  )

  const formatCompactValue = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `${Math.round(val / 1_000)}K`
    return String(val)
  }

  return (
    <Card variant="glass" className="lg:col-span-2">
      <CardHeader className="flex flex-col gap-3 border-b border-hairline/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/12 text-indigo-600 dark:text-indigo-400">
            <ChartBar className="size-4" weight="duotone" />
          </span>
          <div>
            <CardTitle>
              {t('dashboard.chartCategories', 'Vehicle Category Distribution')}
            </CardTitle>
            <CardDescription>
              {t(
                'dashboard.chartCategoriesSubtitle',
                'Inspection volume classified by vehicle segment.',
              )}
            </CardDescription>
          </div>
        </div>

        <CardAction>
          <div className="glass-subtle inline-flex items-center rounded-xl p-0.5 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setMetricMode('count')}
              className={cn(
                'cursor-pointer rounded-lg px-2.5 py-1 transition-all',
                metricMode === 'count'
                  ? 'bg-white dark:bg-white/15 font-semibold text-ink shadow-2xs'
                  : 'text-ink-mute hover:text-ink',
              )}
            >
              {t('dashboard.volumeMode', 'Volume')}
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('totalValuation')}
              className={cn(
                'cursor-pointer rounded-lg px-2.5 py-1 transition-all',
                metricMode === 'totalValuation'
                  ? 'bg-white dark:bg-white/15 font-semibold text-ink shadow-2xs'
                  : 'text-ink-mute hover:text-ink',
              )}
            >
              {t('dashboard.valuationMode', 'Valuation')}
            </button>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="h-64 w-full">
          {isLoading ? (
            <div className="flex h-full items-end gap-4 px-6 pb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t-xl"
                  style={{ height: `${35 + ((i * 19) % 55)}%` }}
                />
              ))}
            </div>
          ) : formattedData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                data={formattedData}
                margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="catCountGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.55} />
                  </linearGradient>
                  <linearGradient id="catValGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-totalValuation)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--color-totalValuation)" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="displayName"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                  tickFormatter={
                    metricMode === 'totalValuation' ? formatCompactValue : undefined
                  }
                />
                <ChartTooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(_val, _name, item) => {
                        const row = item.payload as {
                          count?: number
                          totalValuation?: number
                          sharePct?: number
                        }
                        const cur = isArabic ? 'ج.م' : 'EGP'
                        return (
                          <div className="w-full space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-ink-mute">
                                {t('dashboard.volumeMode', 'Volume')}
                              </span>
                              <span className="font-mono font-semibold text-ink">
                                {(row.count ?? 0).toLocaleString('en-US')} ({row.sharePct ?? 0}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-ink-mute">
                                {t('dashboard.valuationMode', 'Valuation')}
                              </span>
                              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                {(row.totalValuation ?? 0).toLocaleString('en-US')} {cur}
                              </span>
                            </div>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Bar
                  dataKey={metricMode}
                  radius={[8, 8, 2, 2]}
                  maxBarSize={44}
                  fill={
                    metricMode === 'count' ? 'url(#catCountGrad)' : 'url(#catValGrad)'
                  }
                >
                  {formattedData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        metricMode === 'count'
                          ? 'url(#catCountGrad)'
                          : 'url(#catValGrad)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink-mute">
              {t('dashboard.noCategoriesData', 'No category data available')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
