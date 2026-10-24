import { Compass, X } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { NAV_SECTIONS } from './nav'
import { useWorkspace } from '@/features/workspaces/workspace-context'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useWorkspace()
  const { t } = useTranslation()
  
  // Filter sections based on role. SUPER_ADMIN sees everything.
  const isSuperAdmin =
    user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN'
  const canManageRepresentatives = isSuperAdmin

  const getSectionTitle = (title: string) => {
    switch (title.toLowerCase()) {
      case 'operate':
        return t('nav.operate', 'Operate')
      case 'configure':
        return t('nav.configure', 'Configure')
      case 'system':
        return t('nav.system', 'System')
      default:
        return title
    }
  }

  const getItemLabel = (label: string) => {
    switch (label) {
      case 'Dashboard':
        return t('nav.dashboard', 'Dashboard')
      case 'Requests':
        return t('nav.requests', 'Requests')
      case 'Representatives':
        return t('nav.representatives', 'Representatives')
      case 'Banks':
        return t('nav.banks', 'Banks')
      case 'Vehicle Settings':
        return t('nav.vehicleSettings', 'Vehicle Settings')
      case 'Users':
        return t('nav.users', 'Users')
      default:
        return label
    }
  }

  const filteredSections = NAV_SECTIONS.map((section) => {
    if (section.title === 'System' && !isSuperAdmin) return null
    
    const filteredItems = section.items.filter((item) => {
      if (item.label === 'Banks' && !isSuperAdmin) return false
      if (item.label === 'Vehicle Settings' && !isSuperAdmin) return false
      if (item.label === 'Representatives' && !canManageRepresentatives) return false
      return true
    })
    
    if (filteredItems.length === 0) return null
    return { ...section, items: filteredItems }
  }).filter(Boolean) as typeof NAV_SECTIONS

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white">
          <Compass className="size-4.5" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-[0.18em]">
            {t('common.inspect', 'INSPECT')}
          </p>
          <p className="font-mono text-[10px] tracking-[0.22em] text-ink-mute">
            {t('common.adminConsole', 'ADMIN CONSOLE')}
          </p>
        </div>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-4">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <p className="px-2.5 pb-2 font-mono text-[10px] tracking-[0.22em] text-ink-mute">
              {getSectionTitle(section.title).toUpperCase()}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                        isActive
                          ? 'bg-ink text-white shadow-[0_12px_24px_-14px_rgba(20,23,26,0.7)]'
                          : 'text-ink-soft hover:bg-paper hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'size-4.5 shrink-0',
                            isActive
                              ? 'text-white'
                              : 'text-ink-mute group-hover:text-ink',
                          )}
                          aria-hidden
                        />
                        {getItemLabel(item.label)}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-hairline p-4">
        <div className="rounded-xl bg-paper px-3.5 py-3 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-ink-mute">
          {t('common.systemNotice', 'STAGE 01 · AUTH LIVE')}
          <br />
          {t('common.stageModules', 'STAGE 02 · MODULES')}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: fixed column */}
      <aside className="hidden border-r rtl:border-r-0 rtl:border-l border-hairline bg-white lg:block">
        <div className="sticky top-0 h-[100dvh]">
          <SidebarBody />
        </div>
      </aside>

      {/* Mobile: drawer + overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={onClose}
          className={cn(
            'absolute inset-0 bg-ink/45 transition-opacity duration-200',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          className={cn(
            'absolute top-0 left-0 rtl:left-auto rtl:right-0 h-full w-[280px] bg-white shadow-2xl transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
          )}
          role="dialog"
          aria-label="Admin navigation"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute top-5 right-4 rtl:right-auto rtl:left-4 cursor-pointer rounded-lg p-1.5 text-ink-mute hover:bg-paper hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
          <SidebarBody onNavigate={onClose} />
        </aside>
      </div>
    </>
  )
}
