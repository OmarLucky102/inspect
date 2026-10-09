import { api } from '@/lib/api'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export async function fetchCurrentWorkspaceUser(): Promise<UserProfile> {
  const res = await api.get<{ status: string; data: UserProfile }>('/users/me')
  return res.data.data
}

export interface WorkspaceBank {
  id: string
  name: string
  code: string
}

export async function fetchMyBanks(): Promise<WorkspaceBank[]> {
  const res = await api.get<{ status: string; data: WorkspaceBank[] }>('/users/me/banks')
  return res.data.data
}
