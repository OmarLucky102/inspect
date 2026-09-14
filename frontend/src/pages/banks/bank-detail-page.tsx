import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, UserCircle2, Users } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { ActiveBadge, MembershipStatusBadge, RoleBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorPanel } from "@/components/common/error-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { fetchBank, fetchBanks, createBankUser, addBankMember } from "@/lib/api/banks.api";
import { fetchUsers } from "@/lib/api/users.api";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { BANK_MEMBER_ROLES, Role } from "@/types/enums";
import type { BankUserResult, Membership } from "@/types/models";
import { useSessionList } from "@/hooks/use-session-list";

const userSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
  firstName: z.string().trim().min(1, "Required").max(255),
  lastName: z.string().trim().min(1, "Required").max(255),
  phone: z.string().trim().min(1, "Required").max(20),
  role: z.enum([...BANK_MEMBER_ROLES] as [Role, ...Role[]]),
});
type UserFormValues = z.infer<typeof userSchema>;

const memberSchema = z.object({
  userId: z.string().trim().min(1, "Choose a person"),
});
type MemberFormValues = z.infer<typeof memberSchema>;

function CreateBankUserDialog({
  bankId,
  onCreated,
}: {
  bankId: string;
  onCreated?: (result: BankUserResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>(Role.USER);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: Role.USER,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      createBankUser(bankId, {
        ...values,
        isPrimary: true,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["banks", bankId] });
      toast.success(`${result.user.email} created`);
      onCreated?.(result);
      setOpen(false);
      reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" /> Create user
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a user on {bankId.slice(0, 8)}…</DialogTitle>
          <DialogDescription>
            The new identity is registered to this bank as primary member.
          </DialogDescription>
        </DialogHeader>
        <form>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@bank.th" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+66 …" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {BANK_MEMBER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit((values) =>
                mutation.mutate({ ...values, role: role as Role }),
              )}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({
  bankId,
  onAdded,
}: {
  bankId: string;
  onAdded?: (membership: Membership) => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const { control, handleSubmit, reset, formState } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { userId: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: MemberFormValues) => addBankMember(bankId, { userId: values.userId }),
    onSuccess: (membership) => {
      queryClient.invalidateQueries({ queryKey: ["banks", bankId] });
      toast.success("Member added");
      onAdded?.(membership);
      setOpen(false);
      reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add an existing member</DialogTitle>
          <DialogDescription>
            Attaches an existing person record to this bank.
          </DialogDescription>
        </DialogHeader>
        <form>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="member">Person</Label>
              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a person" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersQuery.data
                        ?.filter((u) => BANK_MEMBER_ROLES.includes(u.role))
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} — {u.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {formState.errors.userId && (
                <p className="text-xs text-destructive">{formState.errors.userId.message}</p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formState.isSubmitting}
              onClick={handleSubmit((values) => mutation.mutate(values))}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionNote() {
  return (
    <p className="registry-code text-xs text-muted-foreground">
      This session&apos;s additions as seen by the registrar &middot; server
      memberships are not enumerable.
    </p>
  );
}

export function BankDetailPage() {
  const { bankId = "" } = useParams();
  const { data: bank, isLoading, isError, refetch } = useQuery({
    queryKey: ["banks", bankId],
    queryFn: () => fetchBank(bankId),
    enabled: !!bankId,
  });

  const bankUsers = useSessionList<import("@/types/models").BankUserResult>(
    `inspect.bankUsers:${bankId}`,
  );
  const members = useSessionList<import("@/types/models").Membership>(
    `inspect.bankMembers:${bankId}`,
  );
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Loading record…</div>
    );
  }

  if (isError || !bank) {
    return (
      <ErrorPanel
        title="Record unavailable"
        message="This bank could not be read from the API."
        onRetry={() => refetch()}
      />
    );
  }

  const activeMembers = members.items;

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/banks">
            <ArrowLeft className="h-4 w-4" /> Back to banks
          </Link>
        </Button>
        <PageHeader
          eyebrow={bank.code}
          title={bank.name}
          description={`Contact ${bank.email ?? "n/a"} · ${bank.phone ?? "no phone on file"}. Registered ${formatDate(bank.createdAt)}.`}
          actions={<ActiveBadge active={bank.isActive} />}
        />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
              <CardDescription>
                The entry as recorded on the ledger.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 text-sm sm:grid-cols-2">
              <div>
                <p className="registry-code text-xs text-muted-foreground">RECORD ID</p>
                <p className="registry-code mt-0.5">{bank.id}</p>
              </div>
              <div>
                <p className="registry-code text-xs text-muted-foreground">CODE</p>
                <p className="registry-code mt-0.5">{bank.code}</p>
              </div>
              <div>
                <p className="registry-code text-xs text-muted-foreground">EMAIL</p>
                <p className="mt-0.5">{bank.email ?? "—"}</p>
              </div>
              <div>
                <p className="registry-code text-xs text-muted-foreground">PHONE</p>
                <p className="mt-0.5">{bank.phone ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Users" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <SessionNote />
            <CreateBankUserDialog bankId={bankId} onCreated={bankUsers.addItem} />
          </div>
          {bankUsers.items.length === 0 ? (
            <EmptyState
              icon={UserCircle2}
              title="No users created this session"
              description="Create a user the server records under this bank."
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankUsers.items.map((r) => (
                    <TableRow key={r.user.id}>
                      <TableCell>
                        <span className="font-medium">{r.user.firstName} {r.user.lastName}</span>
                        <span className="block text-xs text-muted-foreground">{r.user.email}</span>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={r.user.role} />
                      </TableCell>
                      <TableCell>
                        <MembershipStatusBadge status={r.membership.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <SessionNote />
            <AddMemberDialog bankId={bankId} onAdded={members.addItem} />
          </div>
          {activeMembers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members added this session"
              description="Attach an existing person record to this bank."
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMembers.map((m) => {
                    const person = usersQuery.data?.find((u) => u.id === m.userId);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          {person ? (
                            <>
                              <span className="font-medium">
                                {person.firstName} {person.lastName}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {person.email}
                              </span>
                            </>
                          ) : (
                            <span className="registry-code text-xs">{m.userId}</span>
                          )}
                        </TableCell>
                        <TableCell>{m.isPrimary ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <MembershipStatusBadge status={m.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}