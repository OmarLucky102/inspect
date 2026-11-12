/**
 * AppShellSkeleton
 * High-fidelity loading skeleton matching AdminLayout (sidebar + header + content placeholder).
 * Used during authentication session checks and workspace loading to eliminate layout shift,
 * flashes of the login page, or momentary "access denied" flashes on reload.
 */
export function AppShellSkeleton() {
  return (
    <div
      className="min-h-[100dvh] bg-bone lg:grid lg:grid-cols-[260px_minmax(0,1fr)] animate-pulse"
      aria-label="Loading application"
      role="status"
    >
      {/* Sidebar Skeleton (desktop) */}
      <aside className="hidden border-r border-hairline bg-paper/90 p-5 lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-6">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-ink/10" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-ink/10" />
              <div className="h-2.5 w-16 rounded bg-ink/10" />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2 pt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <div className="size-5 rounded-lg bg-ink/10 shrink-0" />
                <div
                  className="h-3.5 rounded bg-ink/10"
                  style={{ width: `${55 + (i % 3) * 18}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Pill at Bottom */}
        <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
          <div className="size-9 rounded-full bg-ink/10 shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3.5 w-24 rounded bg-ink/10" />
            <div className="h-2.5 w-16 rounded bg-ink/10" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-col">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-20 border-b border-hairline bg-paper/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-ink/10 lg:hidden" />
              <div className="space-y-1">
                <div className="h-4 w-32 rounded bg-ink/10" />
                <div className="h-2.5 w-20 rounded bg-ink/10" />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-36 rounded-xl bg-ink/10" />
              <div className="size-8 rounded-xl bg-ink/10" />
            </div>
          </div>
        </header>

        {/* Body Skeleton */}
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {/* Top Stat Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-hairline bg-paper p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-24 rounded bg-ink/10" />
                    <div className="size-8 rounded-xl bg-ink/10" />
                  </div>
                  <div className="h-7 w-28 rounded-lg bg-ink/10" />
                  <div className="h-2.5 w-20 rounded bg-ink/10" />
                </div>
              ))}
            </div>

            {/* Main Content Block / Chart / Table Skeleton */}
            <div className="rounded-3xl border border-hairline bg-paper p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div className="h-4 w-40 rounded bg-ink/10" />
                <div className="h-8 w-28 rounded-xl bg-ink/10" />
              </div>
              <div className="space-y-3 pt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-hairline/50 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-ink/10 shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-36 rounded bg-ink/10" />
                        <div className="h-2.5 w-24 rounded bg-ink/10" />
                      </div>
                    </div>
                    <div className="h-6 w-20 rounded-full bg-ink/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

