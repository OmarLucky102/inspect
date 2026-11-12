import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, House, CircleNotch } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { fetchInspectionRequestDetails } from '@/features/inspection-requests/api';
import { RequestDetailModal } from '@/features/inspection-requests/components/RequestDetailModal';
import { ErrorView } from '@/components/errors/ErrorView';
import { WorkspaceRequiredView } from '@/components/errors/WorkspaceRequiredView';
import { parseApiError } from '@/lib/errors/app-error';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function RequestDetailPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, banks, activeBankId, setActiveBankId } = useWorkspace();

  const bankIdFromUrl = searchParams.get('bankId');

  const isGlobalStaff =
    user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';
  const canViewRequests =
    isGlobalStaff ||
    user?.role === 'MANAGER' ||
    user?.role === 'REVIEWER' ||
    user?.role === 'REPRESENTATIVE';

  const hasBankFromUrlAccess =
    !bankIdFromUrl ||
    isGlobalStaff ||
    banks.some((b) => b.id === bankIdFromUrl);

  // Sync URL ?bankId=... only when the user actually has access to that bank
  useEffect(() => {
    if (bankIdFromUrl && hasBankFromUrlAccess && bankIdFromUrl !== activeBankId) {
      setActiveBankId(bankIdFromUrl);
    }
  }, [bankIdFromUrl, hasBankFromUrlAccess, activeBankId, setActiveBankId]);

  // 1. Role permission check FIRST (before validating request ID format)
  if (user && !canViewRequests) {
    return (
      <div className="py-8">
        <ErrorView
          status={403}
          title={t('errors.forbiddenTitle', 'Access Restricted')}
          message={
            isArabic
              ? 'ليس لديك صلاحية لعرض تفاصيل طلب الفحص.'
              : 'You do not have permission to view inspection request details.'
          }
          backUrl="/"
          backLabel={t('errors.backToDashboard', 'Back to Dashboard')}
        />
      </div>
    );
  }

  // 2. Bank workspace access check BEFORE validating UUID format (so hitting /requests/2342 without bank access shows 403 / workspace required instead of 404)
  if (!isGlobalStaff && banks.length === 0) {
    return (
      <div className="py-8">
        <WorkspaceRequiredView
          featureName="this inspection request"
          featureNameAr="طلب الفحص هذا"
          backUrl="/"
          backLabel={t('errors.backToDashboard', 'Back to Dashboard')}
        />
      </div>
    );
  }

  // 3. Explicit unauthorized ?bankId=... query param check
  if (bankIdFromUrl && !hasBankFromUrlAccess) {
    return (
      <div className="py-8">
        <ErrorView
          status={403}
          title={t('errors.forbiddenTitle', 'Access Restricted')}
          message={
            isArabic
              ? 'ليس لديك صلاحية للوصول إلى طلبات الفحص في مساحة عمل هذا البنك.'
              : 'You do not have permission to access inspection requests in the requested bank workspace.'
          }
          backUrl="/requests"
          backLabel={t('errors.backToRequests', 'Back to Inspection Pipeline')}
        />
      </div>
    );
  }

  const effectiveBankId = bankIdFromUrl || activeBankId;

  // 4. Missing active bank workspace selection (e.g. fresh global setup with zero banks)
  if (!effectiveBankId) {
    return (
      <div className="py-8">
        <WorkspaceRequiredView
          featureName="this inspection request"
          featureNameAr="طلب الفحص هذا"
          backUrl="/"
          backLabel={t('errors.backToDashboard', 'Back to Dashboard')}
        />
      </div>
    );
  }

  // 5. Validate request ID presence & UUID format ONLY after authorization & bank checks pass
  const isValidUuid = id ? UUID_REGEX.test(id) : false;
  if (!id || !isValidUuid) {
    return (
      <div className="py-8">
        <ErrorView
          status={404}
          title={isArabic ? 'طلب الفحص غير موجود' : 'Inspection Request Not Found'}
          message={
            isArabic
              ? `لم يتم العثور على طلب فحص بالمعرّف (${id || '—'}) في مساحة العمل الحالية.`
              : `The inspection request with ID "${id || '—'}" does not exist in the selected bank workspace or has been removed.`
          }
          backUrl="/requests"
          backLabel={t('errors.backToRequests', 'Back to Inspection Pipeline')}
        />
      </div>
    );
  }

  return <RequestDetailContent id={id} effectiveBankId={effectiveBankId} />;
}

