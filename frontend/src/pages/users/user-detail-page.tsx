import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { RoleBadge, ActiveBadge, VerifiedBadge } from "@/components/common/badges";
import { LoadingRows, LoadingCard } from "@/components/common/states";
import { ErrorPanel } from "@/components/common/error-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchUser } from "@/lib/api/users.api";
import { formatDateTime, initials, truncateId } from "@/lib/format";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="registry-code text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value ?? "—"}</p>
    </div>
  );
}

export function UserDetailPage() {
  const { userId = "" } = useParams();
  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  });

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/users">
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Link>
        </Button>
        <PageHeader
          eyebrow={`Record ${userId ? truncateId(userId) : ""}`}
          title={user ? `${user.firstName} ${user.lastName}` : "Person record"}
          description="The full identity record as held in the registry."
          actions={
            user && (
              <div className="flex items-center gap-2">
                <ActiveBadge active={user.isActive} />
                <VerifiedBadge verified={user.isEmailVerified} />
              </div>
            )
          }
        />
      </div>

      {isLoading ? (
        <LoadingCard />
      ) : isError || !user ? (
        <ErrorPanel
          title="Record unavailable"
          message="This identity could not be read from the API."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-xl">
                  {initials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-display text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </p>
                <RoleBadge role={user.role} />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Identity details</CardTitle>
              <CardDescription>
                Recorded at registration and held on file.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <Field label="EMAIL" value={user.email} />
              <Field label="PHONE" value={user.phone} />
              <Field label="RECORD ID" value={<span className="registry-code">{user.id}</span>} />
              <Field label="REGISTERED" value={formatDateTime(user.createdAt)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}