import { api, getAccessToken } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
}

export async function fetchCurrentWorkspaceUser(): Promise<UserProfile> {
  const token = getAccessToken();
  if (!token) throw new Error('No token');

  const payload = parseJwt(token);
  if (!payload || !payload.sub) throw new Error('Invalid token');

  const res = await api.get<{ status: string; data: UserProfile }>(
    `/users/${payload.sub}`,
  );
  return (res.data as any).data || res.data;
}

export interface WorkspaceBank {
  id: string;
  name: string;
  code: string;
}

export async function fetchMyBanks(): Promise<WorkspaceBank[]> {
  const res = await api.get<{ status: string; data: WorkspaceBank[] }>(
    '/banks/my-banks',
  );
  return (res.data as any).data || res.data;
}
