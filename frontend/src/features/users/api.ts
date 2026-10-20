import { api } from '@/lib/api'
import type { UserProfile } from '../workspaces/api'

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string
}

export async function fetchMyProfile(): Promise<UserProfile> {
  const res = await api.get<{ status: string; data: UserProfile }>('/users/me')
  return (res.data as any).data || res.data
}

export async function updateMyProfile(
  data: UpdateProfileInput,
): Promise<UserProfile> {
  const res = await api.patch<{ status: string; data: UserProfile }>(
    '/users/me',
    data,
  )
  return (res.data as any).data || res.data
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const res = await api.get<{ status: string; data: UserProfile[] }>('/users')
  return Array.isArray(res.data) ? res.data : (res.data as any).data || res.data
}

export async function fetchUserById(id: string): Promise<UserProfile> {
  const res = await api.get<{ status: string; data: UserProfile }>(`/users/${id}`)
  return (res.data as any).data || res.data
}

