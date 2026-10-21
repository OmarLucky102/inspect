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

export async function fetchInspectionRequests(
  bankId: string,
  status?: string,
): Promise<InspectionRequest[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : ''
  const res = await api.get<{ status: string; data: unknown[] }>(
    `/banks/${bankId}/inspection-requests${params}`,
  )
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
  originalTrim?: {
    id: string
    code: string
    name: string
    nameAr: string | null
  } | null
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
    color: { id: string; name: string; hex?: string | null } | null
    fuelType: { id: string; name: string } | null
    transmissionType: { id: string; name: string; nameAr?: string | null } | null
    trim: { id: string; code?: string; name: string; nameAr?: string | null } | null
    sunroofSpecification?: string | null
    sideMirrors?: string | null
    calendarNumber?: string | null
    specialInstructions?: string | null
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
    reviewDecision?: 'PASS' | 'FAIL' | 'RESHOOT' | null
    reviewNotes?: string | null
    reviewedAt?: string | null
  }>
  canDownloadReport?: boolean
  latestMarketingDecision?: {
    id: string
    estimatedValue: number
    approved: boolean
    notes: string | null
    rejectedReason: string | null
    decidedAt: string
    reviewerName: string | null
  } | null
  photoChecklist?: InspectionPhotoChecklistDto | null
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
  data: { representativeId: string; notes?: string; captureMode?: 'STANDARD' | 'ADVANCED' },
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

export interface VehicleModelLookup {
  id: string
  brandId: string
  name: string
}

export interface VehicleBrandLookup {
  id: string
  name: string
  code: string | null
  models?: VehicleModelLookup[]
}

export interface VehicleReferenceItem {
  id: string
  name: string
  nameAr?: string | null
  code?: string | null
  hex?: string | null
}

export interface VehicleReferenceLookups {
  brands: VehicleBrandLookup[]
  categories: VehicleReferenceItem[]
  colors: VehicleReferenceItem[]
  fuelTypes: VehicleReferenceItem[]
  transmissionTypes: VehicleReferenceItem[]
  trims: VehicleReferenceItem[]
  sideMirrorTypes?: VehicleReferenceItem[]
  sunroofTypes?: VehicleReferenceItem[]
}

export async function fetchVehicleLookups(): Promise<VehicleReferenceLookups> {
  const res = await api.get<{ status: string; data: VehicleReferenceLookups }>('/vehicles/lookups')
  return (res.data as any).data ?? res.data
}

export interface VehicleInfoPayload {
  brandId: string
  modelId: string
  manufactureYear: number
  categoryId: string
  vin: string
  engineNumber: string
  engineCc: number

  plateNumber?: string
  plateDigits?: string
  plateLetters?: string
  power?: number
  mileage?: number
  colorId?: string
  trimId?: string
  transmissionTypeId?: string
  fuelTypeId?: string
  insuranceValue?: number
  sunroofSpecification?: string
  sideMirrors?: string
  carInterior?: string
  calendarNumber?: string
  specialInstructions?: string

  captureMode?: 'STANDARD' | 'ADVANCED'
  includeInterior?: boolean

  paymentReceiptImage?: string | null
  licenseFrontImage?: string | null
  licenseBackImage?: string | null

  submit?: boolean
}

export async function updateInspectionRequestVehicle(
  bankId: string,
  requestId: string,
  data: VehicleInfoPayload,
): Promise<InspectionRequestDetail> {
  const res = await api.put<{ status: string; data: InspectionRequestDetail }>(
    `/banks/${bankId}/inspection-requests/${requestId}/vehicle`,
    data,
  )
  return (res.data as any).data ?? res.data
}

export interface CustomPhotoCategory {
  id: string
  name: string
  required: boolean
}

export interface InspectionPhotoChecklistDto {
  id: string
  inspectionRequestId: string
  licensePhoto: boolean
  airbagPhoto: boolean
  roofPhoto: boolean
  odometerPhoto: boolean
  chassisPhoto: boolean
  customFields: CustomPhotoCategory[]
  createdAt: string
  updatedAt: string
}

export interface UpdatePhotoChecklistPayload {
  licensePhoto?: boolean
  airbagPhoto?: boolean
  roofPhoto?: boolean
  odometerPhoto?: boolean
  chassisPhoto?: boolean
  customFields?: Array<{ id?: string; name: string; required: boolean }>
}

