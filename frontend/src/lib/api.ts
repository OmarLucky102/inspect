import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

// ---------------------------------------------------------------------------
// Token storage: access token lives in memory only. The refresh token is an
// httpOnly cookie (path /) managed by the API, so JS never sees it.
// On reload we re-hydrate by calling POST /auth/refresh with credentials.
// ---------------------------------------------------------------------------

let accessToken: string | null = null
let refreshInFlight: Promise<string> | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

const baseURL = import.meta.env.VITE_API_URL ?? '/api/v1'

export const api: AxiosInstance = axios.create({
  baseURL,
  // Required: refresh_token cookie is httpOnly + credentials-gated.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  // When transmitting FormData, remove the default application/json header so the
  // browser/Axios can automatically compute 'multipart/form-data; boundary=...'
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }
  return config
})

export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired'

export async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = api
      .post<{ status: string; data: { accessToken: string } }>(
        '/auth/refresh',
      )
      .then((res) => {
        const token = res.data.data.accessToken
        setAccessToken(token)
        return token
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setAccessToken(null)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
          }
        }
        throw err
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

const isNoRetryUrl = (url?: string): boolean => {
  if (!url) return false
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  )
}

// Single-flight 401 recovery: try rotation once, then replay the request.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & {
      _retried?: boolean
    }) | undefined

    if (
      !error.response ||
      error.response.status !== 401 ||
      !original ||
      original._retried ||
      isNoRetryUrl(original.url)
    ) {
      throw error
    }

    original._retried = true
    try {
      const token = await refreshAccessToken()
      original.headers.set('Authorization', `Bearer ${token}`)
      return api(original)
    } catch (refreshError) {
      if (
        axios.isAxiosError(refreshError) &&
        refreshError.response?.status === 401
      ) {
        setAccessToken(null)
      }
      throw refreshError
    }
  },
)

import { parseApiError } from './errors/app-error'

/** Extract a human message from the API error envelope with full Arabic localization support. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return parseApiError(error, fallback).message
}

