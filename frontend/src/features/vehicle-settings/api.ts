import { api } from '@/lib/api';

export interface VehicleModelAdmin {
  id: string;
  brandId: string;
  name: string;
  _count?: {
    vehicles: number;
  };
}

export interface VehicleBrandAdmin {
  id: string;
  name: string;
  code: string | null;
  createdAt: string;
  updatedAt: string;
  models: VehicleModelAdmin[];
  _count: {
    models: number;
    vehicles: number;
  };
}

export interface VehicleColorAdmin {
  id: string;
  name: string;
  nameAr: string | null;
  hex: string | null;
  isActive: boolean;
  _count: {
    vehicles: number;
  };
}

export interface VehicleTrimAdmin {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    vehicles: number;
    originalTrimRequests: number;
  };
}

export interface VehicleCategoryAdmin {
  id: string;
  name: string;
  nameAr: string | null;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    vehicles: number;
    checklists: number;
  };
}

export interface SunroofTypeAdmin {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
}

export interface VehicleAdminOverview {
  totalBrands: number;
  totalModels: number;
  totalColors: number;
  totalTrims?: number;
  totalCategories?: number;
  totalSunroofTypes?: number;
  totalVehicles: number;
}

export interface CreateBrandPayload {
  name: string;
  code?: string;
  models?: string[];
}

export interface UpdateBrandPayload {
  name?: string;
  code?: string;
}

export interface CreateModelPayload {
  name: string;
  brandId?: string;
}

export interface UpdateModelPayload {
  name: string;
}

export interface CreateColorPayload {
  name: string;
  nameAr?: string;
  hex?: string;
  isActive?: boolean;
}

export interface UpdateColorPayload {
  name?: string;
  nameAr?: string;
  hex?: string;
  isActive?: boolean;
}

// ─── Overview ────────────────────────────────────────────────────────────────
export async function fetchVehicleOverview(): Promise<VehicleAdminOverview> {
  const res = await api.get<{ status: string; data: VehicleAdminOverview }>(
    '/vehicles/admin/overview',
  );
  return (res.data as any).data ?? res.data;
}

// ─── Brands (Makes) ──────────────────────────────────────────────────────────
export async function fetchVehicleBrandsAdmin(): Promise<VehicleBrandAdmin[]> {
  const res = await api.get<{ status: string; data: VehicleBrandAdmin[] }>(
    '/vehicles/admin/brands',
  );
  return (res.data as any).data ?? res.data ?? [];
}

