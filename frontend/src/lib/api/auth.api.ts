import { client } from "./client";
import { messageFrom } from "./errors";
import type { AuthTokens } from "@/types/models";
import type { ApiResponse } from "@/types/api";

function unwrap<T>(data: ApiResponse<T>): T {
  if (data.status !== "success") {
    throw new Error(messageFrom(data));
  }
  return data.data;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await client.post<ApiResponse<AuthTokens>>("/auth/login", {
    email,
    password,
  });
  return unwrap(data);
}