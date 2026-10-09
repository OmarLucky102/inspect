import { ListChecks } from '@phosphor-icons/react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'

export function ChecklistsPage() {
  return (
    <ModuleEmptyState
      kicker="INSPECTION · EVIDENCE"
      title="Checklist templates, versioned and auditable."
      body="Checklist definitions and per-request evidence items will be managed here once the inspection endpoints are wired."
      icon={ListChecks}
      actionLabel="New checklist"
    />
  )
}
