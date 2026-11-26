import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, GitBranch } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NumberTicker } from '@/components/ui/number-ticker'
import type { InspectionAnalyticsData } from '@/features/inspection-requests/api'
import { cn } from '@/lib/cn'

interface OperationalPipelineFlowProps {
  overview?: InspectionAnalyticsData['overview']
  isLoading: boolean
}

export function OperationalPipelineFlow({
  overview,
  isLoading,
}: OperationalPipelineFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const stages = [
    {
      key: 'intake',
      step: '01',
      title: t('dashboard.stage1Title', '1. Intake & Drafts'),
      desc: t('dashboard.stage1Desc', 'New intake requests created & pending dispatch'),
      count: overview?.pendingInitialApproval ?? 0,
      accentText: 'text-amber-700 dark:text-amber-300',
      dotBg: 'bg-amber-500',
      barBg: 'from-amber-500 to-amber-400',
      ringGlow: 'hover:border-amber-500/40',
      pulse: true,
    },
    {
      key: 'triage',
      step: '02',
      title: t('dashboard.stage2Title', '2. Reviewer Triage'),
      desc: t('dashboard.stage2Desc', 'Initial validation & audit by inspection reviewers'),
      count: overview?.pendingAssignment ?? 0,
      accentText: 'text-sky-700 dark:text-sky-300',
      dotBg: 'bg-sky-500',
      barBg: 'from-sky-500 to-cyan-400',
      ringGlow: 'hover:border-sky-500/40',
      pulse: false,
    },
    {
      key: 'field',
      step: '03',
      title: t('dashboard.stage3Title', '3. Field Agent Dispatch'),
      desc: t('dashboard.stage3Desc', 'Assigned to field representatives on mobile apps'),
      count: overview?.inField ?? 0,
      accentText: 'text-purple-700 dark:text-purple-300',
      dotBg: 'bg-purple-500',
      barBg: 'from-purple-500 to-indigo-400',
      ringGlow: 'hover:border-purple-500/40',
      pulse: false,
    },
    {
      key: 'review',
      step: '04',
      title: t('dashboard.stage4Title', '4. Inspection & Submission'),
      desc: t('dashboard.stage4Desc', 'Field photos captured, checklists completed & submitted'),
      count: overview?.underValuationReview ?? 0,
      accentText: 'text-cyan-700 dark:text-cyan-300',
      dotBg: 'bg-cyan-500',
      barBg: 'from-cyan-500 to-teal-400',
      ringGlow: 'hover:border-cyan-500/40',
      pulse: false,
    },
    {
      key: 'approved',
      step: '05',
      title: t('dashboard.stage5Title', '5. Final Review & Approval'),
      desc: t('dashboard.stage5Desc', 'Audit approved and inspection certificate finalized'),
      count: overview?.approved ?? 0,
      accentText: 'text-emerald-700 dark:text-emerald-300',
      dotBg: 'bg-emerald-500',
      barBg: 'from-emerald-500 to-teal-400',
      ringGlow: 'hover:border-emerald-500/40',
      pulse: false,
    },
  ]

  const totalFlow = Math.max(
    1,
    stages.reduce((acc, s) => acc + s.count, 0),
  )

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
            <GitBranch className="size-4" weight="duotone" />
          </span>
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-ink">
              {t('dashboard.pipelineTitle', 'Operational Pipeline Velocity')}
            </CardTitle>
            <CardDescription className="text-[11px]">
              {t(
                'dashboard.pipelineSubtitle',
                'End-to-end lifecycle throughput across 5 core stages',
              )}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <Badge variant="default" dot>
            {overview?.activePipeline ?? 0} {t('dashboard.kpiActive', 'active')}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-1 pb-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stages.map((stage, idx) => {
            const sharePct = Math.round((stage.count / totalFlow) * 100)
            return (
              <div key={stage.key} className="relative flex items-stretch">
                <button
                  type="button"
                  onClick={() => navigate('/requests')}
                  className={cn(
                    'glass-subtle group flex w-full cursor-pointer flex-col justify-between rounded-2xl p-4 text-start transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    stage.ringGlow,
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('text-[11px] font-semibold', stage.accentText)}>
                        {stage.title}
                      </span>
                      <span className="relative flex size-2 shrink-0" aria-hidden>
                        {stage.pulse && stage.count > 0 && (
                          <span
                            className={cn(
                              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                              stage.dotBg,
                            )}
                          />
                        )}
                        <span
                          className={cn('relative inline-flex size-2 rounded-full', stage.dotBg)}
                        />
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      <span className="font-mono text-2xl font-extrabold tracking-tight text-ink tabular-nums">
                        {isLoading ? '—' : <NumberTicker value={stage.count} />}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-ink-mute">
                        {isLoading ? '' : `${sharePct}%`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/[0.08]">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-700',
                          stage.barBg,
                        )}
                        style={{ width: `${Math.max(stage.count > 0 ? 8 : 0, sharePct)}%` }}
                      />
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-relaxed text-ink-mute">
                      {stage.desc}
                    </p>
                  </div>
                </button>

                {idx < stages.length - 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none hidden lg:flex items-center justify-center -mx-1.5 z-10 text-ink-mute/50"
                  >
                    <ArrowRight className="size-3.5 rtl:rotate-180" weight="bold" />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
