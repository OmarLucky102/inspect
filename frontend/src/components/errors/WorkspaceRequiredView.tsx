import { useState } from 'react';
import { useNavigate, useInRouterContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bank as BankIcon,
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  House,
  CheckCircle,
  BuildingOffice,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { RobotForbidden403 } from './RobotForbidden403';

export interface WorkspaceRequiredViewProps {
  featureName?: string;
  featureNameAr?: string;
  backUrl?: string;
  backLabel?: string;
  className?: string;
}

type SafeNavigateFn = (to: string | number) => void;

const fallbackNavigate: SafeNavigateFn = (to) => {
  if (typeof to === 'number') {
    window.history.go(to);
  } else {
    window.location.href = to;
  }
};

function WorkspaceRequiredViewWithRouter(props: WorkspaceRequiredViewProps) {
  const routerNavigate = useNavigate();
  return (
    <WorkspaceRequiredViewInner
      {...props}
      navigate={(to) => {
        if (typeof to === 'number') {
          routerNavigate(to);
        } else {
          routerNavigate(to);
        }
      }}
    />
  );
}

export function WorkspaceRequiredView(props: WorkspaceRequiredViewProps) {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <WorkspaceRequiredViewWithRouter {...props} />;
  }
  return <WorkspaceRequiredViewInner {...props} navigate={fallbackNavigate} />;
}

