import { api, setAccessToken } from '@/lib/api'

export interface LoginResponse {
  status: string
  data: { accessToken: string }
}

/** POST /auth/login — sets the httpOnly refresh cookie, returns access token. */
export async function loginRequest(
  email: string,
  password: string,
): Promise<string> {
  const res = await api.post<LoginResponse>('/auth/login', { email, password })
  return res.data.data.accessToken
}

/** POST /auth/refresh — rotates via httpOnly cookie, no body. */
export async function refreshRequest(): Promise<string> {
  const res = await api.post<LoginResponse>('/auth/refresh')
  return res.data.data.accessToken
}

/** POST /auth/logout — revokes + clears the cookie (best effort). */
export async function logoutRequest(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    setAccessToken(null)
  }
}
