import { Bank } from '@phosphor-icons/react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'

export function BanksPage() {
  return (
    <ModuleEmptyState
      kicker="ORGANIZATION · WORKSPACES"
      title="Bank workspaces and memberships."
      body="Banks, membership roles and inspection scopes will live here, backed by the organization module and bank-membership guard."
      icon={Bank}
      actionLabel="New bank"
    />
  )
}