export async function createVehicleBrand(
  payload: CreateBrandPayload,
): Promise<VehicleBrandAdmin> {
  const res = await api.post<{ status: string; data: VehicleBrandAdmin }>(
    '/vehicles/brands',
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function updateVehicleBrand(
  id: string,
  payload: UpdateBrandPayload,
): Promise<VehicleBrandAdmin> {
  const res = await api.patch<{ status: string; data: VehicleBrandAdmin }>(
    `/vehicles/brands/${id}`,
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function deleteVehicleBrand(id: string): Promise<void> {
  await api.delete(`/vehicles/brands/${id}`);
}

// ─── Models ──────────────────────────────────────────────────────────────────
export async function createVehicleModel(
  brandId: string,
  payload: CreateModelPayload,
): Promise<VehicleModelAdmin> {
  const res = await api.post<{ status: string; data: VehicleModelAdmin }>(
    `/vehicles/brands/${brandId}/models`,
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function updateVehicleModel(
  id: string,
  payload: UpdateModelPayload,
): Promise<VehicleModelAdmin> {
  const res = await api.patch<{ status: string; data: VehicleModelAdmin }>(
    `/vehicles/models/${id}`,
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function deleteVehicleModel(id: string): Promise<void> {
  await api.delete(`/vehicles/models/${id}`);
}

// ─── Colors ──────────────────────────────────────────────────────────────────
export async function fetchVehicleColorsAdmin(): Promise<VehicleColorAdmin[]> {
  const res = await api.get<{ status: string; data: VehicleColorAdmin[] }>(
    '/vehicles/admin/colors',
  );
  return (res.data as any).data ?? res.data ?? [];
}

export async function createVehicleColor(
  payload: CreateColorPayload,
): Promise<VehicleColorAdmin> {
  const res = await api.post<{ status: string; data: VehicleColorAdmin }>(
    '/vehicles/colors',
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function updateVehicleColor(
  id: string,
  payload: UpdateColorPayload,
): Promise<VehicleColorAdmin> {
  const res = await api.patch<{ status: string; data: VehicleColorAdmin }>(
    `/vehicles/colors/${id}`,
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function toggleVehicleColorStatus(
  id: string,
): Promise<VehicleColorAdmin> {
  const res = await api.patch<{ status: string; data: VehicleColorAdmin }>(
    `/vehicles/colors/${id}/toggle-status`,
  );
  return (res.data as any).data ?? res.data;
}

export async function deleteVehicleColor(id: string): Promise<void> {
  await api.delete(`/vehicles/colors/${id}`);
}

// ─── Trims ───────────────────────────────────────────────────────────────────
export interface CreateTrimPayload {
  name: string;
  nameAr?: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateTrimPayload {
  name?: string;
  nameAr?: string;
  code?: string;
  isActive?: boolean;
}

export async function fetchVehicleTrimsAdmin(): Promise<VehicleTrimAdmin[]> {
  const res = await api.get<{ status: string; data: VehicleTrimAdmin[] }>(
    '/vehicles/admin/trims',
  );
  return (res.data as any).data ?? res.data ?? [];
}

export async function createVehicleTrim(
  payload: CreateTrimPayload,
): Promise<VehicleTrimAdmin> {
  const res = await api.post<{ status: string; data: VehicleTrimAdmin }>(
    '/vehicles/trims',
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function updateVehicleTrim(
  id: string,
  payload: UpdateTrimPayload,
): Promise<VehicleTrimAdmin> {
  const res = await api.patch<{ status: string; data: VehicleTrimAdmin }>(
    `/vehicles/trims/${id}`,
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function toggleVehicleTrimStatus(
  id: string,
): Promise<VehicleTrimAdmin> {
  const res = await api.patch<{ status: string; data: VehicleTrimAdmin }>(
    `/vehicles/trims/${id}/toggle-status`,
  );
  return (res.data as any).data ?? res.data;
}

export async function deleteVehicleTrim(id: string): Promise<void> {
  await api.delete(`/vehicles/trims/${id}`);
}

// ─── Categories ──────────────────────────────────────────────────────────────
export interface CreateCategoryPayload {
  name: string;
  nameAr?: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  nameAr?: string;
  code?: string;
  isActive?: boolean;
}

export async function fetchVehicleCategoriesAdmin(): Promise<VehicleCategoryAdmin[]> {
  const res = await api.get<{ status: string; data: VehicleCategoryAdmin[] }>(
    '/vehicles/admin/categories',
  );
  return (res.data as any).data ?? res.data ?? [];
}

export async function createVehicleCategory(
  payload: CreateCategoryPayload,
): Promise<VehicleCategoryAdmin> {
  const res = await api.post<{ status: string; data: VehicleCategoryAdmin }>(
    '/vehicles/categories',
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function updateVehicleCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<VehicleCategoryAdmin> {
  const res = await api.patch<{ status: string; data: VehicleCategoryAdmin }>(
    `/vehicles/categories/${id}`,
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function toggleVehicleCategoryStatus(
  id: string,
): Promise<VehicleCategoryAdmin> {
  const res = await api.patch<{ status: string; data: VehicleCategoryAdmin }>(
    `/vehicles/categories/${id}/toggle-status`,
  );
  return (res.data as any).data ?? res.data;
}

export async function deleteVehicleCategory(id: string): Promise<void> {
  await api.delete(`/vehicles/categories/${id}`);
}

// ─── Sunroof Types ────────────────────────────────────────────────────────────
export interface CreateSunroofTypePayload {
  name: string;
  nameAr?: string;
  code?: string;
}

export interface UpdateSunroofTypePayload {
  name?: string;
  nameAr?: string;
  code?: string;
}

export async function fetchSunroofTypesAdmin(): Promise<SunroofTypeAdmin[]> {
  const res = await api.get<{ status: string; data: SunroofTypeAdmin[] }>(
    '/vehicles/admin/sunroof-types',
  );
  return (res.data as any).data ?? res.data ?? [];
}

export async function createSunroofType(
  payload: CreateSunroofTypePayload,
): Promise<SunroofTypeAdmin> {
  const res = await api.post<{ status: string; data: SunroofTypeAdmin }>(
    '/vehicles/sunroof-types',
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function updateSunroofType(
  id: string,
  payload: UpdateSunroofTypePayload,
): Promise<SunroofTypeAdmin> {
  const res = await api.patch<{ status: string; data: SunroofTypeAdmin }>(
    `/vehicles/sunroof-types/${id}`,
    payload,
  );
  return (res.data as any).data ?? res.data;
}

export async function deleteSunroofType(id: string): Promise<void> {
  await api.delete(`/vehicles/sunroof-types/${id}`);
}
