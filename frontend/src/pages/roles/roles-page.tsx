import { PageHeader } from "@/components/common/page-header";
import { RoleBadge } from "@/components/common/badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Role } from "@/types/enums";

const ROLE_BRIEF: Record<Role, string> = {
  SUPER_ADMIN: "Institutional control. Full read/write over the registry.",
  SYSTEM_ADMIN: "Three-letter authority. Manages system operators and banks.",
  MANAGER: "Runs a bank’s daily operations and its Users on record.",
  REVIEWER: "Examines records. Read access with review rights.",
  USER: "Standard operator of the system.",
  VIEWER: "Read-only observer of the registry.",
  REPRESENTATIVE: "Bank-facing representative with limited operational rights.",
};

const ROLE_HIERARCHY: Role[] = [
  Role.SUPER_ADMIN,
  Role.SYSTEM_ADMIN,
  Role.MANAGER,
  Role.REVIEWER,
  Role.USER,
  Role.VIEWER,
  Role.REPRESENTATIVE,
];

export function RolesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Access control"
        title="Roles"
        description="The hierarchy of entitlements held against every record."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ROLE_HIERARCHY.map((role) => (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{role}</CardTitle>
                <RoleBadge role={role} />
              </div>
              <CardDescription>{ROLE_BRIEF[role]}</CardDescription>
            </CardHeader>
            <CardContent className="registry-code text-xs text-muted-foreground">
              ENTRY LEVEL {ROLE_HIERARCHY.indexOf(role) + 1} OF {ROLE_HIERARCHY.length}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}