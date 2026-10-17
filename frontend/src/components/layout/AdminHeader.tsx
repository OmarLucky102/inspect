import { CircleNotch, List, SignOut } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/use-logout'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { BankWorkspaceDropdown } from './BankWorkspaceDropdown'

interface AdminHeaderProps {
  onMenu: () => void
  title: string
  meta: string
}

export function AdminHeader({ onMenu, title, meta }: AdminHeaderProps) {
  const logoutMutation = useLogout()
  const { user } = useWorkspace()
  
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '..'

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-bone/85 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open navigation"
            className="cursor-pointer rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink lg:hidden"
          >
            <List className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-mono text-[10px] tracking-[0.22em] text-ink-mute">
              {meta}
            </p>
            <h1 className="truncate text-[17px] font-semibold tracking-tight">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {/* Bank Workspace Selector Dropdown */}
          <BankWorkspaceDropdown />

          <div className="h-5 w-[1px] bg-hairline hidden sm:block" />

          <span
            aria-hidden
            className="hidden size-9 items-center justify-center rounded-full bg-ink font-mono text-[11px] text-white sm:flex"
            title={user ? `${user.firstName} ${user.lastName} (${user.role})` : undefined}
          >
            {initials}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <CircleNotch className="animate-spin" aria-hidden />
            ) : (
              <SignOut aria-hidden />
            )}
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
