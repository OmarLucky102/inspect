import { client } from "./client";
import { messageFrom } from "./errors";
import type {
  Bank,
  AddMemberInput,
  BankUserResult,
  CreateBankInput,
  CreateBankUserInput,
  Membership,
} from "@/types/models";
import type { ApiResponse } from "@/types/api";

function unwrap<T>(data: ApiResponse<T>): T {
  if (data.status !== "success") {
    throw new Error(messageFrom(data));
  }
  return data.data;
}

export async function fetchBanks(): Promise<Bank[]> {
  const { data } = await client.get<ApiResponse<Bank[]>>("/banks");
  return unwrap(data);
}

export async function fetchBank(bankId: string): Promise<Bank> {
  const { data } = await client.get<ApiResponse<Bank>>(`/banks/${bankId}`);
  return unwrap(data);
}

export async function createBank(input: CreateBankInput): Promise<Bank> {
  const { data } = await client.post<ApiResponse<Bank>>("/banks", input);
  return unwrap(data);
}

export async function createBankUser(
  bankId: string,
  input: CreateBankUserInput,
): Promise<BankUserResult> {
  const { data } = await client.post<ApiResponse<BankUserResult>>(
    `/banks/${bankId}/users`,
    input,
  );
  return unwrap(data);
}

export async function addBankMember(
  bankId: string,
  input: AddMemberInput,
): Promise<Membership> {
  const { data } = await client.post<ApiResponse<Membership>>(
    `/banks/${bankId}/members`,
    input,
  );
  return unwrap(data);
}