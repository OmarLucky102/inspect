import { Navigate, useLocation } from 'react-router-dom'
import type { JSX } from 'react'
import { useAuth } from '@/features/auth/auth-context'

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
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'pending') return <AuthSkeleton />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
