import {
  Bank,
  ClipboardText,
  ShieldCheck,
  Compass,
} from '@phosphor-icons/react'

const DOSSIER = [
  {
    icon: ClipboardText,
    title: 'Requests pipeline',
    body: 'Intake, checklist evidence and review in one trail.',
  },
  {
    icon: ShieldCheck,
    title: 'Calibrated control',
    body: 'Role-scoped access with auditable decisions.',
  },
  {
    icon: Bank,
    title: 'Bank workspaces',
    body: 'Memberships and inspection scopes per bank.',
  },
]

/**
 * Editorial side panel — Tool / precision-instrument spine.
 * Bottom-left text over tonal surface + technical grid (no stock photo).
 */
export function AuthSidePanel() {
  return (
    <aside className="vignette relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
      <div className="tech-grid absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(90%_70%_at_80%_10%,rgba(14,107,78,0.5),transparent_60%)]"
        aria-hidden
      />

      <div className="relative flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
          <Compass className="size-4.5" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-[0.18em]">INSPECT</p>
          <p className="font-mono text-[10px] tracking-[0.22em] text-white/55">
            ADMIN CONSOLE
          </p>
        </div>
      </div>

      <div className="relative mt-10 max-w-[480px]">
        <p className="font-mono text-[11px] tracking-[0.24em] text-white/55">
          VEHICLE INSPECTION · STAGE 01
        </p>
        <h1 className="mt-4 text-4xl leading-[1.02] font-semibold tracking-tighter text-balance xl:text-[52px]">
          Every inspection, under control.
        </h1>
        <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-white/70">
          Sign in to triage requests, verify checklist evidence and keep bank
          workspaces audit-ready.
        </p>

        <dl className="mt-8 space-y-0 border-t border-white/12">
          {DOSSIER.map((row) => (
            <div
              key={row.title}
              className="flex items-start gap-3.5 border-b border-white/12 py-4"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/8">
                <row.icon className="size-4" aria-hidden />
              </span>
              <div>
                <dt className="text-sm font-medium">{row.title}</dt>
                <dd className="mt-0.5 text-[13px] leading-snug text-white/60">
                  {row.body}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative mt-10 flex items-center justify-between border-t border-white/12 pt-5 font-mono text-[10px] tracking-[0.18em] text-white/45">
        <span>INDEX 001 — ACCESS</span>
        <span>ROLE-SCOPED · AUDITED</span>
      </div>
    </aside>
  )
}
