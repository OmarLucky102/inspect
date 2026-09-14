import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/format";
import type { Role, MembershipStatus } from "@/types/enums";
import { MEMBERSHIP_STATUS_LABELS } from "@/types/enums";

export function RoleBadge({ role }: { role: Role }) {
  switch (role) {
    case "SUPER_ADMIN":
      return <Badge variant="verdigris">{roleLabel(role)}</Badge>;
    case "SYSTEM_ADMIN":
      return <Badge variant="brass">{roleLabel(role)}</Badge>;
    default:
      return <Badge variant="secondary">{roleLabel(role)}</Badge>;
  }
}

export function MembershipStatusBadge({
  status,
}: {
  status: MembershipStatus;
}) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="verdigris">{MEMBERSHIP_STATUS_LABELS[status]}</Badge>;
    case "PENDING":
      return <Badge variant="brass">{MEMBERSHIP_STATUS_LABELS[status]}</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">{MEMBERSHIP_STATUS_LABELS[status]}</Badge>;
    case "REMOVED":
      return <Badge variant="ghost">{MEMBERSHIP_STATUS_LABELS[status]}</Badge>;
  }
}

export function ActiveBadge({ active }: { active: boolean }) {
  if (active) {
    return <Badge variant="verdigris">Active</Badge>;
  }
  return <Badge variant="ghost">Inactive</Badge>;
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return <Badge variant="verdigris">Verified</Badge>;
  }
  return <Badge variant="ghost">Unverified</Badge>;
}