import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { getAccessToken, setAccessToken } from '@/lib/api';
import { loginRequest, logoutRequest, refreshRequest } from './api';

export type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => {
    return getAccessToken() ? 'authenticated' : 'pending';
  });

  // On page reload, restore in-memory access token from the httpOnly refresh cookie.
  useEffect(() => {
    if (getAccessToken()) {
      setStatus('authenticated');
      return;
    }

    let mounted = true;
    refreshRequest()
      .then((token) => {
        if (!mounted) return;
        setAccessToken(token);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (!mounted) return;
        // Rapid reloads abort in-flight requests (ERR_CANCELED). Don't treat an abort as logout.
        if (
          axios.isCancel(error) ||
          (error as { code?: string })?.code === 'ERR_CANCELED'
        ) {
          return;
        }
        setAccessToken(null);
        setStatus('unauthenticated');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const token = await loginRequest(email, password);
    setAccessToken(token);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ status, login, logout }),
    [status, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
