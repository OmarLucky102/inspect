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
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useAuth } from '../auth-context'
import { loginSchema, type LoginInput } from '../schemas'

export function LoginForm() {
  const { t } = useTranslation()
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
      toast.success(t('auth.welcomeBack', 'Welcome back!'))
      void navigate(from, { replace: true })
    },
  })

  const serverError = mutation.isError
    ? getApiErrorMessage(mutation.error, t('auth.signInFailed', 'Sign in failed. Try again.'))
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
          className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/60 p-2.5 text-xs leading-snug text-red-200 backdrop-blur-md shadow-lg"
        >
          <WarningCircle className="mt-0.5 size-3.5 shrink-0 text-red-400" aria-hidden />
          <p>{serverError}</p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-3.5">
        <div>
          <Label htmlFor="email" className="mb-1 text-[11px] font-mono uppercase tracking-wider text-white/90">
            {t('auth.workEmail', 'Work email')}
          </Label>
          <div className="relative flex items-center">
            <Envelope
              className="pointer-events-none absolute start-3 z-10 size-4 text-zinc-500 dark:text-zinc-400 transition-colors peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="username"
              placeholder={t('auth.workEmailPlaceholder', 'admin@euroassist.com')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className="peer h-9.5 sm:h-10 w-full rounded-xl border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#121620] ps-9.5 pe-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 caret-emerald-600 dark:caret-emerald-400 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-white/25 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#121620] focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-xs font-medium text-rose-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="mb-1 text-[11px] font-mono uppercase tracking-wider text-white/90">
              {t('auth.password', 'Password')}
            </Label>
          </div>
          <div className="relative flex items-center">
            <LockKey
              className="pointer-events-none absolute start-3 z-10 size-4 text-zinc-500 dark:text-zinc-400 transition-colors peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400"
              aria-hidden
            />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder', 'Minimum 8 characters')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className="peer h-9.5 sm:h-10 w-full rounded-xl border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#121620] ps-9.5 pe-9.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 caret-emerald-600 dark:caret-emerald-400 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-white/25 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#121620] focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute end-2 z-10 cursor-pointer rounded-lg p-1 text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {showPassword ? (
                <EyeSlash className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1 text-xs font-medium text-rose-400">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="md"
        disabled={mutation.isPending}
        className={cn(
          'mt-3.5 sm:mt-4 h-10 w-full cursor-pointer rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-sm font-medium text-white shadow-[0_10px_24px_-6px_rgba(16,185,129,0.4)] transition-all hover:from-emerald-500 hover:to-teal-400 hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.55)] active:scale-[0.99]',
          mutation.isPending && 'opacity-80'
        )}
      >
        {mutation.isPending ? (
          <>
            <CircleNotch className="size-4 animate-spin me-2" aria-hidden />
            {t('auth.verifying', 'Verifying credentials…')}
          </>
        ) : (
          <>
            {t('auth.signIn', 'Sign in to Console')}
            <ArrowRight className="size-4 ms-2 rtl:rotate-180" aria-hidden />
          </>
        )}
      </Button>

      <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] tracking-wide text-white/45">
        <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
        <span>{t('auth.secureSession', 'SECURE SESSION · HTTPONLY REFRESH ROTATION')}</span>
      </div>
    </form>
  )
}
