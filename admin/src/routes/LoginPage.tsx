import { Compass } from '@phosphor-icons/react'
import { AuthSidePanel } from '@/features/auth/components/AuthSidePanel'
import { LoginForm } from '@/features/auth/components/LoginForm'

/**
 * Split editorial login (anti-center-bias): left dossier panel on desktop,
 * stacked minimal header + form column on mobile (single-column fallback).
 */
export function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] bg-bone lg:grid-cols-[1.05fr_1fr]">
      <AuthSidePanel />

      <section className="tech-grid-light relative flex w-full flex-col px-4 py-8 sm:px-8 lg:justify-center lg:px-14 lg:py-12 xl:px-20">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white">
              <Compass className="size-4.5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-[0.18em]">
                INSPECT
              </p>
              <p className="font-mono text-[10px] tracking-[0.22em] text-ink-mute">
                ADMIN CONSOLE
              </p>
            </div>
          </div>

          <p className="font-mono text-[11px] tracking-[0.24em] text-ink-mute">
            ADMIN SIGN IN
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-balance sm:text-4xl">
            Welcome back.
          </h2>
          <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-ink-soft">
            Use your work email and password. Sessions rotate securely in the
            background.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-8 border-t border-hairline pt-5 text-[13px] leading-relaxed text-ink-mute">
            Trouble signing in? Contact your system administrator to verify
            your account status.
          </p>
        </div>
      </section>
    </main>
  )
}
