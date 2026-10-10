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
  name: string
  phone: string
  email?: string
}

export interface LocationDto {
  address: string
  city?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface CreateInspectionRequestDto {
  customer: CustomerDto
  location: LocationDto
  requestedCompletionDate?: Date | string
  notes?: string
  vehicle?: VehicleDto
}

export interface SubmitInspectionRequestDto {
  vehicle?: VehicleDto
}

export interface InspectionRequest {
  id: string
  bankId: string
  userId: string
  status: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  locationAddress: string
  requestedCompletionDate: string | null
  notes: string | null
  vehicleId: string | null
  createdAt: string
  updatedAt: string
  vehicle?: any
}

export async function fetchInspectionRequests(bankId: string): Promise<InspectionRequest[]> {
  const res = await api.get<{ status: string; data: InspectionRequest[] }>(`/banks/${bankId}/inspection-requests`)
  return res.data.data
}

export async function fetchInspectionRequestById(bankId: string, id: string): Promise<InspectionRequest> {
  const res = await api.get<{ status: string; data: InspectionRequest }>(`/banks/${bankId}/inspection-requests/${id}`)
  return res.data.data
}

export async function createInspectionRequest(bankId: string, data: CreateInspectionRequestDto): Promise<InspectionRequest> {
  const res = await api.post<{ status: string; data: InspectionRequest }>(`/banks/${bankId}/inspection-requests`, data)
  return res.data.data
}

export async function submitInspectionRequest(bankId: string, id: string, data: SubmitInspectionRequestDto): Promise<InspectionRequest> {
  const res = await api.post<{ status: string; data: InspectionRequest }>(`/banks/${bankId}/inspection-requests/${id}/submit`, data)
  return res.data.data
}
