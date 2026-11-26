import { useTranslation } from 'react-i18next'
import { CheckSquare } from '@phosphor-icons/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Skeleton } from '@/components/ui/skeleton'
import type { InspectionAnalyticsData } from '@/features/inspection-requests/api'
import { cn } from '@/lib/cn'

interface QualityAndPriorityCardProps {
  checklistPerformance?: InspectionAnalyticsData['checklistPerformance']
  priorityDistribution?: InspectionAnalyticsData['priorityDistribution']
  isLoading: boolean
}

export function QualityAndPriorityCard({
  checklistPerformance,
  priorityDistribution,
  isLoading,
}: QualityAndPriorityCardProps) {
  const { t } = useTranslation()

  const passRate = checklistPerformance?.passRate ?? 0
  const passCount = checklistPerformance?.passCount ?? 0
  const reshootCount = checklistPerformance?.reshootCount ?? 0
  const failCount = checklistPerformance?.failCount ?? 0
  const totalReviewed = Math.max(1, passCount + reshootCount + failCount)

  const passPct = (passCount / totalReviewed) * 100
  const reshootPct = (reshootCount / totalReviewed) * 100
  const failPct = (failCount / totalReviewed) * 100

  const maxPriority = Math.max(
    1,
    ...(priorityDistribution ?? []).map((p) => p.count),
  )

  const priorityAccent: Record<string, string> = {
    LOW: 'bg-slate-400',
    MEDIUM: 'bg-sky-500',
    HIGH: 'bg-amber-500',
    URGENT: 'bg-rose-500',
  }

  return (
    <Card variant="glass" className="flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <CheckSquare className="size-4" weight="duotone" />
          </span>
          <div>
            <CardTitle>
              {t('dashboard.qualityTitle', 'Checklist Audit Quality')}
            </CardTitle>
            <CardDescription>
              {t(
                'dashboard.qualitySubtitle',
                'Evidence compliance from Reviewer media evaluations.',
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between space-y-5 pt-2">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Skeleton className="size-32 rounded-full" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Radial Pass Rate Gauge */}
            <div className="flex flex-col items-center justify-center pt-1">
              <AnimatedCircularProgressBar
                value={passRate}
                className="size-32"
                label={`${passRate}%`}
                sublabel={t('dashboard.firstTimePassRate', 'Pass Rate')}
              />
            </div>

            {/* Segmented Quality Breakdown Bar + Counters */}
            <div className="space-y-2.5">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/[0.08]">
                {passCount > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${passPct}%` }}
                  />
                )}
                {reshootCount > 0 && (
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${reshootPct}%` }}
                  />
                )}
                {failCount > 0 && (
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${failPct}%` }}
                  />
                )}
              </div>

              <div className="glass-subtle grid grid-cols-3 gap-2 rounded-xl p-2.5 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    {t('dashboard.pass', 'Pass')}
                  </p>
                  <p className="mt-0.5 font-mono text-base font-bold text-ink tabular-nums">
                    {passCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                    {t('dashboard.reshoot', 'Reshoot')}
                  </p>
                  <p className="mt-0.5 font-mono text-base font-bold text-ink tabular-nums">
                    {reshootCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                    {t('dashboard.fail', 'Fail')}
                  </p>
                  <p className="mt-0.5 font-mono text-base font-bold text-ink tabular-nums">
                    {failCount}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Priority SLA Breakdown */}
        <div className="border-t border-hairline/70 pt-3.5">
          <h4 className="mb-2.5 text-xs font-semibold text-ink-soft">
            {t('dashboard.priorityDemands', 'Priority Demands')}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
            {(priorityDistribution ?? []).map((p) => {
              const barWidth = Math.round((p.count / maxPriority) * 100)
              return (
                <div
                  key={p.priority}
                  className="glass-subtle flex flex-col justify-between rounded-xl p-2"
                >
                  <span className="block truncate font-medium text-ink-mute">
                    {t(`priorities.${p.priority.toLowerCase()}`, p.priority)}
                  </span>
                  <span className="my-1 block font-mono text-sm font-bold text-ink tabular-nums">
                    {p.count}
                  </span>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/[0.08]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        priorityAccent[p.priority] || 'bg-accent',
                      )}
                      style={{ width: `${Math.max(p.count > 0 ? 15 : 0, barWidth)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
