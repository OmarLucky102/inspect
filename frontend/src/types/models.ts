import type { Role, MembershipStatus } from "./enums";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Membership {
  id: string;
  bankId: string;
  userId: string;
  isPrimary: boolean;
  status: MembershipStatus;
  joinedAt: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CreateBankInput {
  name: string;
  code: string;
  email?: string;
  phone?: string;
}

export interface CreateBankUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  isPrimary?: boolean;
}

export interface AddMemberInput {
  userId: string;
  isPrimary?: boolean;
}

export interface BankUserResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: Role;
    isActive: boolean;
  };
  membership: Membership;
}
