import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Landmark, Loader2, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { ActiveBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingCard } from "@/components/common/states";
import { ErrorPanel } from "@/components/common/error-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { fetchBanks, createBank } from "@/lib/api/banks.api";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";

const createSchema = z.object({
  name: z.string().trim().min(1, "A name is required").max(255),
  code: z
    .string()
    .trim()
    .min(1, "A code is required")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, "Letters, numbers, dash and underscore only"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});
type CreateFormValues = z.infer<typeof createSchema>;

function CreateBankDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", code: "", email: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
      createBank({
        name: values.name,
        code: values.code,
        email: values.email || undefined,
        phone: values.phone || undefined,
      }),
    onSuccess: (bank) => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success(`${bank.name} registered`);
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
        <Button>
          <Plus className="h-4 w-4" /> Register bank
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register a bank</DialogTitle>
          <DialogDescription>
            A new entry is appended to the registry. Codes must be unique.
          </DialogDescription>
        </DialogHeader>
        <form>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Trade Bank Limited"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Bank code</Label>
              <Input
                id="code"
                placeholder="TBANK"
                className="font-mono uppercase"
                aria-invalid={!!errors.code}
                {...register("code")}
              />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" type="email" placeholder="corp@bank.th" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Contact phone</Label>
                <Input id="phone" placeholder="+66 …" {...register("phone")} />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit((values) => mutation.mutate(values))}
              disabled={isSubmitting}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BanksPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["banks"],
    queryFn: fetchBanks,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Institutions"
        title="Banks"
        description="Every bank on the register, with codes and status."
        actions={<CreateBankDialog />}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorPanel
          title="Registry unavailable"
          message="Banks could not be read from the API."
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No banks registered"
          description="Register the first institution to open the ledger."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((bank) => (
            <Link key={bank.id} to={`/banks/${bank.id}`}>
              <Card className="h-full transition-colors hover:border-brass/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{bank.name}</CardTitle>
                    <ActiveBadge active={bank.isActive} />
                  </div>
                  <CardDescription>
                    <span className="registry-code">{bank.code}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{bank.email || "No contact email"}</p>
                  <p>{bank.phone || "No contact phone"}</p>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Registered {formatDate(bank.createdAt)}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}