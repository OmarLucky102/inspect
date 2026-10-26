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
import { useQueryClient } from '@tanstack/react-query';
import {
  getAccessToken,
  setAccessToken,
  AUTH_SESSION_EXPIRED_EVENT,
} from '@/lib/api';
import {
  broadcastAuthEvent,
  subscribeToAuthEvents,
  AUTH_SYNC_EVENTS,
} from '@/lib/auth-channel';
import { loginRequest, logoutRequest, refreshRequest } from './api';

export type AuthStatus =
  | 'pending'
  | 'authenticated'
  | 'unauthenticated'
  | 'unavailable';

export interface AuthContextValue {
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>(() => {
    return getAccessToken() ? 'authenticated' : 'pending';
  });

  const retry = useCallback(() => {
    setStatus('pending');
    refreshRequest()
      .then((token) => {
        setAccessToken(token);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (
          axios.isCancel(error) ||
          (error as { code?: string })?.code === 'ERR_CANCELED'
        ) {
          return;
        }

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setAccessToken(null);
          setStatus('unauthenticated');
        } else {
          setStatus('unavailable');
        }
      });
  }, []);

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

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setAccessToken(null);
          setStatus('unauthenticated');
        } else {
          setStatus('unavailable');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for session expiry from API interceptor
  useEffect(() => {
    const onSessionExpired = () => {
      setAccessToken(null);
      queryClient.clear();
      setStatus('unauthenticated');
      broadcastAuthEvent(AUTH_SYNC_EVENTS.SESSION_EXPIRED);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, [queryClient]);

  // Synchronize authentication changes across other tabs
  useEffect(() => {
    const unsubscribe = subscribeToAuthEvents((event) => {
      switch (event.type) {
        case AUTH_SYNC_EVENTS.LOGOUT:
        case AUTH_SYNC_EVENTS.SESSION_EXPIRED:
          setAccessToken(null);
          queryClient.clear();
          setStatus('unauthenticated');
          break;
        case AUTH_SYNC_EVENTS.LOGIN:
          setStatus((current) => {
            if (current !== 'authenticated') {
              retry();
            }
            return current;
          });
          break;
      }
    });

    return unsubscribe;
  }, [queryClient, retry]);

  const login = useCallback(async (email: string, password: string) => {
    const token = await loginRequest(email, password);
    setAccessToken(token);
    setStatus('authenticated');
    broadcastAuthEvent(AUTH_SYNC_EVENTS.LOGIN);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      queryClient.clear();
      setStatus('unauthenticated');
      broadcastAuthEvent(AUTH_SYNC_EVENTS.LOGOUT);
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, login, logout, retry }),
    [status, login, logout, retry],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
