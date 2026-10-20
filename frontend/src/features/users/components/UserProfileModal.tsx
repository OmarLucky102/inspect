import { useEffect } from 'react'
import { X, UserCircle, ArrowSquareOut } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { UserProfileForm } from './UserProfileForm'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-title"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white shadow-xs">
              <UserCircle className="size-5" />
            </span>
            <div>
              <h3
                id="user-profile-modal-title"
                className="text-base font-semibold text-ink"
              >
                User Profile
              </h3>
              <p className="text-xs text-ink-mute">
                Account identity, permissions, and profile details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-soft hover:bg-paper hover:text-ink transition-colors"
              title="Open profile page"
            >
              <ArrowSquareOut className="size-3.5" />
              <span className="hidden sm:inline">Full Page</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile modal"
              className="cursor-pointer rounded-lg p-1.5 text-ink-mute hover:bg-paper hover:text-ink transition-colors"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <UserProfileForm
            onSuccess={() => {
              // Keep modal updated; user can close or continue editing
            }}
            onCancel={onClose}
            showCancelButton
          />
        </div>
      </div>
    </div>
  )
}
