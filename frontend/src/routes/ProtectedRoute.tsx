import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/auth-context';
import { Button } from '@/components/ui/button';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import { ErrorPage } from './ErrorPage';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status, retry, sessionExpired, clearSessionExpired } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (status === 'pending') return <AppShellSkeleton />;
  if (status === 'unauthenticated') {
    if (sessionExpired) {
      return (
        <ErrorPage
          status={401}
          standalone
          onRetry={retry}
          onSignIn={() => {
            clearSessionExpired();
            void navigate('/login', { replace: true, state: { from: location } });
          }}
        />
      );
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (status === 'unavailable') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-bone text-center">
        <div className="w-full max-w-md rounded-2xl border border-hairline bg-white p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-ink">
            {t(
              'common.serviceUnavailableTitle',
              'Service Temporarily Unavailable',
            )}
          </h2>
          <p className="text-sm text-ink-soft">
            {t(
              'common.serviceUnavailableDesc',
              'Unable to connect to the authentication service. Please check your network connection and try again.',
            )}
          </p>
          <Button onClick={retry} variant="primary" className="w-full">
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }
  return children;
}
