import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartPie } from '@phosphor-icons/react'
import { Cell, Label, Pie, PieChart, Sector } from 'recharts'
import type { PieSectorShapeProps } from 'recharts/types/polar/Pie'
import {
  Card,
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

interface StatusBreakdownChartProps {
  statusBreakdown?: InspectionAnalyticsData['statusBreakdown']
  isLoading: boolean
}

export function StatusBreakdownChart({
  statusBreakdown,
  isLoading,
}: StatusBreakdownChartProps) {
  const { t } = useTranslation()
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null)

  const formatted = useMemo(() => {
    if (!statusBreakdown) return []
    return statusBreakdown.map((item) => ({
      ...item,
      displayLabel: t(`statuses.${item.status.toLowerCase()}`, item.label),
    }))
  }, [statusBreakdown, t])

  const nonZeroSlices = useMemo(
    () => formatted.filter((s) => s.count > 0),
    [formatted],
  )

  const totalCount = useMemo(
    () => formatted.reduce((acc, s) => acc + s.count, 0),
    [formatted],
  )

  const activeSlice = useMemo(() => {
    if (hoveredStatus) {
      return nonZeroSlices.find((s) => s.status === hoveredStatus) ?? null
    }
    return null
  }, [hoveredStatus, nonZeroSlices])

  const activeIndex = useMemo(() => {
    if (!hoveredStatus) return -1
    return nonZeroSlices.findIndex((s) => s.status === hoveredStatus)
  }, [hoveredStatus, nonZeroSlices])

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {}
    for (const s of formatted) {
      cfg[s.displayLabel] = { label: s.displayLabel, color: s.color }
    }
    return cfg
  }, [formatted])

  const renderPieShape = useCallback(
    ({ index, outerRadius = 0, ...props }: PieSectorShapeProps) => {
      if (index === activeIndex) {
        return (
          <g>
            <Sector {...props} outerRadius={outerRadius + 6} />
            <Sector
              {...props}
              outerRadius={outerRadius + 13}
              innerRadius={outerRadius + 8}
              fillOpacity={0.35}
            />
          </g>
        )
      }
      return <Sector {...props} outerRadius={outerRadius} />
    },
    [activeIndex],
  )

  return (
    <Card variant="glass" className="flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/12 text-purple-600 dark:text-purple-400">
            <ChartPie className="size-4" weight="duotone" />
          </span>
          <div>
            <CardTitle>
              {t('dashboard.chartStatusBreakdown', 'Volume Breakdown by Operational Status')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.chartStatusSubtitle', 'Current distribution across all workflow statuses')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between pt-2">
        <div className="h-56 w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Skeleton className="size-40 rounded-full" />
            </div>
          ) : nonZeroSlices.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      valueFormatter={(val) =>
                        `${Number(val).toLocaleString('en-US')} ${t('dashboard.requests', 'requests')}`
                      }
                    />
                  }
                />
                <Pie
                  data={nonZeroSlices}
                  innerRadius={56}
                  outerRadius={78}
                  paddingAngle={3}
                  cornerRadius={5}
                  dataKey="count"
                  nameKey="displayLabel"
                  shape={renderPieShape}
                  onMouseEnter={(_, idx) => {
                    const item = nonZeroSlices[idx]
                    if (item) setHoveredStatus(item.status)
                  }}
                  onMouseLeave={() => setHoveredStatus(null)}
                >
                  {nonZeroSlices.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} stroke="transparent" />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        const displayVal = activeSlice
                          ? activeSlice.count
                          : totalCount
                        const displaySub = activeSlice
                          ? `${activeSlice.percentage}%`
                          : t('dashboard.requests', 'Requests')
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 6}
                              className="fill-ink font-mono text-2xl font-extrabold tabular-nums"
                            >
                              {displayVal.toLocaleString('en-US')}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 15}
                              className="fill-ink-mute text-[11px] font-medium"
                            >
                              {displaySub}
                            </tspan>
                          </text>
                        )
                      }
                      return null
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-xs text-ink-mute">
              <ChartPie className="mb-1.5 size-8 text-ink-mute/50" />
              {t('dashboard.noRequestsPeriod', 'No inspection requests found')}
            </div>
          )}
        </div>

        {/* Interactive Legend with Share Bars */}
        <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-hairline/70 pt-3 text-[11px] sm:grid-cols-2">
          {formatted.map((item) => {
            const isHighlighted = hoveredStatus === item.status
            return (
              <button
                key={item.status}
                type="button"
                onMouseEnter={() => item.count > 0 && setHoveredStatus(item.status)}
                onMouseLeave={() => setHoveredStatus(null)}
                onClick={() =>
                  setHoveredStatus((prev) =>
                    prev === item.status ? null : item.count > 0 ? item.status : null,
                  )
                }
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-start transition-colors',
                  isHighlighted
                    ? 'bg-paper/80 dark:bg-white/[0.08]'
                    : 'hover:bg-paper/50 dark:hover:bg-white/[0.04]',
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-ink-soft">{item.displayLabel}</span>
                <span className="ms-auto font-mono font-bold text-ink tabular-nums">
                  {item.count}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
