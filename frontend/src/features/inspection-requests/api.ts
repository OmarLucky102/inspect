import { api } from '@/lib/api'

export interface VehicleDto {
  make: string
  model: string
  year: number
  vin?: string
  licensePlate?: string
  colorId?: string
  categoryId?: string
  fuelTypeId?: string
  odometer?: number
}

export interface CustomerDto {
  fullName: string
  phone: string
  email?: string
  nationalId?: string
}

export interface LocationDto {
  address?: string
  governorateId?: string
  cityId?: string
}

export interface CreateInspectionRequestDto {
  customer: CustomerDto
  location?: LocationDto
  requestedCompletionDate?: string
  notes?: string
  vehicle?: any
}

export interface SubmitInspectionRequestDto {
  vehicle?: any
}

export interface InspectionRequest {
  id: string
  requestNumber: string
  bankId: string
  vehicleId: string | null
  customerId: string
  currentStatus: string
  priority: string
  address: string | null
  requestedCompletionDate: string | null
  requestedAt: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

function normalizeInspectionRequest(raw: any): InspectionRequest {
  const item = raw?.props ?? raw ?? {}
  return {
    id: item.id,
    requestNumber: item.requestNumber,
    bankId: item.bankId,
    vehicleId: item.vehicleId ?? null,
    customerId: item.customerId,
    currentStatus: item.currentStatus,
    priority: item.priority,
    address: item.address ?? null,
    requestedCompletionDate: item.requestedCompletionDate ?? null,
    requestedAt: item.requestedAt,
    notes: item.notes ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export async function fetchInspectionRequests(bankId: string): Promise<InspectionRequest[]> {
  const res = await api.get<{ status: string; data: unknown[] }>(`/banks/${bankId}/inspection-requests`)
  const rawList: any[] = (res.data as any).data ?? res.data ?? []
  return rawList.map(normalizeInspectionRequest)
}

export async function fetchInspectionRequestById(bankId: string, id: string): Promise<InspectionRequest> {
  const res = await api.get<{ status: string; data: unknown }>(`/banks/${bankId}/inspection-requests/${id}`)
  return normalizeInspectionRequest((res.data as any).data ?? res.data)
}

export async function createInspectionRequest(bankId: string, data: CreateInspectionRequestDto): Promise<InspectionRequest> {
  const res = await api.post<{ status: string; data: unknown }>(`/banks/${bankId}/inspection-requests`, data)
  return normalizeInspectionRequest((res.data as any).data ?? res.data)
}

export async function submitInspectionRequest(bankId: string, id: string, data: SubmitInspectionRequestDto): Promise<InspectionRequest> {
  const res = await api.post<{ status: string; data: unknown }>(`/banks/${bankId}/inspection-requests/${id}/submit`, data)
  return normalizeInspectionRequest((res.data as any).data ?? res.data)
}
