import { Navigate, useLocation } from 'react-router-dom'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/button'

/** Skeleton loader matching the login layout (no generic spinner). */
function AuthSkeleton() {
  return (
    <div
      className="grid min-h-[100dvh] animate-pulse bg-bone lg:grid-cols-[1.05fr_1fr]"
      aria-label="Loading session"
      role="status"
    >
      <div className="hidden bg-ink/90 lg:block" />
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-[400px] space-y-4">
          <div className="h-3 w-28 rounded bg-ink/10" />
          <div className="h-9 w-56 rounded bg-ink/10" />
          <div className="h-11 rounded-xl bg-ink/10" />
          <div className="h-11 rounded-xl bg-ink/10" />
          <div className="h-12 rounded-xl bg-ink/10" />
        </div>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status, retry } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (status === 'pending') return <AuthSkeleton />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (status === 'unavailable') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-bone text-center">
        <div className="w-full max-w-md rounded-2xl border border-hairline bg-white p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-ink">
            {t('common.serviceUnavailableTitle', 'Service Temporarily Unavailable')}
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
    )
  }
  return children
}
