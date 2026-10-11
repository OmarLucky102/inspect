import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowRight,
  CircleNotch,
  Envelope,
  Eye,
  EyeSlash,
  LockKey,
  WarningCircle,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useAuth } from '../auth-context'
import { loginSchema, type LoginInput } from '../schemas'

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  const mutation = useMutation({
    mutationFn: (values: LoginInput) => login(values.email, values.password),
    onSuccess: () => {
      toast.success('Welcome back — session secured.')
      void navigate(from, { replace: true })
    },
  })

  const serverError = mutation.isError
    ? getApiErrorMessage(mutation.error, 'Sign in failed. Try again.')
    : null

  const onSubmit = (values: LoginInput) => {
    if (mutation.isPending) return
    mutation.mutate(values)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full"
      aria-label="Admin sign in"
    >
      {serverError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/60 p-3.5 text-sm leading-snug text-red-200 backdrop-blur-md shadow-lg"
        >
          <WarningCircle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
          <p>{serverError}</p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <Label htmlFor="email" className="mb-2 text-xs font-mono uppercase tracking-wider text-white/80">
            Work email
          </Label>
          <div className="relative">
            <Envelope
              className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-white/45"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="admin@euroassist.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className="h-11.5 rounded-xl border-white/15 bg-white/[0.06] pl-10.5 text-[15px] text-white placeholder:text-white/35 transition-all hover:border-white/25 hover:bg-white/[0.08] focus:border-emerald-400 focus:bg-white/[0.1] focus:ring-2 focus:ring-emerald-400/25"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1.5 text-[13px] font-medium text-rose-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="mb-2 text-xs font-mono uppercase tracking-wider text-white/80">
              Password
            </Label>
          </div>
          <div className="relative">
            <LockKey
              className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-white/45"
              aria-hidden
            />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Minimum 8 characters"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className="h-11.5 rounded-xl border-white/15 bg-white/[0.06] pr-11 pl-10.5 text-[15px] text-white placeholder:text-white/35 transition-all hover:border-white/25 hover:bg-white/[0.08] focus:border-emerald-400 focus:bg-white/[0.1] focus:ring-2 focus:ring-emerald-400/25"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
            >
              {showPassword ? (
                <EyeSlash className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1.5 text-[13px] font-medium text-rose-400">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={mutation.isPending}
        className={cn(
          'mt-6 h-12 w-full cursor-pointer rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-[15px] font-medium text-white shadow-[0_12px_28px_-6px_rgba(16,185,129,0.45)] transition-all hover:from-emerald-500 hover:to-teal-400 hover:shadow-[0_14px_32px_-6px_rgba(16,185,129,0.6)] active:scale-[0.99]',
          mutation.isPending && 'opacity-80'
        )}
      >
        {mutation.isPending ? (
          <>
            <CircleNotch className="size-4 animate-spin" aria-hidden />
            Verifying credentials…
          </>
        ) : (
          <>
            Sign in to Console
            <ArrowRight className="size-4.5" aria-hidden />
          </>
        )}
      </Button>

      <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[11px] tracking-wide text-white/45">
        <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
        <span>SECURE SESSION · HTTPONLY REFRESH ROTATION</span>
      </div>
    </form>
  )
}
