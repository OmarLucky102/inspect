import { useMemo, type ReactNode } from 'react'
import { Bank as BankIcon, Globe } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import type { WorkspaceBank } from '@/features/workspaces/api'
import { Select, type SelectOption } from './select'

export interface BankSelectProps {
  banks: WorkspaceBank[]
  value: string
  onChange: (bankId: string) => void
  includeAllOption?: boolean
  allValue?: string
  allLabel?: string
  headerTitle?: string
  placeholder?: string
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle'
  align?: 'stretch' | 'start' | 'end'
  className?: string
  triggerClassName?: string
  menuClassName?: string
  menuFooter?: ReactNode | ((close: () => void) => ReactNode)
}

/**
 * Unified bank dropdown shared by the top workspace switcher and dashboard analytics filter.
 */
export function BankSelect({
  banks,
  value,
  onChange,
  includeAllOption = false,
  allValue = 'all',
  allLabel,
  headerTitle,
  placeholder,
  ariaLabel,
  size = 'sm',
  variant = 'default',
  align = 'end',
  className,
  triggerClassName,
  menuClassName = 'w-72',
  menuFooter,
}: BankSelectProps) {
  const { t } = useTranslation()

  const options = useMemo<SelectOption[]>(() => {
    const mapped: SelectOption[] = banks.map((bank) => ({
      value: bank.id,
      label: bank.name,
      badge: bank.code || undefined,
      monogram: (bank.code || bank.name.slice(0, 3)).toUpperCase().slice(0, 3),
      keywords: `${bank.name} ${bank.code ?? ''}`,
    }))

    if (includeAllOption) {
      mapped.unshift({
        value: allValue,
        label: allLabel ?? t('dashboard.allBanksGlobal', 'All Banks (Global View)'),
        icon: <Globe className="size-3.5" weight="duotone" />,
        keywords: 'all global banks جميع البنوك نظرة عامة',
      })
    }

    return mapped
  }, [banks, includeAllOption, allValue, allLabel, t])

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      searchable="auto"
      searchThreshold={3}
      clearable={false}
      size={size}
      variant={variant}
      align={align}
      leadingIcon={<BankIcon className="size-3.5" />}
      placeholder={placeholder ?? t('dashboard.selectedBank', 'Selected Bank')}
      searchPlaceholder={t('bankWorkspace.filterBanks', 'Filter banks...')}
      emptyText={t('bankWorkspace.noBanksFound', 'No matching banks found')}
      ariaLabel={ariaLabel ?? t('bankWorkspace.switchWorkspace', 'Switch Bank')}
      menuHeader={{
        title: headerTitle ?? t('bankWorkspace.switchWorkspace', 'Switch Bank'),
        badge: t('bankWorkspace.banksCount', {
          count: banks.length,
          defaultValue: `${banks.length} Banks`,
        }),
      }}
      menuFooter={menuFooter}
      className={className}
      triggerClassName={triggerClassName}
      menuClassName={menuClassName}
    />
  )
}
