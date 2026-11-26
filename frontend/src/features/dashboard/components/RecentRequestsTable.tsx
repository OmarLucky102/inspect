import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bank, Eye, MagnifyingGlass, X } from '@phosphor-icons/react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import type { InspectionAnalyticsData } from '@/features/inspection-requests/api'
import { cn } from '@/lib/cn'

interface RecentRequestsTableProps {
  recentRequests?: InspectionAnalyticsData['recentRequests']
  isGlobal: boolean
  isLoading: boolean
  isArabic: boolean
  queryBankId?: string
  activeBankId?: string | null
}

function getStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'APPROVED':
      return 'emerald'
    case 'COMPLETED':
    case 'PENDING':
      return 'amber'
    case 'REJECTED':
    case 'CANCELLED':
      return 'rose'
    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return 'purple'
    case 'UNDER_REVIEW':
    case 'PENDING_ASSIGNMENT':
      return 'cyan'
    default:
      return 'neutral'
  }
}

export function RecentRequestsTable({
  recentRequests,
  isGlobal,
  isLoading,
  isArabic,
  queryBankId,
  activeBankId,
}: RecentRequestsTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'ACTIVE' | 'APPROVED'>('ALL')

  const filteredRows = useMemo(() => {
    if (!recentRequests) return []
    const q = searchTerm.trim().toLowerCase()
    return recentRequests.filter((req) => {
      if (quickFilter === 'APPROVED' && req.status !== 'APPROVED') return false
      if (
        quickFilter === 'ACTIVE' &&
        ['APPROVED', 'REJECTED', 'CANCELLED'].includes(req.status)
      ) {
        return false
      }
      if (!q) return true
      return (
        req.requestNumber.toLowerCase().includes(q) ||
        req.vehicleDescription.toLowerCase().includes(q) ||
        req.customerName.toLowerCase().includes(q) ||
        (req.bankName && req.bankName.toLowerCase().includes(q))
      )
    })
  }, [recentRequests, searchTerm, quickFilter])

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 border-b border-hairline/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>
            {t('dashboard.recentRequests', 'Recent Inspection Requests')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.recentSubtitle', 'Real-time feed of submitted and ongoing inspections.')}
          </CardDescription>
        </div>

        <CardAction className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute start-2.5 top-2.5 size-3.5 text-ink-mute" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('dashboard.searchRecent', 'Filter requests...')}
              className="glass-subtle h-8.5 w-44 rounded-xl ps-8 pe-7 text-xs text-ink outline-none placeholder:text-ink-mute/70 focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-52"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label={t('common.clear', 'Clear')}
                className="absolute end-2 top-2.5 cursor-pointer text-ink-mute hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Filter */}
          <div className="glass-subtle inline-flex items-center rounded-xl p-0.5 text-[11px] font-medium">
            {(
              [
                { key: 'ALL', label: t('common.all', 'All') },
                { key: 'ACTIVE', label: t('dashboard.kpiActive', 'Active') },
                { key: 'APPROVED', label: t('statuses.approved', 'Approved') },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setQuickFilter(opt.key)}
                className={cn(
                  'cursor-pointer rounded-lg px-2.5 py-1 transition-all',
                  quickFilter === opt.key
                    ? 'bg-white dark:bg-white/15 font-semibold text-ink shadow-2xs'
                    : 'text-ink-mute hover:text-ink',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/requests')}
            className="h-8.5 rounded-xl px-3 text-xs font-semibold text-accent hover:text-accent"
          >
            <span>{t('dashboard.viewAllRequests', 'View All Requests')}</span>
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('dashboard.thRequestNumber', 'Request #')}</TableHead>
              <TableHead>{t('dashboard.thVehicle', 'Vehicle')}</TableHead>
              <TableHead>{t('dashboard.thCustomer', 'Customer')}</TableHead>
              {isGlobal && (
                <TableHead>{t('titles.banks', 'Partner Bank')}</TableHead>
              )}
              <TableHead>{t('dashboard.thStatus', 'Status')}</TableHead>
              <TableHead>{t('dashboard.thCreated', 'Submitted At')}</TableHead>
              <TableHead className="text-end">{t('dashboard.thActions', 'Action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  {isGlobal && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                  <TableCell><Skeleton className="h-5 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-end"><Skeleton className="ms-auto h-7 w-16 rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : filteredRows.length > 0 ? (
              filteredRows.map((req) => (
                <TableRow
                  key={req.id}
                  onClick={() =>
                    navigate(
                      `/requests/${req.id}?bankId=${req.bankId || queryBankId || activeBankId || ''}`,
                    )
                  }
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs font-bold text-accent">
                    {req.requestNumber}
                  </TableCell>
                  <TableCell className="font-medium text-ink">
                    {req.vehicleDescription === 'Vehicle info pending' ||
                    req.vehicleDescription === 'Vehicle'
                      ? isArabic
                        ? 'بيانات المركبة قيد الإدخال'
                        : 'Vehicle info pending'
                      : req.vehicleDescription}
                  </TableCell>
                  <TableCell className="text-xs text-ink-soft">
                    {req.customerName === 'N/A' || !req.customerName
                      ? isArabic
                        ? 'غير محدد'
                        : 'N/A'
                      : req.customerName}
                  </TableCell>
                  {isGlobal && (
                    <TableCell>
                      <Badge variant="default" className="gap-1 font-medium normal-case">
                        <Bank className="size-3 text-ink-mute" />
                        {req.bankName}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={getStatusVariant(req.status)} dot>
                      {req.status === 'COMPLETED'
                        ? t('requests.awaitingApprovalBadge', 'AWAITING APPROVAL')
                        : t(`statuses.${req.status.toLowerCase()}`, req.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-ink-mute">
                    {new Date(req.requestedAt).toLocaleDateString(
                      isArabic ? 'ar-EG-u-nu-latn' : 'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(
                          `/requests/${req.id}?bankId=${req.bankId || queryBankId || activeBankId || ''}`,
                        )
                      }}
                      className="h-7.5 rounded-lg px-2.5 text-[11px]"
                    >
                      <Eye className="size-3.5" />
                      <span>{t('common.details', 'Details')}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isGlobal ? 7 : 6}
                  className="py-10 text-center text-xs text-ink-mute"
                >
                  {t('dashboard.noRequestsPeriod', 'No inspection requests found in database.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