function WorkspaceRequiredViewInner({
  featureName = 'inspection requests',
  featureNameAr = 'طلبات الفحص',
  backUrl,
  backLabel,
  className = '',
  navigate,
}: WorkspaceRequiredViewProps & { navigate: SafeNavigateFn }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.toLowerCase().startsWith('ar');
  const { banks, user, setActiveBankId, refreshUser } = useWorkspace();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const hasNoBanksAssigned = banks.length === 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (hasNoBanksAssigned) {
    return (
      <div
        className={`relative flex min-h-[460px] w-full flex-col items-center justify-center rounded-3xl border border-hairline bg-white/80 p-8 text-center backdrop-blur-sm sm:p-12 ${className}`}
      >
        {/* Status Badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-rose-500/10 px-3.5 py-1 font-mono text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
          <span className="size-2 rounded-full bg-rose-500" />
          <span>
            {isArabic
              ? 'الصلاحية مقيدة • يلزم عضوية مساحة عمل'
              : 'ACCESS RESTRICTED • WORKSPACE MEMBERSHIP REQUIRED'}
          </span>
        </div>

        {/* Visual Forbidden Robot */}
        <RobotForbidden403 className="mb-6" />

        {/* Title */}
        <h2 className="max-w-xl text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {isArabic
            ? 'لم يتم تعيين أي مساحة عمل بنكية لحسابك'
            : 'No Bank Workspace Assigned'}
        </h2>

        {/* Detailed Explanation */}
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-mute">
          {isArabic ? (
            <>
              حسابك المسجل (
              <span className="font-mono font-medium text-ink" dir="ltr">
                {user?.email || 'حسابك'}
              </span>
              ) غير معيّن في أي مساحة عمل بنكية حالياً. لعرض أو إدارة{' '}
              {featureNameAr}، يجب منح حسابك عضوية في مساحة عمل بنك أو جهة.
              <br />
              <strong className="text-ink font-semibold">
                يرجى التواصل مع مسؤول النظام أو مدير المؤسسة لمنحك صلاحية الوصول.
              </strong>
            </>
          ) : (
            <>
              Your account (
              <span className="font-mono font-medium text-ink" dir="ltr">
                {user?.email || 'your account'}
              </span>
              ) is currently not assigned to any bank workspace. To view or
              manage {featureName}, your account must be granted membership to
              at least one organization.
              <br />
              <strong className="text-ink font-semibold">
                Please contact your system administrator or organization manager to grant you access.
              </strong>
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="cursor-pointer gap-2 px-4 shadow-sm"
          >
            <ArrowClockwise
              className={`size-4 ${isRefreshing ? 'animate-spin text-accent' : ''}`}
            />
            <span>
              {isRefreshing
                ? isArabic
                  ? 'جاري التحقق...'
                  : 'Checking Access...'
                : isArabic
                  ? 'التحقق من الصلاحيات مجدداً'
                  : 'Check Access Again'}
            </span>
          </Button>

          {isSuperAdmin && (
            <Button
              variant="primary"
              onClick={() => navigate('/banks')}
              className="cursor-pointer gap-2 px-4 shadow-sm"
            >
              <BankIcon className="size-4" />
              <span>
                {isArabic ? 'إدارة مساحات عمل البنوك' : 'Manage Bank Workspaces'}
              </span>
            </Button>
          )}

          {backUrl ? (
            <Button
              variant="outline"
              onClick={() => navigate(backUrl)}
              className="cursor-pointer gap-2 px-4"
            >
              <BackIcon className="size-4" />
              <span>{backLabel || (isArabic ? 'رجوع' : 'Go Back')}</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="cursor-pointer gap-2 px-4 text-ink-mute hover:text-ink"
            >
              <House className="size-4" />
              <span>{t('errors.backToDashboard', 'Dashboard')}</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Case 2: User HAS available bank workspaces, but none is actively chosen
  return (
    <div
      className={`relative flex min-h-[460px] w-full flex-col items-center justify-center rounded-3xl border border-hairline bg-white/80 p-8 text-center backdrop-blur-sm sm:p-12 ${className}`}
    >
      {/* Status Badge */}
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-amber-500/10 px-3.5 py-1 font-mono text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
        <span className="size-2 rounded-full bg-amber-500" />
        <span>
          {isArabic
            ? 'إجراء مطلوب • اختر مساحة عمل'
            : 'ACTION REQUIRED • SELECT WORKSPACE'}
        </span>
      </div>

      {/* Visual Icon */}
      <div className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 shadow-xs">
        <BuildingOffice className="size-10" />
      </div>

      {/* Title */}
      <h2 className="max-w-xl text-xl font-bold tracking-tight text-ink sm:text-2xl">
        {isArabic ? 'يرجى اختيار مساحة عمل بنك' : 'Select a Bank Workspace'}
      </h2>

      {/* Message */}
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-mute">
        {isArabic ? (
          <>
            لديك حق الوصول إلى ({banks.length}) مساحة عمل بنكية. يرجى اختيار
            مساحة العمل المطلوبة من القائمة العلوية أو اختيار إحداها مباشرة
            أدناه لعرض {featureNameAr}.
          </>
        ) : (
          <>
            You have access to {banks.length} bank workspace(s). Please choose
            an active workspace from the top navigation dropdown or select one
            directly below to view {featureName}.
          </>
        )}
      </p>

      {/* Quick-Pick Workspace Buttons */}
      <div className="mt-6 flex max-w-lg flex-wrap items-center justify-center gap-2.5">
        {banks.map((bank) => (
          <button
            key={bank.id}
            type="button"
            onClick={() => setActiveBankId(bank.id)}
            className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-hairline bg-white px-4 py-2.5 text-xs font-medium text-ink shadow-2xs transition-all duration-150 hover:border-accent hover:bg-accent/5 hover:text-accent hover:shadow-xs active:scale-[0.98]"
          >
            <BankIcon className="size-4 text-ink-mute transition-colors group-hover:text-accent" />
            <span className="font-semibold">{bank.name}</span>
            {bank.code && (
              <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-mute group-hover:bg-accent/10 group-hover:text-accent">
                {bank.code}
              </span>
            )}
            <CheckCircle className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 text-accent" />
          </button>
        ))}
      </div>

      {/* Additional Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-hairline pt-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="cursor-pointer gap-2 px-4 text-ink-mute hover:text-ink text-xs"
        >
          <House className="size-4" />
          <span>{t('errors.backToDashboard', 'Dashboard')}</span>
        </Button>
      </div>
    </div>
  );
}

