import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setAccessToken } from '@/lib/api'
import { loginRequest, logoutRequest, refreshRequest } from './api'

export type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('pending')

  // Re-hydrate the in-memory access token from the httpOnly cookie.
  useEffect(() => {
    let cancelled = false
    refreshRequest()
      .then((token) => {
        if (cancelled) return
        setAccessToken(token)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        setAccessToken(null)
        setStatus('unauthenticated')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const token = await loginRequest(email, password)
    setAccessToken(token)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ status, login, logout }),
    [status, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
