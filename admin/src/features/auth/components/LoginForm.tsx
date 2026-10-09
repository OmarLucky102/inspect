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
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-600/25 bg-red-50 px-3.5 py-3 text-sm leading-snug text-red-800"
        >
          <WarningCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{serverError}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Work email</Label>
          <div className="relative">
            <Envelope
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-mute"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="admin@company.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1.5 text-[13px] text-red-700">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="mb-1.5">
              Password
            </Label>
          </div>
          <div className="relative">
            <LockKey
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-mute"
              aria-hidden
            />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Minimum 8 characters"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className="pr-11 pl-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-paper hover:text-ink"
            >
              {showPassword ? (
                <EyeSlash className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1.5 text-[13px] text-red-700">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={mutation.isPending}
        className={cn('mt-6 w-full', mutation.isPending && 'opacity-80')}
      >
        {mutation.isPending ? (
          <>
            <CircleNotch className="size-4 animate-spin" aria-hidden />
            Verifying credentials…
          </>
        ) : (
          <>
            Sign in to admin
            <ArrowRight aria-hidden />
          </>
        )}
      </Button>

      <p className="mt-5 text-center font-mono text-[11px] tracking-wide text-ink-mute">
        SECURE SESSION · HTTPONLY REFRESH ROTATION
      </p>
    </form>
  )
}
