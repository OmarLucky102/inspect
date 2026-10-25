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

export async function updateUserBanks(
  userId: string,
  bankIds: string[],
  primaryBankId?: string,
): Promise<UserProfile['banks']> {
  const res = await api.put<{ status: string; data: any }>(`/users/${userId}/banks`, {
    bankIds,
    primaryBankId,
  })
  return (res.data as any).data || res.data
}

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: string
}

export async function createUser(data: CreateUserInput): Promise<UserProfile> {
  const res = await api.post<{ status: string; data: UserProfile }>('/users', data)
  return (res.data as any).data || res.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}

export async function activateUser(id: string): Promise<UserProfile> {
  const res = await api.patch<{ status: string; data: UserProfile }>(`/users/${id}/activate`)
  return (res.data as any).data || res.data
}

export async function deactivateUser(id: string): Promise<UserProfile> {
  const res = await api.patch<{ status: string; data: UserProfile }>(`/users/${id}/deactivate`)
  return (res.data as any).data || res.data
}


