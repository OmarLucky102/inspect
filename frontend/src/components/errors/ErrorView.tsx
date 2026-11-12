import { useState } from 'react';
import { useNavigate, useInRouterContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MagnifyingGlass,
  ShieldWarning,
  SignIn,
  WifiSlash,
  WarningOctagon,
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  House,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { parseApiError, type AppError } from '@/lib/errors/app-error';
import { getCdnAsset } from '@/lib/assets';
import { LockUnauthorized401 } from './LockUnauthorized401';
import { RobotForbidden403 } from './RobotForbidden403';
import { ValidationConflictSvg } from './ValidationConflictSvg';

export interface ErrorViewProps {
  status?: number;
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  onSignIn?: () => void;
  backUrl?: string;
  backLabel?: string;
  compact?: boolean;
  showHomeButton?: boolean;
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

function ErrorViewWithRouter(props: ErrorViewProps) {
  const routerNavigate = useNavigate();
  return (
    <ErrorViewInner
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

export function ErrorView(props: ErrorViewProps) {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <ErrorViewWithRouter {...props} />;
  }
  return <ErrorViewInner {...props} navigate={fallbackNavigate} />;
}

function ErrorViewInner({
  status: explicitStatus,
  title: explicitTitle,
  message: explicitMessage,
  error,
  onRetry,
  onSignIn,
  backUrl,
  backLabel,
  compact = false,
  showHomeButton = true,
  className = '',
  navigate,
}: ErrorViewProps & { navigate: SafeNavigateFn }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.toLowerCase().startsWith('ar');
  const [showDetails, setShowDetails] = useState(false);

  // Normalize error if provided
  const parsed: AppError | null = error ? parseApiError(error) : null;
  const status = explicitStatus ?? parsed?.status ?? 500;
  const title: string = explicitTitle
    ? String(explicitTitle)
    : parsed?.title || getDefaultTitle(status, (k, d) => String(t(k, d)));
  const message: string = explicitMessage
    ? String(explicitMessage)
    : parsed?.message || getDefaultDesc(status, (k, d) => String(t(k, d)));

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const isDev = import.meta.env.DEV;

  const config = getStatusVisuals(status);
  const StatusIcon = config.icon;
  const isValidationOrConflict = status === 400 || status === 409 || status === 422;
  const validationItems = parsed?.validationItems;

  if (compact) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-hairline bg-paper/50 p-6 text-center ${className}`}
      >
        {status === 404 ? (
          <img
            src={getCdnAsset('404.gif')}
            alt="404 Not Found"
            className="mb-3 h-28 sm:h-36 w-auto rounded-xl object-contain drop-shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : status === 403 ? (
          <RobotForbidden403 compact className="mb-3" />
        ) : status === 401 ? (
          <LockUnauthorized401 compact className="mb-3" />
        ) : status === 400 || status === 409 || status === 422 ? (
          <ValidationConflictSvg status={status} compact className="mb-3" />
        ) : (
          <div
            className={`mb-3 flex size-12 items-center justify-center rounded-xl ${config.bg} ${config.color}`}
          >
            <StatusIcon className="size-6" />
          </div>
        )}
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        <p className="mt-1 max-w-sm text-xs text-ink-mute">{message}</p>
        {(onRetry || status === 401) && (
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            {status === 401 && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => (onSignIn ? onSignIn() : navigate('/login'))}
                className="h-8 cursor-pointer gap-1.5 text-xs"
              >
                <SignIn className="size-3.5" />
                <span>{String(t('errors.signInAgain', 'Sign In Again'))}</span>
              </Button>
            )}
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="h-8 cursor-pointer gap-1.5 text-xs"
              >
                <ArrowClockwise className="size-3.5" />
                <span>{String(t('errors.retry', 'Try Again'))}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-[420px] w-full flex-col items-center justify-center rounded-3xl border border-hairline bg-white/80 p-8 text-center backdrop-blur-sm sm:p-12 ${className}`}
    >
      {/* Status Badge */}
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-paper px-3 py-1 font-mono text-[11px] font-semibold text-ink-mute uppercase tracking-wider">
        <span className={`size-2 rounded-full ${config.dot}`} />
        <span dir="ltr">
          {status === 0 ? 'OFFLINE' : `HTTP ${status} • ${config.badgeLabel}`}
        </span>
      </div>

      {/* Main Status Visual: 404 GIF | 403 Interactive Robot | Standard Icon */}
      {status === 404 ? (
        <div className="mb-8 flex flex-col items-center justify-center w-full">
          <img
            src={getCdnAsset('404.gif')}
            alt="404 Not Found"
            className="w-full max-w-[360px] sm:max-w-[500px] md:max-w-[580px] h-auto max-h-[380px] sm:max-h-[460px] rounded-3xl object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div
            style={{ display: 'none' }}
            className={`size-20 items-center justify-center rounded-3xl shadow-xs ${config.bg} ${config.color}`}
          >
            <StatusIcon className="size-10" />
          </div>
        </div>
      ) : status === 403 ? (
        <div className="mb-8 flex flex-col items-center justify-center w-full">
          <RobotForbidden403 />
        </div>
      ) : status === 401 ? (
        <div className="mb-8 flex flex-col items-center justify-center w-full">
          <LockUnauthorized401 />
        </div>
      ) : status === 400 || status === 409 || status === 422 ? (
        <div className="mb-8 flex flex-col items-center justify-center w-full">
          <ValidationConflictSvg status={status} />
        </div>
      ) : (
        <div
          className={`mb-5 flex size-20 items-center justify-center rounded-3xl shadow-xs transition-transform duration-300 hover:scale-105 ${config.bg} ${config.color}`}
        >
          <StatusIcon className="size-10" />
        </div>
      )}

      {/* Title & Description */}
      <h2 className="max-w-xl text-xl font-bold tracking-tight text-ink sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-mute">
        {message}
      </p>

      {/* Structured validation items list for 400 / 409 / 422 responses */}
      {isValidationOrConflict && validationItems && validationItems.length > 1 && (
        <ul className="mt-4 w-full max-w-md space-y-1.5 rounded-2xl border border-hairline bg-paper/70 p-3.5 text-start text-xs text-ink-soft">
          {validationItems.map((item, idx) => (
            <li key={`${idx}-${item}`} className="flex items-start gap-2">
              <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${config.dot}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {status === 401 && (
          <Button
            variant="primary"
            onClick={() => (onSignIn ? onSignIn() : navigate('/login'))}
            className="cursor-pointer gap-2 px-5 shadow-sm"
          >
            <SignIn className="size-4" />
            <span>{String(t('errors.signInAgain', 'Sign In Again'))}</span>
          </Button>
        )}

        {onRetry && (
          <Button
            variant={status === 401 ? 'outline' : 'primary'}
            onClick={onRetry}
            className="cursor-pointer gap-2 px-4 shadow-sm"
          >
            <ArrowClockwise className="size-4" />
            <span>{String(t('errors.retry', 'Try Again'))}</span>
          </Button>
        )}

        {backUrl ? (
          <Button
            variant="outline"
            onClick={() => navigate(backUrl)}
            className="cursor-pointer gap-2 px-4"
          >
            <BackIcon className="size-4" />
            <span>{backLabel || String(t('errors.goBack', 'Go Back'))}</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="cursor-pointer gap-2 px-4"
          >
            <BackIcon className="size-4" />
            <span>{backLabel || String(t('errors.goBack', 'Go Back'))}</span>
          </Button>
        )}

        {showHomeButton && status !== 401 && (
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="cursor-pointer gap-2 px-4 text-ink-mute hover:text-ink"
          >
            <House className="size-4" />
            <span>{String(t('errors.backToDashboard', 'Dashboard'))}</span>
          </Button>
        )}
      </div>

      {/* Technical Details (Expandable in Dev or when parsed error details exist) */}
      {(isDev || Boolean(parsed?.details)) && Boolean(error) && (
        <div
          className="mt-8 w-full max-w-lg border-t border-hairline pt-4 text-left"
          dir="ltr"
        >
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between text-xs font-medium text-ink-mute hover:text-ink cursor-pointer"
          >
            <span>Technical diagnostics</span>
            {showDetails ? (
              <CaretUp className="size-3.5" />
            ) : (
              <CaretDown className="size-3.5" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2.5 rounded-xl border border-hairline bg-slate-950 p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto shadow-inner">
              <div className="text-rose-400 font-semibold mb-1">
                {parsed?.name}: {parsed?.message}
              </div>
              {parsed?.code && (
                <div className="text-slate-400">Code: {parsed.code}</div>
              )}
              {parsed?.status && (
                <div className="text-slate-400">Status: {parsed.status}</div>
              )}
              {parsed?.rawError instanceof Error && parsed.rawError.stack && (
                <pre className="mt-2 text-[10px] text-slate-500 whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {parsed.rawError.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getDefaultTitle(
  status: number,
  t: (key: string, fallback: string) => string,
): string {
  switch (status) {
    case 404:
      return t('errors.notFoundTitle', 'Page or Resource Not Found');
    case 403:
      return t('errors.forbiddenTitle', 'Access Restricted');
    case 401:
      return t('errors.unauthorizedTitle', 'Session Expired');
    case 400:
      return t('errors.badRequestTitle', 'Invalid Request');
    case 422:
      return t('errors.validationTitle', 'Validation Failed');
    case 409:
      return t('errors.conflictTitle', 'Data Conflict Detected');
    case 0:
      return t('errors.networkTitle', 'Connection Lost');
    case 500:
    default:
      return t('errors.serverErrorTitle', 'Something Went Wrong');
  }
}

function getDefaultDesc(
  status: number,
  t: (key: string, fallback: string) => string,
): string {
  switch (status) {
    case 404:
      return t(
        'errors.notFoundDesc',
        'The page or resource you are looking for does not exist or has been moved.',
      );
    case 403:
      return t(
        'errors.forbiddenDesc',
        'You do not have permission to view or manage this resource.',
      );
    case 401:
      return t('errors.unauthorizedDesc', 'Please sign in again to continue.');
    case 400:
      return t(
        'errors.badRequestDesc',
        'The submitted parameters or payload were invalid or malformed. Please review your input and try again.',
      );
    case 422:
      return t(
        'errors.validationDesc',
        'Some submitted fields failed validation checks. Please correct the highlighted values and try again.',
      );
    case 409:
      return t(
        'errors.conflictDesc',
        'This action conflicts with an existing record or current workflow state. Refresh and review before retrying.',
      );
    case 0:
      return t(
        'errors.networkDesc',
        'Unable to reach the server. Please check your internet connection.',
      );
    case 500:
    default:
      return t(
        'errors.serverErrorDesc',
        'An unexpected server error occurred. Please try again later.',
      );
  }
}

function getStatusVisuals(status: number) {
  switch (status) {
    case 404:
      return {
        badgeLabel: 'NOT FOUND',
        icon: MagnifyingGlass,
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        color: 'text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-500',
      };
    case 403:
      return {
        badgeLabel: 'FORBIDDEN',
        icon: ShieldWarning,
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        color: 'text-rose-600 dark:text-rose-400',
        dot: 'bg-rose-500',
      };
    case 401:
      return {
        badgeLabel: 'UNAUTHORIZED',
        icon: SignIn,
        bg: 'bg-sky-500/10 dark:bg-sky-500/20',
        color: 'text-sky-600 dark:text-sky-400',
        dot: 'bg-sky-500',
      };
    case 400:
      return {
        badgeLabel: 'BAD REQUEST',
        icon: WarningOctagon,
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        color: 'text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-500',
      };
    case 422:
      return {
        badgeLabel: 'VALIDATION ERROR',
        icon: WarningOctagon,
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        color: 'text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-500',
      };
    case 409:
      return {
        badgeLabel: 'CONFLICT',
        icon: WarningOctagon,
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        color: 'text-rose-600 dark:text-rose-400',
        dot: 'bg-rose-500',
      };
    case 0:
      return {
        badgeLabel: 'NO CONNECTION',
        icon: WifiSlash,
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        color: 'text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-500',
      };
    case 500:
    default:
      return {
        badgeLabel: 'SERVER ERROR',
        icon: WarningOctagon,
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        color: 'text-rose-600 dark:text-rose-400',
        dot: 'bg-rose-500',
      };
  }
}
