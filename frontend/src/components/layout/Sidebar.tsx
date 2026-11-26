import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CaretDown, SidebarSimple, X } from '@phosphor-icons/react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { NAV_SECTIONS, type NavItem } from './nav'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { getCdnAsset } from '@/lib/assets'
import { LanguageSelector } from './LanguageToggle'
import { ThemeSelector } from './ThemeToggle'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  onExpand?: () => void
}

function SidebarBody({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  onExpand,
  isMobileDrawer = false,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  onExpand?: () => void
  isMobileDrawer?: boolean
}) {
  const { user } = useWorkspace()
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const navRef = useRef<HTMLElement | null>(null)

  // Floating sliding liquid pill indicator state
  const [indicatorStyle, setIndicatorStyle] = useState<{
    x: number
    y: number
    width: number
    height: number
    opacity: number
  }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    opacity: 0,
  })
  const [indicatorReady, setIndicatorReady] = useState(false)
  const [isLanding, setIsLanding] = useState(false)

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

  const isGroupExpanded = (item: NavItem) => {
    if (collapsed) return false
    const isChildActive =
      pathname === item.to || pathname.startsWith(`${item.to}/`)
    return expandedGroups[item.to] ?? isChildActive
  }

  const toggleGroup = (item: NavItem) => {
    if (collapsed) {
      setExpandedGroups((prev) => ({
        ...prev,
        [item.to]: true,
      }))
      onExpand?.()
      return
    }
    const currentlyExpanded = isGroupExpanded(item)
    setExpandedGroups((prev) => ({
      ...prev,
      [item.to]: !currentlyExpanded,
    }))
  }

  const isItemActive = (item: NavItem) => {
    if (item.end) return pathname === item.to
    return pathname === item.to || pathname.startsWith(`${item.to}/`)
  }

  // Recalculates the active element's exact bounding box relative to the nav container
  const updateIndicator = useCallback(() => {
    const nav = navRef.current
    if (!nav) return

    const activeEl = nav.querySelector<HTMLElement>('[data-active="true"]')
    if (!activeEl) {
      setIndicatorStyle((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0 }))
      return
    }

    const navRect = nav.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()

    if (activeRect.width === 0 || activeRect.height === 0) {
      return
    }

    // Absolute position within the scrollable content of nav
    const x = activeRect.left - navRect.left + nav.scrollLeft
    const y = activeRect.top - navRect.top + nav.scrollTop

    setIndicatorStyle({
      x,
      y,
      width: activeRect.width,
      height: activeRect.height,
      opacity: 1,
    })

    if (!indicatorReady) {
      requestAnimationFrame(() => {
        setIndicatorReady(true)
      })
    }
  }, [indicatorReady])

  // Reposition immediately on route change or expand/collapse and trigger target landing wave
  useLayoutEffect(() => {
    updateIndicator()
    setIsLanding(true)
    const timer = setTimeout(() => setIsLanding(false), 520)
    return () => clearTimeout(timer)
  }, [pathname, collapsed, expandedGroups, updateIndicator])

  // Observe container size mutations (e.g. sidebar collapse transition)
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const resizeObserver = new ResizeObserver(() => {
      updateIndicator()
    })

    resizeObserver.observe(nav)
    if (nav.firstElementChild) {
      resizeObserver.observe(nav.firstElementChild)
    }

    window.addEventListener('resize', updateIndicator)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [updateIndicator])

  // Sync smoothly across the full 500ms sliding fluid curve & accordion transitions
  useEffect(() => {
    const t1 = setTimeout(updateIndicator, 80)
    const t2 = setTimeout(updateIndicator, 220)
    const t3 = setTimeout(updateIndicator, 380)
    const t4 = setTimeout(updateIndicator, 540)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [collapsed, expandedGroups, updateIndicator])

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-hairline',
          collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4',
          isMobileDrawer && 'pe-14',
        )}
      >
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-3 ps-1">
            <img
              src={getCdnAsset('logo.webp')}
              alt="Inspect Logo"
              className="h-8 w-auto max-w-[100px] shrink-0 rounded-lg object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold tracking-[0.18em]">
                {t('common.inspect', 'INSPECT')}
              </p>
              <p className="truncate font-mono text-[10px] tracking-[0.22em] text-ink-mute">
                {t('common.adminConsole', 'ADMIN CONSOLE')}
              </p>
            </div>
          </div>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={
              collapsed
                ? t('nav.expandSidebar', 'Expand sidebar')
                : t('nav.collapseSidebar', 'Collapse sidebar')
            }
            title={
              collapsed
                ? t('nav.expandSidebar', 'Expand sidebar')
                : t('nav.collapseSidebar', 'Collapse sidebar')
            }
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent text-ink-mute transition-colors hover:border-hairline hover:bg-paper hover:text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <SidebarSimple className="size-4.5 rtl:scale-x-[-1]" aria-hidden />
          </button>
        )}
      </div>

      <nav
        ref={navRef}
        aria-label="Admin sections"
        className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
      >
        {/* Floating Sliding Liquid-Glass Capsule Indicator */}
        <div
          aria-hidden="true"
          style={{
            transform: `translate3d(${indicatorStyle.x}px, ${indicatorStyle.y}px, 0)`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
            transitionProperty: indicatorReady
              ? 'transform, width, height, opacity'
              : 'opacity',
            transitionDuration: indicatorReady ? '500ms, 460ms, 460ms, 200ms' : '200ms',
            transitionTimingFunction: indicatorReady
              ? 'cubic-bezier(0.32, 1.14, 0.38, 1), cubic-bezier(0.25, 1, 0.35, 1), cubic-bezier(0.25, 1, 0.35, 1), ease'
              : 'ease',
          }}
          className={cn(
            'nav-liquid-indicator',
            isLanding && 'nav-liquid-impact',
          )}
        />

        {filteredSections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            {collapsed ? (
              <div
                aria-hidden
                className="mx-auto mb-2.5 h-px w-6 rounded-full bg-hairline"
              />
            ) : (
              <p className="truncate px-2.5 pb-2 font-mono text-[10px] tracking-[0.22em] text-neutral-500 dark:text-neutral-400 font-semibold">
                {getSectionTitle(section.title).toUpperCase()}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                if (item.children && item.children.length > 0) {
                  const isChildActive =
                    pathname === item.to || pathname.startsWith(`${item.to}/`)
                  const expanded = isGroupExpanded(item)
                  const isGroupActive = collapsed
                    ? isChildActive
                    : !expanded && isChildActive

                  return (
                    <li key={item.to}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(item)}
                        aria-expanded={expanded}
                        data-active={isGroupActive ? 'true' : undefined}
                        data-group-active={isChildActive ? 'true' : undefined}
                        title={collapsed ? getItemLabel(item.label) : undefined}
                        className={cn(
                          'group relative z-10 flex min-h-[40px] w-full cursor-pointer items-center rounded-xl text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                          collapsed
                            ? 'justify-center px-0 py-2'
                            : 'justify-between gap-3 px-3 py-2',
                          isGroupActive
                            ? 'font-semibold text-neutral-950 dark:text-white'
                            : isChildActive
                              ? 'nav-liquid-group-active font-semibold text-neutral-950 dark:text-white'
                              : expanded
                                ? 'border border-hairline/60 bg-paper/70 text-neutral-900 dark:text-white'
                                : 'nav-liquid-item text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white',
                        )}
                      >
                        <span className={cn('flex min-w-0 items-center', !collapsed && 'gap-3')}>
                          <item.icon
                            className={cn(
                              'size-4.5 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                              isChildActive
                                ? cn(
                                    'text-emerald-700 dark:text-emerald-400',
                                    isLanding && 'scale-110',
                                  )
                                : 'text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-200',
                            )}
                            aria-hidden
                          />
                          {!collapsed && (
                            <span
                              className={cn(
                                'truncate',
                                (isGroupActive || isChildActive)
                                  ? 'font-semibold text-neutral-950 dark:text-white'
                                  : 'text-neutral-600 group-hover:text-neutral-950 dark:text-neutral-400 dark:group-hover:text-white',
                              )}
                            >
                              {getItemLabel(item.label)}
                            </span>
                          )}
                        </span>

                        {!collapsed && (
                          <CaretDown
                            className={cn(
                              'size-3.5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                              expanded && 'rotate-180',
                              isChildActive
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-400',
                            )}
                            aria-hidden
                          />
                        )}
                      </button>

                      <div
                        aria-hidden={!expanded}
                        className={cn(
                          'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                          expanded
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'pointer-events-none grid-rows-[0fr] opacity-0',
                        )}
                      >
                        <div className="overflow-hidden">
                          <ul className="mt-1 ms-[21px] space-y-0.5 border-s border-hairline ps-3.5 py-0.5">
                            {item.children.map((child, idx) => {
                              const isChildItemActive = pathname === child.to
                              return (
                                <li
                                  key={child.to}
                                  style={{
                                    transitionDelay: expanded ? `${idx * 25}ms` : '0ms',
                                  }}
                                  className={cn(
                                    'group/branch relative transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                    expanded
                                      ? 'translate-y-0 opacity-100'
                                      : '-translate-y-1 opacity-0',
                                  )}
                                >
                                  <span
                                    aria-hidden
                                    className={cn(
                                      'pointer-events-none absolute start-[-14.5px] top-1/2 -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 z-10',
                                      isChildItemActive
                                        ? cn(
                                            'size-2 bg-emerald-600 dark:bg-emerald-400 ring-4 ring-emerald-500/25',
                                            isLanding && 'ring-6 ring-emerald-500/40 scale-125',
                                          )
                                        : 'size-1.5 bg-neutral-300 dark:bg-neutral-600 group-hover/branch:bg-neutral-500',
                                    )}
                                  />
                                  <NavLink
                                    to={child.to}
                                    tabIndex={expanded ? 0 : -1}
                                    onClick={onNavigate}
                                    data-active={isChildItemActive ? 'true' : undefined}
                                    className={cn(
                                      'group relative z-10 flex min-h-[36px] items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                                      isChildItemActive
                                        ? 'font-semibold text-neutral-950 dark:text-white'
                                        : 'nav-liquid-item text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white',
                                    )}
                                  >
                                    <child.icon
                                      className={cn(
                                        'size-4 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                                        isChildItemActive
                                          ? cn(
                                              'text-emerald-700 dark:text-emerald-400',
                                              isLanding && 'scale-115',
                                            )
                                          : 'text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-200',
                                      )}
                                      aria-hidden
                                    />
                                    <span
                                      className={cn(
                                        'truncate',
                                        isChildItemActive
                                          ? 'font-semibold text-neutral-950 dark:text-white'
                                          : 'text-neutral-600 group-hover:text-neutral-950 dark:text-neutral-400 dark:group-hover:text-white',
                                      )}
                                    >
                                      {t(child.labelKey, child.defaultLabel)}
                                    </span>
                                  </NavLink>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </div>
                    </li>
                  )
                }

                const isActive = isItemActive(item)

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      data-active={isActive ? 'true' : undefined}
                      title={collapsed ? getItemLabel(item.label) : undefined}
                      className={cn(
                        'group relative z-10 flex min-h-[40px] items-center rounded-xl py-2 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                        isActive
                          ? 'font-semibold text-neutral-950 dark:text-white'
                          : 'nav-liquid-item text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'size-4.5 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                          isActive
                            ? cn(
                                'text-emerald-700 dark:text-emerald-400',
                                isLanding && 'scale-110',
                              )
                            : 'text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-200',
                        )}
                        aria-hidden
                      />
                      {!collapsed && (
                        <span
                          className={cn(
                            'truncate',
                            isActive
                              ? 'font-semibold text-neutral-950 dark:text-white'
                              : 'text-neutral-600 group-hover:text-neutral-950 dark:text-neutral-400 dark:group-hover:text-white',
                          )}
                        >
                          {getItemLabel(item.label)}
                        </span>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-hairline/70 space-y-2.5', collapsed ? 'p-3' : 'p-4')}>
        {isMobileDrawer && !collapsed && (
          <div className="space-y-2 pb-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-ink-mute">
                {t('common.language', 'Language')}
              </span>
              <LanguageSelector variant="segmented" />
            </div>
            <ThemeSelector className="w-full" />
          </div>
        )}
        {collapsed ? (
          <div
            title="EuroInspect 360 · Live"
            className="glass-subtle mx-auto flex size-9 items-center justify-center rounded-xl"
          >
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
          </div>
        ) : (
          <div className="glass-subtle flex items-center justify-between rounded-xl px-3.5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-ink-mute">
            <span className="truncate font-medium">EUROINSPECT 360</span>
            <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-accent">
              <span className="relative flex size-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
              </span>
              LIVE
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar({
  mobileOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
  onExpand,
}: SidebarProps) {
  return (
    <>
      {/* Desktop: collapsible frosted glass column */}
      <aside
        className={cn(
          'glass-shell relative z-20 hidden shrink-0 border-e transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block',
          collapsed ? 'w-[74px]' : 'w-[264px]',
        )}
      >
        <div className="sticky top-0 h-[100dvh]">
          <SidebarBody
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            onExpand={onExpand}
          />
        </div>
      </aside>

      {/* Mobile: frosted glass drawer + dimmed overlay */}
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
            'absolute inset-0 bg-ink/45 backdrop-blur-xs transition-opacity duration-200',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          className={cn(
            'glass-popover absolute top-0 start-0 h-full w-[min(280px,85vw)] pt-safe pb-safe transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
          )}
          role="dialog"
          aria-label="Admin navigation"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute top-3 end-3 z-10 flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink-mute transition-colors hover:bg-paper/70 hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
          <SidebarBody onNavigate={onClose} isMobileDrawer />
        </aside>
      </div>
    </>
  )
}
