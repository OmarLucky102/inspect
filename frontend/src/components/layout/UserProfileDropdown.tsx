import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserCircle, ArrowSquareOut, X } from '@phosphor-icons/react'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { UserProfileForm } from '@/features/users/components/UserProfileForm'
import { ThemeSelector } from './ThemeToggle'
import { LanguageSelector } from './LanguageToggle'

export function UserProfileDropdown() {
  const { t } = useTranslation()
  const { user } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '..'

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className="relative">
      {/* Interactive Avatar Circle Button (Click to toggle) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative flex size-9 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-semibold text-white shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
          isOpen
            ? 'ring-2 ring-accent ring-offset-2 ring-offset-bone'
            : 'hover:ring-2 hover:ring-accent/70 hover:ring-offset-1 hover:ring-offset-bone'
        }`}
        title={
          user
            ? `${user.firstName} ${user.lastName} (${user.role}) · Click to toggle profile`
            : 'Toggle profile'
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Toggle user profile menu"
      >
        {initials}
        <span
          className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white ${
            user?.isActive !== false ? 'bg-emerald-500' : 'bg-zinc-400'
          }`}
        />
      </button>

      {/* Anchored Profile Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="User profile settings"
          className="fixed inset-x-3 top-18 sm:absolute sm:inset-auto sm:end-0 sm:top-full sm:mt-2.5 z-50 w-auto sm:w-[500px] md:w-[540px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-hairline bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 max-h-[calc(100dvh-5.5rem)] flex flex-col"
        >
          {/* Dropdown Header */}
          <div className="flex items-center justify-between border-b border-hairline px-4 sm:px-5 py-3 bg-paper/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-ink text-white shadow-2xs">
                <UserCircle className="size-4" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-ink leading-tight">
                  {t('profile.accountProfile', 'Account Profile')}
                </h3>
                <p className="text-[10px] text-ink-mute">
                  {t('profile.signedInAs', 'Signed in as')} {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-ink-soft hover:bg-paper hover:text-ink transition-colors border border-hairline/80 bg-white"
                title="Open full profile page"
              >
                <ArrowSquareOut className="size-3" />
                <span className="hidden sm:inline">{t('common.fullPage', 'Full Page')}</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close profile menu"
                className="cursor-pointer rounded-md p-1 text-ink-mute hover:bg-paper hover:text-ink transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Theme Appearance Selector */}
          <div className="flex items-center justify-between gap-3 border-b border-hairline bg-paper/40 px-4 sm:px-5 py-2 shrink-0">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink leading-tight">
                {t('common.theme', 'Theme')}
              </p>
              <p className="text-[10px] text-ink-mute truncate">
                {t('profile.themeSystem', 'Light, dark, or system preference')}
              </p>
            </div>
            <ThemeSelector className="w-44 shrink-0" />
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between gap-3 border-b border-hairline bg-paper/40 px-4 sm:px-5 py-2 shrink-0">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink leading-tight">
                {t('common.language', 'Language')}
              </p>
              <p className="text-[10px] text-ink-mute truncate">English · العربية</p>
            </div>
            <LanguageSelector variant="segmented" />
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <UserProfileForm
              onSuccess={() => {}}
              onCancel={() => setIsOpen(false)}
              showCancelButton
            />
          </div>
        </div>
      )}
    </div>
  )
}
