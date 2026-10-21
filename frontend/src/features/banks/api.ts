import { api } from '@/lib/api'

export interface Bank {
  id: string
  name: string
  code: string
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
}

export interface CreateBankDto {
  name: string
  code: string
  email?: string
  phone?: string
}

export interface CreateBankUserDto {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone: string
  role: string
  isPrimary?: boolean
}

export interface AddBankMemberDto {
  userId: string
  isPrimary?: boolean
}

export async function fetchBanks(): Promise<Bank[]> {
  const res = await api.get<{ status: string; data: Bank[] }>('/banks')
  return res.data.data
}

export async function fetchBankById(bankId: string): Promise<Bank> {
  const res = await api.get<{ status: string; data: Bank }>(`/banks/${bankId}`)
  return res.data.data
}

export async function createBank(data: CreateBankDto): Promise<Bank> {
  const res = await api.post<{ status: string; data: Bank }>('/banks', data)
  return res.data.data
}

export async function createBankUser(bankId: string, data: CreateBankUserDto) {
  const res = await api.post<{ status: string; data: any }>(`/banks/${bankId}/users`, data)
  return res.data.data
}

export async function addBankMember(bankId: string, data: AddBankMemberDto) {
  const res = await api.post<{ status: string; data: any }>(`/banks/${bankId}/members`, data)
  return res.data.data
}

export interface BankMemberUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  isActive: boolean
  membershipId: string
  isPrimary: boolean
  status: string
}

export async function fetchBankMembers(bankId: string): Promise<BankMemberUser[]> {
  const res = await api.get<{ status: string; data: BankMemberUser[] }>(`/banks/${bankId}/members`)
  return res.data.data
}

export async function removeBankMember(bankId: string, userId: string): Promise<void> {
  await api.delete(`/banks/${bankId}/members/${userId}`)
}
