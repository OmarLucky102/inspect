import {
  ClipboardText,
  CircleNotch,
  Plus,
  FunnelSimple,
  Clock,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchInspectionRequests } from '@/features/inspection-requests/api';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorView } from '@/components/errors/ErrorView';
import { WorkspaceRequiredView } from '@/components/errors/WorkspaceRequiredView';

export function RequestsPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const { activeBankId, banks, user } = useWorkspace();
  const navigate = useNavigate();
  const [reviewerQueueFilter, setReviewerQueueFilter] = useState<
    'ALL' | 'INITIAL' | 'MEDIA' | 'AWAITING_APPROVAL' | 'DONE'
  >('ALL');

  const isGlobalStaff =
    user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';
  const canViewRequests =
    isGlobalStaff ||
    user?.role === 'MANAGER' ||
    user?.role === 'REVIEWER' ||
    user?.role === 'REPRESENTATIVE';

  function getStatusBadge(status: string) {
    if (status === 'COMPLETED') {
      return (
        <Badge variant="amber" dot>
          <Clock className="size-3" />
          {t('requests.awaitingApprovalBadge', 'AWAITING APPROVAL')}
        </Badge>
      );
    }

    const variants: Record<string, BadgeProps['variant']> = {
      DRAFT: 'neutral',
      PENDING: 'amber',
      PENDING_ASSIGNMENT: 'cyan',
      ASSIGNED: 'sky',
      IN_PROGRESS: 'indigo',
      UNDER_REVIEW: 'purple',
      APPROVED: 'emerald',
      REJECTED: 'rose',
      CANCELLED: 'neutral',
    };
    return (
      <Badge variant={variants[status] || 'default'} dot>
        {t(`statuses.${status.toLowerCase()}`, status)}
      </Badge>
    );
  }

  const isReviewer = user?.role === 'REVIEWER';
  const canCreateRequest =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'MANAGER';

  // Build query key and status param based on role and active queue filter
  let statusParam: string | undefined = undefined;
  if (isReviewer) {
    if (reviewerQueueFilter === 'INITIAL') statusParam = 'PENDING';
    else if (reviewerQueueFilter === 'MEDIA') statusParam = 'UNDER_REVIEW';
    else if (reviewerQueueFilter === 'AWAITING_APPROVAL')
      statusParam = 'COMPLETED';
    else if (reviewerQueueFilter === 'DONE')
      statusParam = 'APPROVED,REJECTED,CANCELLED';
    else statusParam = undefined;
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inspection-requests', activeBankId, statusParam],
    queryFn: () => fetchInspectionRequests(activeBankId!, statusParam),
    enabled: !!activeBankId && canViewRequests,
  });

  if (user && !canViewRequests) {
    return (
      <div className="py-8">
        <ErrorView
          status={403}
          title={t('errors.forbiddenTitle', 'Access Restricted')}
          message={
            isArabic
              ? 'ليس لديك صلاحية لعرض طلبات الفحص.'
              : 'You do not have permission to view inspection requests.'
          }
          backUrl="/"
          backLabel={t('errors.backToDashboard', 'Back to Dashboard')}
        />
      </div>
    );
  }

  if (!activeBankId || (!isGlobalStaff && banks.length === 0)) {
    return (
      <div className="py-8">
        <WorkspaceRequiredView
          featureName="inspection requests"
          featureNameAr="طلبات الفحص"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <CircleNotch className="size-8 animate-spin text-ink-mute" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8">
        <ErrorView
          error={error}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const reviewerQueueLabel =
    reviewerQueueFilter === 'ALL'
      ? t('requests.allRequests', 'All Requests')
      : reviewerQueueFilter === 'INITIAL'
        ? t('requests.queueInitial', 'Initial Review')
        : reviewerQueueFilter === 'MEDIA'
          ? t('requests.queueMedia', 'Media Review')
          : reviewerQueueFilter === 'AWAITING_APPROVAL'
            ? t('requests.queueAwaitingApproval', 'Awaiting Approval')
            : t('requests.queueDone', 'History');

  const reviewerFilterOptions: Array<{
    key: 'ALL' | 'INITIAL' | 'MEDIA' | 'AWAITING_APPROVAL' | 'DONE';
    label: string;
  }> = [
    { key: 'ALL', label: t('requests.allRequests', 'All Requests') },
    { key: 'INITIAL', label: t('requests.queueInitial', 'Initial Review') },
    { key: 'MEDIA', label: t('requests.queueMedia', 'Media Review') },
    {
      key: 'AWAITING_APPROVAL',
      label: t('requests.queueAwaitingApproval', 'Awaiting Approval'),
    },
    { key: 'DONE', label: t('requests.queueDone', 'History') },
  ];

  const headerActions = isReviewer ? (
    <div className="glass-subtle flex flex-wrap items-center gap-1 rounded-xl p-1 text-xs font-medium">
      {reviewerFilterOptions.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => setReviewerQueueFilter(opt.key)}
          className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
            reviewerQueueFilter === opt.key
              ? 'bg-white dark:bg-white/15 font-semibold text-accent shadow-2xs'
              : 'text-ink-mute hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ) : canCreateRequest ? (
    <Button
      size="sm"
      onClick={() => navigate('/requests/new')}
      className="h-9 rounded-xl px-3.5 cursor-pointer"
    >
      <Plus className="me-1.5 size-4" /> {t('requests.newRequest', 'New Request')}
    </Button>
  ) : null;

  const pageHeader = (
    <PageHeader
      kicker={t('titles.requestsMeta', 'INSPECTION · PIPELINE')}
      kickerIcon={ClipboardText}
      badges={
        isReviewer ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-accent">
            <FunnelSimple className="size-3" />
            {reviewerQueueLabel}
          </span>
        ) : undefined
      }
      title={
        isReviewer
          ? t('requests.title', 'Reviewer Workflow Queues')
          : t('requests.title', 'Inspection Requests')
      }
      subtitle={
        isReviewer
          ? t(
              'requests.subtitle',
              'Initial intake reviews (Stage 2) & media evaluations (Stage 4)',
            )
          : t(
              'requests.subtitle',
              'Create and manage vehicle inspection requests for your bank.',
            )
      }
      actions={headerActions}
    />
  );

  if (!data || data.length === 0) {
    if (isReviewer) {
      return (
        <div className="space-y-6">
          {pageHeader}

          <Card variant="glass" className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardText className="size-12 text-ink-mute" />
            <h3 className="mt-3 text-base font-bold text-ink">
              {t('requests.noRequestsFound', 'No inspection requests found.')}
            </h3>
            <p className="mt-1 text-xs text-ink-mute max-w-sm">
              {t('dashboard.noRequestsPeriod', 'There are currently no inspection requests matching this review queue filter.')}
            </p>
          </Card>
        </div>
      );
    }

    return (
      <ModuleEmptyState
        kicker="CORE WORKFLOW"
        title={t('requests.title', 'Inspection Requests')}
        body={t('requests.subtitle', 'Create and manage vehicle inspection requests for your bank.')}
        icon={ClipboardText}
        actionLabel={canCreateRequest ? t('requests.newRequest', 'New Request') : undefined}
        onAction={canCreateRequest ? () => navigate('/requests/new') : undefined}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {pageHeader}

      <Card variant="glass" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline/70 bg-paper/35 dark:bg-white/[0.02] px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">
            {isReviewer ? reviewerQueueLabel : t('requests.allRequests', 'All Requests')}
          </h2>
          <Badge variant="default">
            {data.length} {t('common.total', 'TOTAL')}
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-6">{t('requests.thRequestNumber', 'Request Number')}</TableHead>
              <TableHead className="px-6">{t('requests.thLocation', 'Location')}</TableHead>
              <TableHead className="px-6">{t('requests.thStatus', 'Status')}</TableHead>
              <TableHead className="px-6">{t('requests.thPriority', 'Priority')}</TableHead>
              <TableHead className="px-6">{t('requests.thDate', 'Created Date')}</TableHead>
              <TableHead className="px-6 text-end">{t('requests.thActions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow
                key={r.id}
                onClick={() =>
                  navigate(
                    `/requests/${r.id}?bankId=${r.bankId || activeBankId || ''}`,
                  )
                }
                className="cursor-pointer"
              >
                <TableCell className="px-6 font-mono text-xs font-semibold text-accent hover:underline">
                  {r.requestNumber}
                </TableCell>
                <TableCell className="px-6 text-xs text-ink-soft">
                  {r.address || '—'}
                </TableCell>
                <TableCell className="px-6">
                  {getStatusBadge(r.currentStatus)}
                </TableCell>
                <TableCell className="px-6 font-mono text-xs text-ink-mute">
                  {t(`priorities.${r.priority.toLowerCase()}`, r.priority)}
                </TableCell>
                <TableCell className="px-6 font-mono text-xs text-ink-mute">
                  {new Date(r.createdAt).toLocaleDateString(
                    isArabic ? 'ar-EG-u-nu-latn' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    },
                  )}
                </TableCell>
                <TableCell className="px-6 text-end">
                  <div className="flex items-center justify-end gap-2">
                    {r.currentStatus === 'DRAFT' && canCreateRequest && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/requests/new?requestId=${r.id}`);
                        }}
                        className="h-7 px-2.5 text-xs text-accent border-accent/30 hover:bg-accent/10"
                      >
                        {t('createRequest.continueToVehicle', 'Continue Intake')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/requests/${r.id}?bankId=${r.bankId || activeBankId || ''}`,
                        );
                      }}
                      className="h-7 px-3 text-xs font-medium text-ink"
                    >
                      {t('common.details', 'Details')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
