import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bank as BankIcon,
  CaretDown,
  Check,
  MagnifyingGlass,
  Gear,
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/features/workspaces/workspace-context';

export function BankWorkspaceDropdown() {
  const { t } = useTranslation();
  const { user, banks, activeBankId, setActiveBankId } = useWorkspace();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeBank = useMemo(
    () => banks.find((b) => b.id === activeBankId) || banks[0],
    [banks, activeBankId],
  );

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);

    // Auto-focus search input when opening if search is visible
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filtered banks for search
  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks;
    const term = searchTerm.toLowerCase().trim();
    return banks.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        (b.code && b.code.toLowerCase().includes(term)),
    );
  }, [banks, searchTerm]);

  if (banks.length === 0) {
    return null;
  }

  // Single bank: Render a clean, polished status pill
  if (banks.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-hairline bg-white/90 px-3 py-1.5 shadow-2xs backdrop-blur-xs">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-ink text-white shadow-2xs">
          <BankIcon className="size-3.5" />
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-xs font-semibold text-ink max-w-[130px] sm:max-w-[180px]">
            {activeBank?.name}
          </span>
          {activeBank?.code && (
            <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-mute border border-hairline">
              {activeBank.code}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`group flex items-center gap-2 rounded-xl border bg-white px-2.5 py-1.5 text-start transition-all duration-200 cursor-pointer shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
          isOpen
            ? 'border-ink/40 ring-2 ring-ink/10 shadow-sm'
            : 'border-hairline hover:border-ink/25 hover:bg-paper/40'
        }`}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ink text-white shadow-2xs transition-transform duration-200 group-hover:scale-105">
          <BankIcon className="size-3.5" />
        </span>

        <div className="flex items-center gap-1.5 min-w-0 pe-1">
          <span className="truncate text-xs font-semibold text-ink max-w-[100px] sm:max-w-[160px]">
            {activeBank?.name}
          </span>
          {activeBank?.code && (
            <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-ink-mute border border-hairline shrink-0">
              {activeBank.code}
            </span>
          )}
        </div>

        <CaretDown
          className={`size-3 text-ink-mute transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-ink' : 'group-hover:text-ink'
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute end-0 top-full mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-hairline/70 bg-paper/50 px-3.5 py-2.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-mute">
              {t('bankWorkspace.switchWorkspace', 'Switch Bank')}
            </span>
            <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] font-medium text-ink-soft border border-hairline">
              {t('bankWorkspace.banksCount', { count: banks.length, defaultValue: `${banks.length} Banks` })}
            </span>
          </div>

          {/* Search bar (if more than 3 banks) */}
          {banks.length > 3 && (
            <div className="p-2 border-b border-hairline/60">
              <div className="relative flex items-center">
                <MagnifyingGlass className="absolute start-2.5 size-3.5 text-ink-mute" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('bankWorkspace.filterBanks', 'Filter banks...')}
                  className="w-full rounded-lg bg-paper/60 ps-8 pe-3 py-1.5 text-xs text-ink placeholder:text-ink-mute/70 border border-hairline/60 outline-none focus:bg-white focus:border-ink/30 transition-all text-start"
                />
              </div>
            </div>
          )}

          {/* Bank Items List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {filteredBanks.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-mute">
                {t('bankWorkspace.noBanksFound', 'No matching banks found')}
              </div>
            ) : (
              filteredBanks.map((bank) => {
                const isSelected = bank.id === activeBankId;
                const initials = (bank.code || bank.name.slice(0, 3)).toUpperCase();

                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      setActiveBankId(bank.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-start transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-white shadow-xs font-semibold'
                        : 'text-ink-soft hover:bg-paper hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold uppercase transition-colors ${
                          isSelected
                            ? 'bg-white/20 text-white border border-white/25'
                            : 'bg-paper text-ink border border-hairline'
                        }`}
                      >
                        {initials.slice(0, 3)}
                      </span>

                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs font-medium">
                          {bank.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {bank.code && (
                            <span
                              className={`font-mono text-[10px] uppercase tracking-wider ${
                                isSelected ? 'text-white/70' : 'text-ink-mute'
                              }`}
                            >
                              {bank.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                        <Check className="size-3" weight="bold" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer for Admins */}
          {user?.role === 'SUPER_ADMIN' && (
            <div className="border-t border-hairline/70 bg-paper/40 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/banks');
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-ink-mute hover:bg-paper hover:text-ink transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Gear className="size-3.5" />
                  {t('titles.banks', 'Manage Banks')}
                </span>
                <span className="font-mono text-[10px] text-accent font-semibold">
                  →
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
