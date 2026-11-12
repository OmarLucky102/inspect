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
        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-amber-800">
          <Clock className="size-3 text-amber-700" />
          {t('requests.awaitingApprovalBadge', 'AWAITING APPROVAL')}
        </span>
      );
    }

    const styles: Record<string, string> = {
      DRAFT: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      PENDING: 'bg-amber-500/10 text-amber-800 border-amber-300',
      PENDING_ASSIGNMENT: 'bg-cyan-500/10 text-cyan-800 border-cyan-300',
      ASSIGNED: 'bg-sky-500/10 text-sky-800 border-sky-300',
      IN_PROGRESS: 'bg-indigo-500/10 text-indigo-800 border-indigo-300',
      UNDER_REVIEW: 'bg-purple-500/10 text-purple-800 border-purple-300',
      APPROVED: 'bg-emerald-500/10 text-emerald-800 border-emerald-300',
      REJECTED: 'bg-rose-500/10 text-rose-800 border-rose-300',
      CANCELLED: 'bg-zinc-200 text-zinc-600 border-zinc-300',
    };
    return (
      <span
        className={`inline-flex items-center rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider ${
          styles[status] || 'bg-bone text-ink-soft border-hairline'
        }`}
      >
        {t(`statuses.${status.toLowerCase()}`, status)}
      </span>
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
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-hairline bg-paper p-1 text-xs font-medium">
      {reviewerFilterOptions.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => setReviewerQueueFilter(opt.key)}
          className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${
            reviewerQueueFilter === opt.key
              ? 'bg-white font-semibold text-accent shadow-xs'
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

          <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-white py-16 text-center shadow-xs">
            <ClipboardText className="size-12 text-ink-mute" />
            <h3 className="mt-3 text-base font-bold text-ink">
              {t('requests.noRequestsFound', 'No inspection requests found.')}
            </h3>
            <p className="mt-1 text-xs text-ink-mute max-w-sm">
              {t('dashboard.noRequestsPeriod', 'There are currently no inspection requests matching this review queue filter.')}
            </p>
          </div>
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
    <div className="space-y-6">
      {pageHeader}

      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-hairline bg-paper/40 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">
            {isReviewer ? reviewerQueueLabel : t('requests.allRequests', 'All Requests')}
          </h2>
          <span className="rounded-lg bg-bone px-2.5 py-1 font-mono text-xs text-ink-mute">
            {data.length} {t('common.total', 'TOTAL')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-hairline bg-bone font-mono text-[11px] tracking-wider text-ink-mute uppercase">
              <tr>
                <th className="px-6 py-3">{t('requests.thRequestNumber', 'Request Number')}</th>
                <th className="px-6 py-3">{t('requests.thLocation', 'Location')}</th>
                <th className="px-6 py-3">{t('requests.thStatus', 'Status')}</th>
                <th className="px-6 py-3">{t('requests.thPriority', 'Priority')}</th>
                <th className="px-6 py-3">{t('requests.thDate', 'Created Date')}</th>
                <th className="px-6 py-3 text-right">{t('requests.thActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.map((r) => (
                <tr
                  key={r.id}
                  onClick={() =>
                    navigate(
                      `/requests/${r.id}?bankId=${r.bankId || activeBankId || ''}`,
                    )
                  }
                  className="cursor-pointer transition-colors hover:bg-paper/40"
                >
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-accent hover:underline">
                    {r.requestNumber}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-ink-soft">
                    {r.address || '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    {getStatusBadge(r.currentStatus)}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-ink-mute">
                    {t(`priorities.${r.priority.toLowerCase()}`, r.priority)}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-ink-mute">
                    {new Date(r.createdAt).toLocaleDateString(
                      isArabic ? 'ar-EG-u-nu-latn' : 'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      },
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
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
                        className="h-7 px-3 text-xs font-medium text-ink hover:bg-paper"
                      >
                        {t('common.details', 'Details')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
