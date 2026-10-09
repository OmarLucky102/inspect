import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

// ---------------------------------------------------------------------------
// Token storage: access token lives in memory only. The refresh token is an
// httpOnly cookie (path /api/v1/auth) managed by the API, so JS never sees it.
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

const baseURL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

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
  return config
})

async function refreshAccessToken(): Promise<string> {
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
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

const NO_RETRY = new Set(['/auth/login', '/auth/refresh', '/auth/logout'])

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
      (original.url && NO_RETRY.has(original.url))
    ) {
      throw error
    }

    original._retried = true
    try {
      const token = await refreshAccessToken()
      original.headers.set('Authorization', `Bearer ${token}`)
      return api(original)
    } catch (refreshError) {
      setAccessToken(null)
      throw refreshError
    }
  },
)

/** Extract a human message from the API error envelope. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined
    if (Array.isArray(data?.message)) return data.message.join('. ')
    if (typeof data?.message === 'string') return data.message
    if (!error.response) return 'Cannot reach the server. Check your connection.'
  }
  return fallback
}
