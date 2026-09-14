import { format, parseISO } from "date-fns";
import type { Role, MembershipStatus } from "@/types/enums";
import { ROLE_LABELS, MEMBERSHIP_STATUS_LABELS } from "@/types/enums";

export function formatDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy");
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy, HH:mm");
}

export function truncateId(id: string): string {
  return `${id.slice(0, 8)}\u2009\u00B7\u2009\u2026`;
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function membershipStatusLabel(status: MembershipStatus): string {
  return MEMBERSHIP_STATUS_LABELS[status] ?? status;
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
