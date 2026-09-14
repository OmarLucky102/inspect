export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  MANAGER = "MANAGER",
  REVIEWER = "REVIEWER",
  USER = "USER",
  VIEWER = "VIEWER",
  REPRESENTATIVE = "REPRESENTATIVE",
}

export enum MembershipStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  REMOVED = "REMOVED",
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.SYSTEM_ADMIN]: "System Admin",
  [Role.MANAGER]: "Manager",
  [Role.REVIEWER]: "Reviewer",
  [Role.USER]: "User",
  [Role.VIEWER]: "Viewer",
  [Role.REPRESENTATIVE]: "Representative",
};

export const BANK_MEMBER_ROLES: readonly Role[] = [
  Role.MANAGER,
  Role.REVIEWER,
  Role.USER,
  Role.VIEWER,
  Role.REPRESENTATIVE,
] as const;

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  [MembershipStatus.PENDING]: "Pending",
  [MembershipStatus.ACTIVE]: "Active",
  [MembershipStatus.SUSPENDED]: "Suspended",
  [MembershipStatus.REMOVED]: "Removed",
};
