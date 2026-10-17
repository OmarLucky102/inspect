import { api } from '@/lib/api';

export interface LocationGovernorate {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  isActive: boolean;
  cities?: LocationCity[];
}

export interface LocationCity {
  id: string;
  governorateId: string;
  name: string;
  nameAr: string | null;
  isActive: boolean;
}

export interface RepresentativeUserLink {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
}

export interface Representative {
  id: string;
  representativeId: string;
  name: string;
  governorateId: string | null;
  cityId: string | null;
  branchName: string | null;
  locationName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  governorate?: {
    id: string;
    code: string;
    name: string;
    nameAr: string | null;
  } | null;
  city?: {
    id: string;
    name: string;
    nameAr: string | null;
  } | null;
  user?: RepresentativeUserLink | null;
}

export interface RepresentativeOverview {
  total: number;
  active: number;
  inactive: number;
  locationsCount: number;
}

export interface CreateRepresentativeDto {
  representativeId?: string;
  name: string;
  governorateId?: string;
  cityId?: string;
  branchName?: string;
  locationName?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  userId?: string;
}

export interface UpdateRepresentativeDto {
  representativeId?: string;
  name?: string;
  governorateId?: string | null;
  cityId?: string | null;
  branchName?: string | null;
  locationName?: string | null;
  phone?: string;
  email?: string;
  isActive?: boolean;
  userId?: string | null;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export async function fetchGovernorates(): Promise<LocationGovernorate[]> {
  const res = await api.get<{ status: string; data: LocationGovernorate[] }>(
    '/locations/governorates',
  );
  return (res.data as any).data ?? res.data ?? [];
}

export async function fetchRepresentatives(params?: {
  search?: string;
  isActive?: boolean;
  governorateId?: string;
  cityId?: string;
  locationName?: string;
}): Promise<Representative[]> {
  const res = await api.get<{ status: string; data: Representative[] }>(
    '/representatives',
    { params },
  );
  return (res.data as any).data ?? res.data ?? [];
}

export async function fetchRepresentativeOverview(): Promise<RepresentativeOverview> {
  const res = await api.get<{ status: string; data: RepresentativeOverview }>(
    '/representatives/overview',
  );
  return (res.data as any).data ?? res.data;
}

export async function fetchNextRepresentativeId(
  governorateId?: string,
): Promise<string> {
  const res = await api.get<{
    status: string;
    data: { nextId: string };
  }>('/representatives/next-id', {
    params: governorateId ? { governorateId } : undefined,
  });
  const d = (res.data as any).data ?? res.data;
  return d.nextId ?? 'REP-001';
}

export async function fetchRepresentativeById(id: string): Promise<Representative> {
  const res = await api.get<{ status: string; data: Representative }>(
    `/representatives/${id}`,
  );
  return (res.data as any).data ?? res.data;
}

export async function createRepresentative(
  dto: CreateRepresentativeDto,
): Promise<Representative> {
  const res = await api.post<{ status: string; data: Representative }>(
    '/representatives',
    dto,
  );
  return (res.data as any).data ?? res.data;
}

export async function updateRepresentative(
  id: string,
  dto: UpdateRepresentativeDto,
): Promise<Representative> {
  const res = await api.patch<{ status: string; data: Representative }>(
    `/representatives/${id}`,
    dto,
  );
  return (res.data as any).data ?? res.data;
}

export async function toggleRepresentativeStatus(
  id: string,
): Promise<Representative> {
  const res = await api.patch<{ status: string; data: Representative }>(
    `/representatives/${id}/toggle-status`,
  );
  return (res.data as any).data ?? res.data;
}

export async function deleteRepresentative(id: string): Promise<void> {
  await api.delete(`/representatives/${id}`);
}
