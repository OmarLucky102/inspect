import { UsersThree, CircleNotch, WarningCircle, X, Buildings, Check, Star } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import { fetchUsers, fetchUserById, updateUserBanks } from '@/features/users/api'
import { fetchBanks, type Bank } from '@/features/banks/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'
import type { UserProfile } from '@/features/workspaces/api'

export function UsersPage() {
  const { t } = useTranslation()
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
        <p>{t('common.error', 'You do not have permission to view this page.')}</p>
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
        <p className="text-red-500 mb-4">{t('common.error', 'Failed to load users.')}</p>
        <button onClick={() => refetch()} className="text-sm font-medium underline cursor-pointer">
          {t('common.retry', 'Try again')}
        </button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <ModuleEmptyState
        kicker={t('titles.usersMeta', 'IDENTITY · ACCESS')}
        title={t('users.title', 'Users, roles and account status.')}
        body={t('users.subtitle', 'Role-scoped accounts across super-admin to viewer will be administered here once the identity user endpoints are exposed.')}
        icon={UsersThree}
        actionLabel={t('common.addNew', 'Invite user')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline bg-paper/50 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-ink">{t('users.title', 'System Users')}</h2>
            <p className="text-xs text-ink-mute mt-0.5">{t('users.subtitle', 'Manage user access and bank affiliations across EuroInspect 360.')}</p>
          </div>
          <span className="text-xs font-mono text-ink-mute bg-bone px-2 py-1 rounded">
            {data.length} {t('users.total', 'TOTAL')}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-bone text-ink-mute font-medium border-b border-hairline">
              <tr>
                <th className="px-5 py-3 text-start">{t('users.thName', 'Name')}</th>
                <th className="px-5 py-3 text-start">{t('users.thEmail', 'Email')}</th>
                <th className="px-5 py-3 text-start">{t('users.thRole', 'Role')}</th>
                <th className="px-5 py-3 text-start">{t('users.thAssignedBanks', 'Assigned Banks')}</th>
                <th className="px-5 py-3 text-start">{t('users.thStatus', 'Status')}</th>
                <th className="px-5 py-3 text-end">{t('users.thActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-paper/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-ink">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-5 py-3 text-ink-soft ltr-force text-start" dir="ltr">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-md bg-ink-mute/10 px-2 py-1 text-[11px] font-mono font-medium text-ink">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.banks && u.banks.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {u.banks.map((b) => (
                          <span
                            key={b.id}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                              b.isPrimary
                                ? 'bg-accent/10 border-accent/30 text-accent font-semibold'
                                : 'bg-paper border-hairline text-ink'
                            }`}
                            title={b.name}
                          >
                            {b.code || b.name}
                            {b.isPrimary && (
                              <span title={t('users.primaryBank', 'Primary Bank')}>
                                <Star weight="fill" className="size-3 text-amber-500" />
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-mute italic">{t('users.noBanks', 'No banks assigned')}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      {t('common.active', 'Active')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUserId(u.id || null)}
                      className="cursor-pointer text-xs"
                    >
                      {t('users.manage', 'Manage')}
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
            className="absolute top-4 end-4 text-ink-mute hover:text-ink transition-colors cursor-pointer modal-close"
            onClick={() => setSelectedUserId(null)}
          >
            <X className="size-5" />
          </button>
          
          <h3 className="font-semibold text-lg mb-4 text-ink">{t('users.userDetailsTitle', 'User Details & Bank Affiliations')}</h3>
          {isUserLoading ? (
            <div className="flex justify-center py-10">
              <CircleNotch className="size-6 animate-spin text-ink-mute" />
            </div>
          ) : selectedUser ? (
            <UserDetailsPanel
              key={selectedUserId}
              userId={selectedUserId}
              user={selectedUser}
              onClose={() => setSelectedUserId(null)}
            />
          ) : (
            <p className="text-red-500 text-sm">{t('common.error', 'Failed to load user details.')}</p>
          )}
        </div>
      )}
    </div>
  )
}

function UserDetailsPanel({
  userId,
  user,
  onClose,
}: {
  userId: string
  user: UserProfile
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: allBanks = [], isLoading: isBanksLoading } = useQuery<Bank[]>({
    queryKey: ['banks'],
    queryFn: fetchBanks,
  })

  // Selected bank IDs initialized directly from user prop
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>(
    () => user.banks?.map((b) => b.id) || [],
  )
  const [primaryBankId, setPrimaryBankId] = useState<string | null>(() => {
    const primary = user.banks?.find((b) => b.isPrimary)
    return primary ? primary.id : user.banks?.[0]?.id || null
  })

  const toggleBank = (bankId: string) => {
    setSelectedBankIds((prev) => {
      const exists = prev.includes(bankId)
      if (exists) {
        const next = prev.filter((id) => id !== bankId)
        if (primaryBankId === bankId) {
          setPrimaryBankId(next[0] || null)
        }
        return next
      } else {
        const next = [...prev, bankId]
        if (!primaryBankId) {
          setPrimaryBankId(bankId)
        }
        return next
      }
    })
  }

  const saveMutation = useMutation({
    mutationFn: () => updateUserBanks(userId, selectedBankIds, primaryBankId || undefined),
    onSuccess: () => {
      toast.success('Assigned banks updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', userId] })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update user banks'))
    },
  })

  return (
    <div className="space-y-6">
      {/* User Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-paper/60 border border-hairline text-sm">
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">NAME</p>
          <p className="text-ink font-medium">{user.firstName} {user.lastName}</p>
        </div>
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">EMAIL</p>
          <p className="text-ink">{user.email}</p>
        </div>
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">ROLE</p>
          <span className="inline-flex rounded-md bg-ink-mute/10 px-2 py-0.5 text-xs font-mono font-medium text-ink">
            {user.role}
          </span>
        </div>
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">PHONE</p>
          <p className="text-ink">{user.phone || 'N/A'}</p>
        </div>
      </div>

      {/* Multi-Bank Assignment Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm text-ink flex items-center gap-1.5">
              <Buildings className="size-4 text-ink-mute" />
              Assigned Banks ({selectedBankIds.length})
            </h4>
            <p className="text-xs text-ink-mute">
              Select all banks this user belongs to. A user can be assigned to multiple banks at the same time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Done
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Bank Assignments'}
            </Button>
          </div>
        </div>

        {isBanksLoading ? (
          <div className="flex justify-center py-6">
            <CircleNotch className="size-5 animate-spin text-ink-mute" />
          </div>
        ) : allBanks.length === 0 ? (
          <p className="text-xs text-ink-mute italic">No banks available in the system.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {allBanks.map((b) => {
              const isChecked = selectedBankIds.includes(b.id)
              const isPrimary = primaryBankId === b.id

              return (
                <div
                  key={b.id}
                  onClick={() => toggleBank(b.id)}
                  className={`flex flex-col justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-accent/40 bg-accent/[0.03] shadow-xs'
                      : 'border-hairline bg-white hover:border-ink/20 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-accent border-accent text-white'
                            : 'border-hairline bg-white'
                        }`}
                      >
                        {isChecked && <Check weight="bold" className="size-3" />}
                      </div>
                      <div>
                        <span className="font-semibold text-xs font-mono text-ink mr-1">
                          {b.code}
                        </span>
                        <p className="text-xs text-ink-soft leading-tight line-clamp-1">{b.name}</p>
                      </div>
                    </div>
                  </div>

                  {isChecked && (
                    <div className="mt-2 pt-2 border-t border-hairline/60 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPrimaryBankId(b.id)
                        }}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                          isPrimary
                            ? 'bg-amber-100 text-amber-800 font-semibold'
                            : 'text-ink-mute hover:text-ink hover:bg-paper'
                        }`}
                      >
                        <Star weight={isPrimary ? 'fill' : 'regular'} className={`size-3 ${isPrimary ? 'text-amber-500' : ''}`} />
                        {isPrimary ? 'Primary Bank' : 'Set as Primary'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

