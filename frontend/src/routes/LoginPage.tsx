import {
  Bank,
  ClipboardText,
  Compass,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { LanguageToggle } from '@/components/layout/LanguageToggle'

export function LoginPage() {
  const { t } = useTranslation()

  const DOSSIER_BADGES = [
    {
      icon: ClipboardText,
      label: t('auth.pipelineBadge', 'Pipeline'),
      desc: t('auth.pipelineBadgeDesc', 'Intake to review'),
    },
    {
      icon: ShieldCheck,
      label: t('auth.calibratedBadge', 'Calibrated'),
      desc: t('auth.calibratedBadgeDesc', 'Role-scoped audit'),
    },
    {
      icon: Bank,
      label: t('auth.bankScopesBadge', 'Bank Scopes'),
      desc: t('auth.bankScopesBadgeDesc', 'Multi-tenant scopes'),
    },
  ]

  return (
    <main className="relative h-screen h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#07090e] text-white">
      {/* Cinematic Background Layer with euro.png */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        <img
          src="/euro.png"
          alt="Euro Assist Vehicle Inspection Telemetry"
          className="h-full w-full object-cover object-[72%_center] lg:object-[68%_center] xl:object-[64%_center]"
        />

        {/* Multi-tier gradient masks for readability and depth */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/90 to-[#07090e]/40 lg:via-[#07090e]/75 lg:to-black/20"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#07090e]/80 via-transparent to-[#07090e]/90"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_15%_18%,rgba(14,107,78,0.18),transparent_70%)]"
          aria-hidden
        />
        <div
          className="tech-grid absolute inset-0 opacity-40 mix-blend-screen"
          aria-hidden
        />
      </div>

      {/* Foreground Content Container - locked to 100dvh with zero scrolling */}
      <div className="relative z-10 flex h-full max-h-[100dvh] flex-col justify-between p-4 sm:px-8 sm:py-4 lg:px-12 lg:py-5 xl:px-14 xl:py-6 overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md">
              <Compass className="size-4.5" aria-hidden />
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold tracking-[0.2em] text-white">
                  {t('common.inspect', 'INSPECT')}
                </span>
                <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="font-mono text-[9px] tracking-[0.22em] text-white/55">
                {t('common.adminConsole', 'ADMIN CONSOLE')} · {t('common.euroAssist', 'EURO ASSIST')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Language Toggle */}
            <LanguageToggle className="bg-white/10 text-white border-white/20" />

            {/* Desktop Live Telemetry Badge */}
            <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3.5 py-1 backdrop-blur-md lg:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] tracking-wider text-white/80">
                {t('auth.telemetryNode', 'TELEMETRY NODE 360° · STAGE 01')}
              </span>
            </div>
          </div>
        </header>

        {/* Central Workspace Grid */}
        <div className="my-auto flex-1 min-h-0 grid w-full max-w-7xl items-center gap-6 py-2 sm:py-3 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          {/* Left Column: Headline, Description & Frosted Glass Login Card */}
          <div className="flex flex-col justify-center lg:col-span-6 xl:col-span-5">
            <div className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[10px] tracking-wider text-emerald-300 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('auth.heroBadge', 'VEHICLE INSPECTION & AUDIT PLATFORM')}</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl xl:text-4xl text-balance leading-tight">
              {t('auth.heroTitle', 'Every inspection, under control.')}
            </h1>
            <p className="mt-1.5 max-w-[44ch] text-xs sm:text-[13px] leading-relaxed text-white/70">
              {t('auth.heroSubtitle', 'Sign in to triage requests, verify 360° checklist evidence, and keep bank workspaces audit-ready.')}
            </p>

            {/* Frosted Obsidian Glass Login Card */}
            <div className="mt-3.5 sm:mt-4 rounded-2xl border border-white/12 bg-[#090d14]/85 p-4 sm:p-5 lg:p-6 backdrop-blur-2xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
                    {t('auth.authentication', 'AUTHENTICATION')}
                  </p>
                  <p className="mt-0.5 text-sm sm:text-base font-medium text-white">
                    {t('auth.signInTitle', 'Sign in to your account')}
                  </p>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-white/60">
                  {t('auth.adminOnly', 'ADMIN ONLY')}
                </span>
              </div>

              <LoginForm />
            </div>

            {/* Mini Dossier Feature Strip */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {DOSSIER_BADGES.map((item) => (
                <div
                  key={item.label}
                  className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <item.icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-white/90 leading-tight">
                      {item.label}
                    </p>
                    <p className="truncate text-[9px] text-white/50 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Space showcasing euro.png with Floating HUD Telemetry */}
          <div className="hidden lg:col-span-6 lg:flex xl:col-span-7 flex-col justify-between self-stretch py-2 pl-4 xl:pl-10 pointer-events-none">
            {/* Top Floating HUD Widget */}
            <div className="pointer-events-auto ml-auto max-w-[280px] rounded-2xl border border-white/15 bg-black/50 p-3.5 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/30">
              <div className="flex items-center justify-between font-mono text-[10px] text-white/60">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  360° LIDAR HUD
                </span>
                <span>CH-01 · ACTIVE</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-white/95">
                Dynamic Vehicle Telemetry
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                Live sensor scanning calibrated against Euro Assist standards with cryptographic evidence trails.
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[9px] text-white/50">
                <span>EVIDENCE PROTOCOL</span>
                <span className="text-white/80">#EA-9842-SEC</span>
              </div>
            </div>

            {/* Bottom Floating Network Pill */}
            <div className="pointer-events-auto ml-auto flex items-center gap-3 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/30">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/15 text-emerald-400">
                <ShieldCheck className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Euro Assist Verified Network
                </p>
                <p className="font-mono text-[9px] text-white/60">
                  Stage 01 · Bank Scopes Secured
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Editorial Footer */}
        <footer className="flex shrink-0 flex-col gap-1 border-t border-white/10 pt-2.5 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 INSPECT · EURO ASSIST PARTNER NETWORK</p>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>AUDIT PROTOCOL V2.4</span>
            <span className="size-1 rounded-full bg-white/20" />
            <span>ZERO-TRUST SCOPED</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
