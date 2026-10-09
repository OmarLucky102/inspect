import { ClipboardText } from '@phosphor-icons/react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'

export function RequestsPage() {
  return (
    <ModuleEmptyState
      kicker="INSPECTION · PIPELINE"
      title="Inspection requests, triaged in one queue."
      body="Intake, assignment and review status will stream from the inspection module here. No mock rows — real data only once the endpoint lands."
      icon={ClipboardText}
      actionLabel="New request"
    />
  )
}
