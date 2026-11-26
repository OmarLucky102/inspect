import { CircleNotch, List, SignOut } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/features/auth/use-logout';
import { BankWorkspaceDropdown } from './BankWorkspaceDropdown';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { UserProfileDropdown } from './UserProfileDropdown';

interface AdminHeaderProps {
  onMenu: () => void;
  title: string;
  meta: string;
}

export function AdminHeader({ onMenu, title, meta }: AdminHeaderProps) {
  const { t } = useTranslation();
  const logoutMutation = useLogout();

  return (
    <header className="glass-shell sticky top-0 z-30 border-b pt-safe">
      <div className="mx-auto flex h-14 sm:h-16 w-full max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={onMenu}
            aria-label={t('nav.openNavigation', 'Open navigation')}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent text-ink-soft transition-colors hover:border-hairline hover:bg-paper/70 hover:text-ink lg:hidden"
          >
            <List className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 leading-tight">
            <p className="hidden min-[380px]:block truncate font-mono text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.22em] text-ink-mute uppercase">
              {meta}
            </p>
            <h1 className="truncate text-sm sm:text-[17px] font-semibold tracking-tight text-ink">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Bank Selector Dropdown */}
          <BankWorkspaceDropdown />

          <div className="hidden h-5 w-px bg-hairline sm:block" />

          {/* Quick Theme & Language Controls */}
          <div className="hidden items-center gap-1.5 md:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {/* Interactive Profile Circle Avatar Dropdown */}
          <UserProfileDropdown />

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
            <span className="hidden sm:inline">
              {t('common.signOut', 'Sign out')}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