function RequestDetailContent({
  id,
  effectiveBankId,
}: {
  id: string;
  effectiveBankId: string;
}) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const navigate = useNavigate();
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  // Pre-validate that this inspection request exists before mounting the workspace shell
  const {
    data: inspection,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inspection-request-details', effectiveBankId, id],
    queryFn: () => fetchInspectionRequestDetails(effectiveBankId, id),
    enabled: !!effectiveBankId && !!id,
  });

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-4 pb-12 animate-in fade-in-0 duration-200">
        <div className="flex h-12 w-full items-center justify-between rounded-2xl border border-hairline bg-white px-5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 animate-pulse rounded bg-paper" />
            <span className="text-ink-mute/50">/</span>
            <div className="h-4 w-28 animate-pulse rounded bg-paper" />
            <span className="text-ink-mute/50">/</span>
            <div className="h-4 w-32 animate-pulse rounded bg-paper" />
          </div>
        </div>

        <div className="flex min-h-[460px] flex-col items-center justify-center rounded-3xl border border-hairline bg-white/70 p-12 text-center shadow-xs">
          <CircleNotch className="size-10 animate-spin text-accent mb-4" />
          <p className="text-sm font-medium text-ink">
            {isArabic ? 'جاري التحقق من تفاصيل طلب الفحص...' : 'Loading inspection request details...'}
          </p>
          <p className="mt-1 text-xs text-ink-mute font-mono" dir="ltr">{id}</p>
        </div>
      </div>
    );
  }

  // If inspection request is forbidden, not found, or fails to load, render clean ErrorView without fake header
  if (isError || !inspection) {
    const parsed = error ? parseApiError(error) : null;
    const isNotFound = !error || parsed?.status === 404;

    return (
      <div className="py-8">
        <ErrorView
          error={error}
          status={isNotFound ? 404 : undefined}
          title={
            isNotFound
              ? (isArabic ? 'طلب الفحص غير موجود' : 'Inspection Request Not Found')
              : undefined
          }
          message={
            isNotFound
              ? (isArabic
                  ? `لم يتم العثور على طلب فحص بالمعرّف (${id}) في مساحة العمل الحالية.`
                  : `The inspection request with ID "${id}" does not exist in the selected bank workspace or has been removed.`)
              : undefined
          }
          backUrl="/requests"
          backLabel={t('errors.backToRequests', 'Back to Inspection Pipeline')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  // Inspection Request Exists and is Valid
  return (
    <div className="space-y-4 pb-12 animate-in fade-in-0 duration-200">
      {/* Top Breadcrumb & Popout Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-white px-5 py-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-ink-mute hover:text-ink transition-colors cursor-pointer"
          >
            <House className="size-3.5" />
            <span>{t('nav.dashboard', 'Dashboard')}</span>
          </button>
          <span className="text-ink-mute/50">/</span>
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="text-ink-mute hover:text-ink transition-colors cursor-pointer"
          >
            {t('nav.requests', 'Inspection Requests')}
          </button>
          <span className="text-ink-mute/50">/</span>
          <span className="font-mono font-semibold text-ink" dir="ltr">
            {inspection.requestNumber || id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/requests')}
            className="h-8 px-2.5 text-xs text-ink-soft hover:text-ink cursor-pointer gap-1.5"
          >
            <BackIcon className="size-3.5" />
            <span>{t('requests.allRequests', 'All Requests')}</span>
          </Button>
        </div>
      </div>

      {/* Main Request Workspace (Dedicated Full-Page Mode) */}
      <RequestDetailModal
        requestId={id}
        bankId={effectiveBankId}
        mode="fullpage"
        onClose={() => navigate('/requests')}
      />
    </div>
  );
}
