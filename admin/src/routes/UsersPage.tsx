import { UsersThree } from '@phosphor-icons/react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'

export function UsersPage() {
  return (
    <ModuleEmptyState
      kicker="IDENTITY · ACCESS"
      title="Users, roles and account status."
      body="Role-scoped accounts across super-admin to viewer will be administered here once the identity user endpoints are exposed."
      icon={UsersThree}
      actionLabel="Invite user"
    />
  )
}
