import { PageHeader } from "@/components/common/page-header";
import { RoleBadge } from "@/components/common/badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types/enums";

function ClaimRow({ claim, value }: { claim: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="registry-code text-xs text-muted-foreground">{claim}</span>
      <span className="registry-code truncate text-xs">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Current session claims"
        title="Profile"
        description="The registered identity this console is acting as."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>JWT identity</CardTitle>
            <RoleBadge role={user?.role ?? Role.VIEWER} />
          </div>
          <CardDescription>
            Claims verified on sign-in, presented by the console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div>
              <ClaimRow claim="sub" value={user.sub} />
              <ClaimRow claim="email" value={user.email} />
              <ClaimRow claim="role" value={user.role} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No claims held in this session.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="destructive" onClick={() => useAuthStore.getState().logout()}>
          Sign out
        </Button>
        <p className="registry-code text-xs text-muted-foreground">
          ENDS THE SESSION AND FORFEITS THE TOKEN
        </p>
      </div>
    </div>
  );
}