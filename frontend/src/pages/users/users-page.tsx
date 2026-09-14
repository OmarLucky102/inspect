import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { RoleBadge, ActiveBadge, VerifiedBadge } from "@/components/common/badges";
import { LoadingRows } from "@/components/common/states";
import { ErrorPanel } from "@/components/common/error-panel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchUsers } from "@/lib/api/users.api";
import { formatDate, initials } from "@/lib/format";

export function UsersPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((u) =>
      [u.firstName, u.lastName, u.email, u.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Identity records"
        title="Users"
        description="Every institution member held in the registry."
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone…"
          className="pl-9"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6">
            <LoadingRows rows={6} columns={5} />
          </div>
        ) : isError ? (
          <div className="p-6">
            <ErrorPanel
              title="Registry unavailable"
              message="Users could not be read from the API."
              onRetry={() => refetch()}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Since</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No Users match this search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        to={`/users/${user.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {initials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate font-medium hover:text-primary">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {user.phone || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActiveBadge active={user.isActive} />
                        <VerifiedBadge verified={user.isEmailVerified} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}