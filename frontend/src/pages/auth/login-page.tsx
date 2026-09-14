import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { GuillocheRosette } from "@/components/brand/guilloche";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth.store";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  if (useAuthStore.getState().checkSession()) {
    return <Navigate to="/dashboard" replace />;
  }

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setRootError(null);
    try {
      const tokens = await login(values.email, values.password);
      useAuthStore.getState().setTokens(tokens);
      toast.success("Signed in to the registry");
      const from = (
        location.state as { from?: { pathname?: string } } | null
      )?.from?.pathname;
      navigate(from && from !== "/login" ? from : "/dashboard", {
        replace: true,
      });
    } catch (error) {
      setRootError(getErrorMessage(error));
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-chrome lg:flex lg:flex-col lg:justify-between lg:p-12">
        <GuillocheRosette
          size={900}
          className="pointer-events-none absolute -right-64 -top-64 text-chrome-active/70"
        />
        <GuillocheRosette
          size={340}
          className="pointer-events-none absolute -bottom-32 -left-32 text-chrome-active/50"
        />
        <div className="relative flex items-center gap-3">
          <GuillocheRosette size={56} className="text-brass" />
          <span className="font-display text-2xl font-semibold tracking-tight text-white">
            Inspect
          </span>
        </div>
        <div className="relative max-w-md">
          <p className="eyebrow text-brass">Registry console</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-white">
            Control of the institution.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-chrome-muted">
            The inspection desk for the banking registry. Every person and bank
            in the system is record-kept, auditable, and guarded behind a
            single authority.
          </p>
        </div>
        <p className="registry-code relative text-xs text-chrome-muted">
          AUTHORITY-01 &middot; REGISTRY GER¶1996-274 &middot; ENTRY REQ ONLY
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <GuillocheRosette size={44} className="text-brass" />
            <div>
              <span className="font-display text-xl font-semibold text-foreground">
                Inspect
              </span>
              <p className="eyebrow text-muted-foreground">Registry console</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              Credentials are verified against the identity service.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-5"
            data-testid="login-form"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@institution.local"
                aria-invalid={!!formState.errors.email}
                {...register("email")}
              />
              {formState.errors.email && (
                <p className="text-xs text-destructive">
                  {formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  aria-invalid={!!formState.errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formState.errors.password && (
                <p className="text-xs text-destructive">
                  {formState.errors.password.message}
                </p>
              )}
            </div>

            {rootError && (
              <p
                role="alert"
                className="rounded-md border border-seal/30 bg-seal/10 px-3 py-2 text-sm text-seal"
              >
                {rootError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Authenticate
            </Button>
          </form>

          <p className="registry-code mt-8 text-center text-xs text-muted-foreground">
            Unauthorised entry is recorded.
          </p>
        </div>
      </section>
    </div>
  );
}