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

export interface City {
  id: string
  governorateId: string
  name: string
  nameAr?: string | null
  isActive: boolean
}

export interface Governorate {
  id: string
  code: string
  name: string
  nameAr?: string | null
  isActive: boolean
  cities?: City[]
}

export async function fetchGovernorates(): Promise<Governorate[]> {
  const res = await api.get<{ status: string; data: Governorate[] }>('/locations/governorates')
  return (res.data as any).data ?? res.data ?? []
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

export interface InspectionRequestDetail {
  id: string
  requestNumber: string
  bankId: string
  currentStatus: string
  priority: string
  requestedAt: string
  requestedCompletionDate: string | null
  assignedAt: string | null
  completedAt: string | null
  notes: string | null
  assignedRepresentativeId: string | null
  assignedReviewerId: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    fullName: string
    nationalId: string | null
    phone: string
    email: string | null
  } | null
  location: {
    governorateId: string | null
    governorateName: string | null
    cityId: string | null
    cityName: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
  }
  vehicle: {
    id: string
    vin: string
    plateNumber: string | null
    manufactureYear: number
    mileage: number | null
    engineNumber: string
    engineCc: number | null
    power: number | null
    insuranceValue: number | null
    registrationDate: string | null
    brand: { id: string; name: string } | null
    model: { id: string; name: string } | null
    category: { id: string; name: string } | null
    color: { id: string; name: string } | null
    fuelType: { id: string; name: string } | null
    transmissionType: { id: string; name: string } | null
    trim: { id: string; name: string } | null
  } | null
  assignedRepresentative: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    email: string
  } | null
  activeAssignment: {
    id: string
    status: string
    assignedAt: string
    acceptedAt: string | null
    rejectedAt: string | null
    rejectedReason: string | null
  } | null
  checklistItems: Array<{
    id: string
    checklistItemId: string
    code: string
    label: string
    inputType: string
    isMandatory: boolean
    value: string | null
    notes: string | null
    completed: boolean
    completedAt: string | null
  }>
}

export interface StatusHistoryChanger {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface InspectionStatusHistoryItem {
  id: string
  inspectionRequestId: string
  fromStatus: string | null
  toStatus: string
  changedBy: StatusHistoryChanger | string
  note: string | null
  changedAt: string
}

export async function fetchInspectionRequestDetails(
  bankId: string,
  id: string,
): Promise<InspectionRequestDetail> {
  const res = await api.get<{ status: string; data: InspectionRequestDetail }>(
    `/banks/${bankId}/inspection-requests/${id}`,
  )
  return (res.data as any).data ?? res.data
}

export async function updateInspectionStatus(
  bankId: string,
  id: string,
  data: { status: string; note?: string },
): Promise<InspectionRequestDetail> {
  const res = await api.patch<{ status: string; data: InspectionRequestDetail }>(
    `/banks/${bankId}/inspection-requests/${id}/status`,
    data,
  )
  return (res.data as any).data ?? res.data
}

export async function assignRepresentative(
  bankId: string,
  id: string,
  data: { representativeId: string; notes?: string },
): Promise<InspectionRequestDetail> {
  const res = await api.put<{ status: string; data: InspectionRequestDetail }>(
    `/banks/${bankId}/inspection-requests/${id}/assignment`,
    data,
  )
  return (res.data as any).data ?? res.data
}

export async function fetchInspectionStatusHistory(
  bankId: string,
  id: string,
): Promise<InspectionStatusHistoryItem[]> {
  const res = await api.get<{ status: string; data: InspectionStatusHistoryItem[] }>(
    `/banks/${bankId}/inspection-requests/${id}/status-history`,
  )
  return (res.data as any).data ?? res.data ?? []
}
