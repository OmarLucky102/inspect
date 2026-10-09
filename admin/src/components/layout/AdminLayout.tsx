import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AdminHeader } from './AdminHeader'
import { Sidebar } from './Sidebar'

const TITLES: Record<string, { title: string; meta: string }> = {
  '/': { title: 'Dashboard', meta: 'INSPECT · OVERVIEW' },
  '/requests': { title: 'Requests', meta: 'INSPECTION · PIPELINE' },
  '/checklists': { title: 'Checklists', meta: 'INSPECTION · EVIDENCE' },
  '/banks': { title: 'Banks', meta: 'ORGANIZATION · WORKSPACES' },
  '/users': { title: 'Users', meta: 'IDENTITY · ACCESS' },
}

/** Protected shell: sidebar + sticky header + routed content. */
export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const active = TITLES[location.pathname] ?? {
    title: 'Admin',
    meta: 'INSPECT',
  }

  // Close the drawer on Escape. Route-change closing is handled by
  // SidebarBody onNavigate (link click) + overlay click.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <div className="min-h-[100dvh] bg-bone lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-col">
        <AdminHeader
          onMenu={() => setMobileOpen(true)}
          title={active.title}
          meta={active.meta}
        />
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
