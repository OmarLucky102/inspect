import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Landmark, Users } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActiveBadge } from "@/components/common/badges";
import { LoadingRows } from "@/components/common/states";
import { ErrorPanel } from "@/components/common/error-panel";
import { fetchUsers } from "@/lib/api/users.api";
import { fetchBanks } from "@/lib/api/banks.api";
import { formatDate, truncateId } from "@/lib/format";
import { useAuthStore } from "@/stores/auth.store";

function StatCard({
  label,
  value,
  hint,
  to,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  to: string;
  icon: React.ElementType;
}) {
  return (
    <Link to={to} className="group">
      <Card className="transition-colors group-hover:border-brass/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-normal">{label}</CardTitle>
          <Icon className="h-4 w-4 text-brass" />
        </CardHeader>
        <CardContent className="space-y-1.5">
          <p className="font-display text-4xl font-semibold tracking-tight">{value}</p>
          <p className="registry-code text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const usersQuery = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const banksQuery = useQuery({ queryKey: ["banks"], queryFn: fetchBanks });

  const recentBanks = banksQuery.data?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Session ${user ? truncateId(user.sub) : ""}`}
        title={`Welcome, ${user?.email ?? "operator"}`}
        description="Live record of the institution's Users and banks."
        actions={
          <Button asChild>
            <Link to="/banks">Register a bank</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Banks on record"
          value={banksQuery.data?.length ?? "—"}
          hint="FULL REGISTRY COUNT"
          to="/banks"
          icon={Landmark}
        />
        <StatCard
          label="Users on record"
          value={usersQuery.data?.length ?? "—"}
          hint="TOTAL IDENTITY RECORDS"
          to="/users"
          icon={Users}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Recent bank registrations
            </h2>
            <p className="registry-code text-xs text-muted-foreground">
              LAST 5 ENTRIES &middot; CHRONOLOGICAL
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/banks">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card>
          {banksQuery.isLoading ? (
            <CardContent className="p-6">
              <LoadingRows rows={4} columns={4} />
            </CardContent>
          ) : banksQuery.isError ? (
            <CardContent className="p-6">
              <ErrorPanel
                title="Registry unavailable"
                message="Banks could not be read from the API."
                onRetry={() => banksQuery.refetch()}
              />
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="hidden md:table-cell">Registered</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBanks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      No banks registered yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentBanks.map((bank) => (
                    <TableRow key={bank.id}>
                      <TableCell>
                        <Link
                          to={`/banks/${bank.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {bank.name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="registry-code">{bank.code}</span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatDate(bank.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActiveBadge active={bank.isActive} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}