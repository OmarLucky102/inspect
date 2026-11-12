import { useMemo } from 'react';
import { Bank as BankIcon, Gear } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { BankSelect } from '@/components/ui/bank-select';

export function BankWorkspaceDropdown() {
  const { t } = useTranslation();
  const { user, banks, activeBankId, setActiveBankId } = useWorkspace();
  const navigate = useNavigate();

  const activeBank = useMemo(
    () => banks.find((b) => b.id === activeBankId) || banks[0],
    [banks, activeBankId],
  );

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
    <BankSelect
      banks={banks}
      value={activeBank?.id || ''}
      onChange={setActiveBankId}
      size="sm"
      align="end"
      headerTitle={t('bankWorkspace.switchWorkspace', 'Switch Bank')}
      ariaLabel={t('bankWorkspace.switchWorkspace', 'Switch Bank')}
      triggerClassName="max-w-[200px] sm:max-w-[260px] shadow-2xs"
      menuFooter={
        user?.role === 'SUPER_ADMIN'
          ? (close) => (
              <button
                type="button"
                onClick={() => {
                  close();
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
            )
          : undefined
      }
    />
  );
}