export async function fetchInspectionPhotoChecklist(
  bankId: string,
  requestId: string,
): Promise<InspectionPhotoChecklistDto> {
  const res = await api.get<{ status: string; data: InspectionPhotoChecklistDto }>(
    `/banks/${bankId}/inspection-requests/${requestId}/photo-checklist`,
  )
  return (res.data as any).data ?? res.data
}

export async function updateInspectionPhotoChecklist(
  bankId: string,
  requestId: string,
  payload: UpdatePhotoChecklistPayload,
): Promise<InspectionPhotoChecklistDto> {
  const res = await api.put<{ status: string; data: InspectionPhotoChecklistDto }>(
    `/banks/${bankId}/inspection-requests/${requestId}/photo-checklist`,
    payload,
  )
  return (res.data as any).data ?? res.data
}

export interface MediaReviewPayload {
  verifiedMileage: number
  proposedMarketingValue: number
  trimId?: string
  transmissionTypeId?: string
  sideMirrors?: string
  sunroofSpecification?: string
  notes?: string
  checklistItems?: Array<{
    checklistItemId: string
    decision: 'PASS' | 'FAIL' | 'RESHOOT'
    notes?: string
  }>
}

export async function submitMediaReview(
  bankId: string,
  requestId: string,
  payload: MediaReviewPayload,
): Promise<InspectionRequestDetail> {
  const res = await api.post<{ status: string; data: InspectionRequestDetail }>(
    `/banks/${bankId}/inspection-requests/${requestId}/media-review`,
    payload,
  )
  return (res.data as any).data ?? res.data
}

export interface FinalApprovePayload {
  approvedMarketingValue?: number
  notes?: string
}

export async function finalApproveInspection(
  bankId: string,
  requestId: string,
  payload?: FinalApprovePayload | string,
): Promise<InspectionRequestDetail> {
  const body =
    typeof payload === 'string'
      ? { notes: payload }
      : payload ?? {}
  const res = await api.post<{ status: string; data: InspectionRequestDetail }>(
    `/banks/${bankId}/inspection-requests/${requestId}/final-approval`,
    body,
  )
  return (res.data as any).data ?? res.data
}

export async function requestPriceRevision(
  bankId: string,
  requestId: string,
  revisionNotes: string,
): Promise<InspectionRequestDetail> {
  const res = await api.post<{ status: string; data: InspectionRequestDetail }>(
    `/banks/${bankId}/inspection-requests/${requestId}/request-price-revision`,
    { revisionNotes },
  )
  return (res.data as any).data ?? res.data
}

export async function fetchInspectionReport(
  bankId: string,
  requestId: string,
): Promise<any> {
  const res = await api.get<{ status: string; data: any }>(
    `/banks/${bankId}/inspection-requests/${requestId}/report`,
  )
  return (res.data as any).data ?? res.data
}

export interface InspectionAnalyticsData {
  scope: {
    bankId: string | null
    bankName: string | null
    isGlobal: boolean
    periodDays: number
  }
  overview: {
    totalRequests: number
    activePipeline: number
    pendingInitialApproval: number
    pendingAssignment: number
    inField: number
    underValuationReview: number
    completed: number
    approved: number
    rejected: number
    cancelled: number
    approvalRate: number
    totalValuation: number
    averageValuation: number
    averageTurnaroundDays: number
  }
  statusBreakdown: Array<{
    status: string
    label: string
    count: number
    percentage: number
    color: string
  }>
  volumeTrend: Array<{
    date: string
    formattedDate: string
    created: number
    approved: number
  }>
  categoryDistribution: Array<{
    name: string
    count: number
    totalValuation: number
  }>
  priorityDistribution: Array<{
    priority: string
    count: number
  }>
  checklistPerformance: {
    totalItemsReviewed: number
    passCount: number
    failCount: number
    reshootCount: number
    passRate: number
  }
  recentRequests: Array<{
    id: string
    requestNumber: string
    status: string
    priority: string
    requestedAt: string
    bankId: string
    bankName: string
    customerName: string
    vehicleDescription: string
    marketValue?: number
  }>
}

export async function fetchInspectionAnalytics(params?: {
  bankId?: string
  periodDays?: number
}): Promise<InspectionAnalyticsData> {
  const q = new URLSearchParams()
  if (params?.bankId) q.set('bankId', params.bankId)
  if (params?.periodDays) q.set('periodDays', String(params.periodDays))
  const qs = q.toString() ? `?${q.toString()}` : ''
  const res = await api.get<{ status: string; data: InspectionAnalyticsData }>(
    `/inspection-requests/analytics${qs}`,
  )
  return (res.data as any).data ?? res.data
}


