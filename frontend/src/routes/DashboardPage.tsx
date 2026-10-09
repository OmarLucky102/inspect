/** Stage-1 overview content (shell provides header + sidebar). */
export function DashboardPage() {
  return (
    <section>
      <p className="font-mono text-[11px] tracking-[0.24em] text-ink-mute">
        STAGE 01 · AUTH WIRED
      </p>
      <h2 className="mt-3 max-w-[24ch] text-3xl font-semibold tracking-tighter text-balance sm:text-4xl">
        Signed in. Auth flow is live against /api/v1/auth.
      </h2>
      <div className="mt-6 grid max-w-3xl gap-4 rounded-3xl border border-hairline bg-white p-6 shadow-[0_20px_40px_-24px_rgba(20,23,26,0.25)] sm:p-8">
        <div className="flex items-center justify-between border-b border-hairline pb-4 font-mono text-[11px] tracking-[0.14em] text-ink-mute">
          <span>CONTRACT</span>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent-deep">
            CONNECTED
          </span>
        </div>
        <ul className="space-y-2.5 font-mono text-[13px] text-ink-soft">
          <li>POST /auth/login — email + password, httpOnly cookie set</li>
          <li>POST /auth/refresh — silent rotation with credentials</li>
          <li>POST /auth/logout — revoke + clear cookie</li>
        </ul>
        <p className="text-sm leading-relaxed text-ink-soft">
          Use the sidebar to open each module. Requests, checklists, banks and
          users land in stage 2 behind this same protected shell and 401
          auto-refresh.
        </p>
      </div>
    </section>
  )
}
