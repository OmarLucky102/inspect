import { api } from '@/lib/api'
import type { UserProfile } from '../workspaces/api'

export async function fetchUsers(): Promise<UserProfile[]> {
  const res = await api.get<{ status: string; data: UserProfile[] }>('/users')
  // The backend currently returns the array directly in the previous snippet, 
  // but let's handle both in case it's wrapped in `data` or returned directly.
  return Array.isArray(res.data) ? res.data : res.data.data
}

export async function fetchUserById(id: string): Promise<UserProfile> {
  const res = await api.get<{ status: string; data: UserProfile }>(`/users/${id}`)
  return (res.data as any).data || res.data
}
