import { UsersThree, CircleNotch, WarningCircle, X } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import { fetchUsers, fetchUserById } from '@/features/users/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'

export function UsersPage() {
  const { user } = useWorkspace()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: user?.role === 'SUPER_ADMIN',
  })

  const { data: selectedUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['users', selectedUserId],
    queryFn: () => fetchUserById(selectedUserId!),
    enabled: !!selectedUserId,
  })

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
        <WarningCircle className="size-12 mb-4 text-red-500" />
        <p>You do not have permission to view this page.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <CircleNotch className="size-8 animate-spin text-ink-mute" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">Failed to load users.</p>
        <button onClick={() => refetch()} className="text-sm font-medium underline">
          Try again
        </button>
      </div>
    )
  }

  if (!data || data.length === 0) {
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline bg-paper/50 flex justify-between items-center">
          <h2 className="font-semibold text-ink">System Users</h2>
          <span className="text-xs font-mono text-ink-mute bg-bone px-2 py-1 rounded">
            {data.length} TOTAL
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bone text-ink-mute font-medium border-b border-hairline">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-paper/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-ink">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-md bg-ink-mute/10 px-2 py-1 text-[11px] font-mono font-medium text-ink">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedUserId(u.id)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserId && (
        <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden relative p-6">
          <button 
            className="absolute top-4 right-4 text-ink-mute hover:text-ink"
            onClick={() => setSelectedUserId(null)}
          >
            <X className="size-5" />
          </button>
          
          <h3 className="font-semibold text-lg mb-4">User Details</h3>
          {isUserLoading ? (
            <div className="flex justify-center py-10">
              <CircleNotch className="size-6 animate-spin text-ink-mute" />
            </div>
          ) : selectedUser ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ink-mute font-medium text-xs mb-1">ID</p>
                <p className="font-mono text-ink">{selectedUser.id}</p>
              </div>
              <div>
                <p className="text-ink-mute font-medium text-xs mb-1">ROLE</p>
                <p className="text-ink">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-ink-mute font-medium text-xs mb-1">FIRST NAME</p>
                <p className="text-ink">{selectedUser.firstName}</p>
              </div>
              <div>
                <p className="text-ink-mute font-medium text-xs mb-1">LAST NAME</p>
                <p className="text-ink">{selectedUser.lastName}</p>
              </div>
              <div>
                <p className="text-ink-mute font-medium text-xs mb-1">EMAIL</p>
                <p className="text-ink">{selectedUser.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-500">Failed to load user details.</p>
          )}
        </div>
      )}
    </div>
  )
}
