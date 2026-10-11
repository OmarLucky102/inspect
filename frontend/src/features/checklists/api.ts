import { api } from '@/lib/api'

export type ChecklistInputType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT'

export interface VehicleCategory {
  id: string
  name: string
  nameAr: string | null
  code: string | null
}

export interface ChecklistItem {
  id: string
  checklistId: string
  bankId: string | null
  code: string
  label: string
  description: string | null
  isRequired: boolean
  isMandatory: boolean
  weight: number
  inputType: ChecklistInputType
  options: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AddChecklistItemDto {
  code: string
  label: string
  description?: string
  weight?: number
  inputType?: ChecklistInputType
  options?: string
  sortOrder?: number
}

export interface InspectionChecklistItem {
  id: string
  inspectionRequestId: string
  checklistItemId: string
  value: any
  notes: string | null
  completed: boolean
  completedAt: string | null
}

function normalizeChecklistItem(raw: any): ChecklistItem {
  const item = raw?.props ?? raw ?? {}
  return {
    id: item.id,
    checklistId: item.checklistId,
    bankId: item.bankId ?? null,
    code: item.code,
    label: item.label,
    description: item.description ?? null,
    isRequired: item.isRequired ?? true,
    isMandatory: item.isMandatory ?? false,
    weight: item.weight ?? 1,
    inputType: item.inputType ?? 'TEXT',
    options: item.options ?? null,
    sortOrder: item.sortOrder ?? 1,
    isActive: item.isActive ?? true,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function normalizeInspectionChecklistItem(raw: any): InspectionChecklistItem {
  const item = raw?.props ?? raw ?? {}
  return {
    id: item.id,
    inspectionRequestId: item.inspectionRequestId,
    checklistItemId: item.checklistItemId,
    value: item.value,
    notes: item.notes ?? null,
    completed: item.completed ?? false,
    completedAt: item.completedAt ?? null,
  }
}

export async function fetchVehicleCategories(bankId: string): Promise<VehicleCategory[]> {
  const res = await api.get<{ status: string; data: VehicleCategory[] }>(
    `/banks/${bankId}/checklists/categories`,
  )
  return (res.data as any).data ?? res.data
}

export async function fetchCategoryChecklist(
  bankId: string,
  categoryId: string,
): Promise<ChecklistItem[]> {
  const res = await api.get<{ status: string; data: unknown[] }>(
    `/banks/${bankId}/checklists/category/${categoryId}`,
  )
  const rawList: any[] = (res.data as any).data ?? res.data ?? []
  return rawList.map(normalizeChecklistItem)
}

export async function addCustomChecklistItem(
  bankId: string,
  checklistId: string,
  dto: AddChecklistItemDto,
): Promise<ChecklistItem> {
  const res = await api.post<{ status: string; data: unknown }>(
    `/banks/${bankId}/checklists/${checklistId}/items`,
    dto,
  )
  return normalizeChecklistItem((res.data as any).data ?? res.data)
}

export async function removeCustomChecklistItem(
  bankId: string,
  checklistId: string,
  itemId: string,
): Promise<void> {
  await api.delete(`/banks/${bankId}/checklists/${checklistId}/items/${itemId}`)
}

export async function fetchRequestChecklistItems(
  bankId: string,
  requestId: string,
): Promise<InspectionChecklistItem[]> {
  const res = await api.get<{ status: string; data: unknown[] }>(
    `/banks/${bankId}/checklists/requests/${requestId}`,
  )
  const rawList: any[] = (res.data as any).data ?? res.data ?? []
  return rawList.map(normalizeInspectionChecklistItem)
}
