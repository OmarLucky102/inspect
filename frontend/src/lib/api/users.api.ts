import { client } from "./client";
import type { User } from "@/types/models";

export async function fetchUsers(): Promise<User[]> {
  const { data } = await client.get<User[]>("/users");
  return data;
}

export async function fetchUser(userId: string): Promise<User> {
  const { data } = await client.get<User>(`/users/${userId}`);
  return data;
}