import {
  UsersThree,
  CircleNotch,
  WarningCircle,
  X,
  Buildings,
  Check,
  Star,
  ShieldCheck,
  UserPlus,
  Trash,
  Power,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import {
  fetchUsers,
  fetchUserById,
  updateUserBanks,
  createUser,
  deleteUser,
  activateUser,
  deactivateUser,
  type CreateUserInput,
} from '@/features/users/api'
import { fetchBanks, type Bank } from '@/features/banks/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'
import type { UserProfile } from '@/features/workspaces/api'

export function UsersPage() {
  const { t } = useTranslation()
  const { user } = useWorkspace()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null)

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

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      toast.success(t('users.userDeleted', 'User deleted successfully'))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (selectedUserId === deleteConfirmUser?.id) {
        setSelectedUserId(null)
      }
      setDeleteConfirmUser(null)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t('users.deleteFailed', 'Failed to delete user')))
    },
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

  const renderCreateModal = () => {
    if (!isCreatingUser) return null
    return (
      <CreateUserModal
        onClose={() => setIsCreatingUser(false)}
        onCreated={() => {
          setIsCreatingUser(false)
          queryClient.invalidateQueries({ queryKey: ['users'] })
        }}
      />
    )
  }

  const renderDeleteConfirmModal = () => {
    if (!deleteConfirmUser) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
          onClick={() => setDeleteConfirmUser(null)}
        />
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-hairline overflow-hidden p-6 z-10 space-y-4">
          <div className="flex items-center gap-3 text-red-600">
            <WarningCircle className="size-6" weight="bold" />
            <h3 className="font-semibold text-lg text-ink">
              {t('users.confirmDeleteTitle', 'Delete User Account')}
            </h3>
          </div>
          <p className="text-sm text-ink-soft leading-relaxed">
            {t(
              'users.confirmDeleteBody',
              'Are you sure you want to permanently delete user {{name}} ({{email}})? This action cannot be undone.',
              {
                name: `${deleteConfirmUser.firstName} ${deleteConfirmUser.lastName}`,
                email: deleteConfirmUser.email,
              },
            )}
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmUser(null)}
              disabled={deleteMutation.isPending}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteMutation.mutate(deleteConfirmUser.id!)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t('common.deleting', 'Deleting...')
                : t('users.deleteUser', 'Delete User')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <>
        <ModuleEmptyState
          kicker={t('titles.usersMeta', 'IDENTITY · ACCESS')}
          title={t('users.title', 'Users, roles and account status.')}
          body={t(
            'users.subtitle',
            'Role-scoped accounts across super-admin to viewer will be administered here.',
          )}
          icon={UsersThree}
          actionLabel={t('users.newUser', 'New User')}
          onAction={() => setIsCreatingUser(true)}
        />
        {renderCreateModal()}
      </>
    )
  }

  return (
    <div className="space-y-6">
      {renderCreateModal()}
      {renderDeleteConfirmModal()}

      <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline bg-paper/50 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h2 className="font-semibold text-ink">{t('users.title', 'System Users')}</h2>
            <p className="text-xs text-ink-mute mt-0.5">
              {t('users.subtitle', 'Manage user access, roles, and bank affiliations across EuroInspect 360.')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-ink-mute bg-bone px-2 py-1 rounded">
              {data.length} {t('users.total', 'TOTAL')}
            </span>
            <Button
              size="sm"
              onClick={() => setIsCreatingUser(true)}
              className="flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <UserPlus className="size-4" weight="bold" />
              {t('users.newUser', 'New User')}
            </Button>
          </div>
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
              {data.map((u) => {
                const isActive = u.isActive !== false
                return (
                  <tr key={u.id} className="hover:bg-paper/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-ink">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-5 py-3 text-ink-soft ltr-force text-start" dir="ltr">
                      {u.email}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-md bg-ink-mute/10 px-2 py-1 text-[11px] font-mono font-medium text-ink">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.role === 'SUPER_ADMIN' || u.role === 'SYSTEM_ADMIN' ? (
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <ShieldCheck className="size-3 text-blue-600" />
                          {t('users.globalAccess', 'Global Access (All Banks)')}
                        </span>
                      ) : u.banks && u.banks.length > 0 ? (
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
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          {t('common.active', 'Active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                          <span className="size-1.5 rounded-full bg-rose-500" />
                          {t('common.inactive', 'Inactive')}
                        </span>
                      )}
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
                )
              })}
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

          <h3 className="font-semibold text-lg mb-4 text-ink">
            {t('users.userDetailsTitle', 'User Details & Management')}
          </h3>
          {isUserLoading ? (
            <div className="flex justify-center py-10">
              <CircleNotch className="size-6 animate-spin text-ink-mute" />
            </div>
          ) : selectedUser ? (
            <UserDetailsPanel
              key={selectedUserId}
              userId={selectedUserId}
              user={selectedUser}
              currentUserId={user?.id}
              currentUserEmail={user?.email}
              onClose={() => setSelectedUserId(null)}
              onRequestDelete={() => setDeleteConfirmUser(selectedUser)}
            />
          ) : (
            <p className="text-red-500 text-sm">{t('common.error', 'Failed to load user details.')}</p>
          )}
        </div>
      )}
    </div>
  )
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<CreateUserInput>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER',
  })
  const [showPassword, setShowPassword] = useState(false)

  const createMutation = useMutation({
    mutationFn: (data: CreateUserInput) => createUser(data),
    onSuccess: () => {
      toast.success(t('users.userCreatedSuccess', 'User created successfully'))
      onCreated()
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t('users.createFailed', 'Failed to create user')))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password) {
      toast.error(t('common.fillRequired', 'Please fill in all required fields'))
      return
    }
    if (formData.password.length < 8) {
      toast.error(t('users.passwordMinLength', 'Password must be at least 8 characters long'))
      return
    }
    createMutation.mutate(formData)
  }

  const roleOptions = [
    { value: 'SUPER_ADMIN', label: t('roles.superAdmin', 'Super Admin (Full Platform Access)') },
    { value: 'SYSTEM_ADMIN', label: t('roles.systemAdmin', 'System Admin') },
    { value: 'MANAGER', label: t('roles.manager', 'Manager') },
    { value: 'REVIEWER', label: t('roles.reviewer', 'Reviewer') },
    { value: 'USER', label: t('roles.user', 'User') },
    { value: 'VIEWER', label: t('roles.viewer', 'Viewer') },
    { value: 'REPRESENTATIVE', label: t('roles.representative', 'Field Representative') },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-hairline overflow-hidden z-10 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-paper/50">
          <div>
            <h3 className="font-semibold text-lg text-ink flex items-center gap-2">
              <UserPlus className="size-5 text-accent" weight="bold" />
              {t('users.createTitle', 'Create New User')}
            </h3>
            <p className="text-xs text-ink-mute mt-0.5">
              {t('users.createSubtitle', 'Add a new user and assign their system role.')}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-mute hover:text-ink cursor-pointer p-1">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                {t('users.thFirstName', 'First Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-md border border-hairline bg-paper/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder={t('users.firstNamePlaceholder', 'e.g. Ahmed')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                {t('users.thLastName', 'Last Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-md border border-hairline bg-paper/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder={t('users.lastNamePlaceholder', 'e.g. Hassan')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              {t('users.thEmail', 'Email Address')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="w-full text-sm px-3 py-2 rounded-md border border-hairline bg-paper/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent ltr-force text-start"
              dir="ltr"
              placeholder="user@euroinspect360.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              {t('users.password', 'Password')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                className="w-full text-sm px-3 py-2 pe-10 rounded-md border border-hairline bg-paper/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent ltr-force"
                dir="ltr"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink cursor-pointer"
              >
                {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[11px] text-ink-mute mt-1">
              {t('users.passwordHelp', 'Must be at least 8 characters long.')}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              {t('banks.thPhone', 'Phone Number')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              className="w-full text-sm px-3 py-2 rounded-md border border-hairline bg-paper/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent ltr-force text-start"
              dir="ltr"
              placeholder="+20 100 000 0000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              {t('users.thRole', 'Role')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
              className="w-full text-sm px-3 py-2 rounded-md border border-hairline bg-paper/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? t('common.saving', 'Creating...')
                : t('users.createUserBtn', 'Create User')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UserDetailsPanel({
  userId,
  user,
  currentUserId,
  currentUserEmail,
  onClose,
  onRequestDelete,
}: {
  userId: string
  user: UserProfile
  currentUserId?: string
  currentUserEmail?: string
  onClose: () => void
  onRequestDelete: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: allBanks = [], isLoading: isBanksLoading } = useQuery<Bank[]>({
    queryKey: ['banks'],
    queryFn: fetchBanks,
  })

  const isSelf = currentUserId === userId || currentUserEmail === user.email
  const isActive = user.isActive !== false

  // Initial bank assignments from user prop
  const initialBankIds = useMemo(() => user.banks?.map((b) => b.id) || [], [user.banks])
  const initialPrimaryBankId = useMemo(() => {
    const primary = user.banks?.find((b) => b.isPrimary)
    return primary ? primary.id : user.banks?.[0]?.id || null
  }, [user.banks])

  const [selectedBankIds, setSelectedBankIds] = useState<string[]>(initialBankIds)
  const [primaryBankId, setPrimaryBankId] = useState<string | null>(initialPrimaryBankId)

  // Determine if there are actual assignment changes
  const hasChanges = useMemo(() => {
    const sameCount = selectedBankIds.length === initialBankIds.length
    const sameItems = sameCount && selectedBankIds.every((id) => initialBankIds.includes(id))
    const samePrimary = (primaryBankId || null) === (initialPrimaryBankId || null)
    return !(sameItems && samePrimary)
  }, [selectedBankIds, initialBankIds, primaryBankId, initialPrimaryBankId])

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
      toast.success(t('users.assignedBanksUpdated', 'Assigned banks updated successfully'))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', userId] })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t('users.alreadyAssignedError', 'This user is already assigned to this bank.')))
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: () => (isActive ? deactivateUser(userId) : activateUser(userId)),
    onSuccess: () => {
      toast.success(
        isActive
          ? t('users.deactivatedSuccess', 'User deactivated successfully')
          : t('users.activatedSuccess', 'User activated successfully'),
      )
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', userId] })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t('users.statusUpdateFailed', 'Failed to update user status')))
    },
  })

  const handleSave = () => {
    if (!hasChanges) {
      toast.error(t('users.alreadyAssignedError', 'This user is already assigned to this bank.'))
      return
    }
    saveMutation.mutate()
  }

  const isPlatformAdmin = user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN'

  return (
    <div className="space-y-6">
      {/* User Info Grid & Account Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-lg bg-paper/60 border border-hairline text-sm">
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">{t('users.thName', 'NAME')}</p>
          <p className="text-ink font-medium">
            {user.firstName} {user.lastName}
          </p>
        </div>
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">{t('users.thEmail', 'EMAIL')}</p>
          <p className="text-ink ltr-force text-start" dir="ltr">
            {user.email}
          </p>
        </div>
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">{t('users.thRole', 'ROLE')}</p>
          <span className="inline-flex rounded-md bg-ink-mute/10 px-2 py-0.5 text-xs font-mono font-medium text-ink">
            {user.role}
          </span>
        </div>
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">{t('banks.thPhone', 'PHONE')}</p>
          <p className="text-ink">{user.phone || t('common.na', '—')}</p>
        </div>
        <div>
          <p className="text-ink-mute font-medium text-xs mb-1">{t('users.thStatus', 'STATUS')}</p>
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t('common.active', 'Active')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
              <span className="size-1.5 rounded-full bg-rose-500" />
              {t('common.inactive', 'Inactive')}
            </span>
          )}
        </div>
      </div>

      {/* Account Operations Toolbar (Activate, Deactivate, Delete) */}
      <div className="p-3.5 rounded-lg border border-hairline bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-mute">
            {t('users.accountActions', 'Account Management:')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleStatusMutation.mutate()}
            disabled={toggleStatusMutation.isPending || isSelf}
            title={isSelf ? t('users.cannotModifySelf', 'You cannot deactivate your own account') : undefined}
            className={`cursor-pointer text-xs flex items-center gap-1.5 ${
              isActive
                ? 'text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                : 'text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
            }`}
          >
            <Power className="size-3.5" weight="bold" />
            {toggleStatusMutation.isPending
              ? t('common.updating', 'Updating...')
              : isActive
              ? t('users.deactivateBtn', 'Deactivate Account')
              : t('users.activateBtn', 'Activate Account')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRequestDelete}
            disabled={isSelf}
            title={isSelf ? t('users.cannotDeleteSelf', 'You cannot delete your own account') : undefined}
            className="cursor-pointer text-xs text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5"
          >
            <Trash className="size-3.5" weight="bold" />
            {t('users.deleteBtn', 'Delete User')}
          </Button>
        </div>

        {isSelf && (
          <span className="text-xs text-ink-mute italic">
            {t('users.selfNote', 'You are logged in as this user.')}
          </span>
        )}
      </div>

      {/* Platform Administrator Info Banner vs Multi-Bank Assignment Section */}
      {isPlatformAdmin ? (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <ShieldCheck className="size-5 text-blue-600" />
            {t('users.platformAdminTitle', 'Platform Administrator — Global Access')}
          </div>
          <p className="text-xs text-blue-800 leading-relaxed">
            {t(
              'users.platformAdminDesc',
              'This user holds the SUPER_ADMIN/SYSTEM_ADMIN role and has global access across all banks and operations. Platform administrators manage the entire system and cannot be assigned to specific bank workspaces.',
            )}
          </p>
          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.done', 'Done')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm text-ink flex items-center gap-1.5">
                <Buildings className="size-4 text-ink-mute" />
                {t('users.assignedBanksTitle', 'Assigned Banks')} ({selectedBankIds.length})
              </h4>
              <p className="text-xs text-ink-mute">
                {t(
                  'users.assignedBanksDesc',
                  'Select all banks this user belongs to. A user can be assigned to multiple banks at the same time.',
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                {t('common.done', 'Done')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? t('common.saving', 'Saving...')
                  : t('users.saveBankAssignments', 'Save Bank Assignments')}
              </Button>
            </div>
          </div>

          {isBanksLoading ? (
            <div className="flex justify-center py-6">
              <CircleNotch className="size-5 animate-spin text-ink-mute" />
            </div>
          ) : allBanks.length === 0 ? (
            <p className="text-xs text-ink-mute italic">
              {t('users.noBanksAvailable', 'No banks available in the system.')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {allBanks.map((b) => {
                const isChecked = selectedBankIds.includes(b.id)
                const isPrimary = primaryBankId === b.id
                const isAlreadyAssigned = initialBankIds.includes(b.id)

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
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs font-mono text-ink">
                              {b.code}
                            </span>
                            {isAlreadyAssigned && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-200">
                                {t('users.currentlyAssignedBadge', 'Assigned')}
                              </span>
                            )}
                          </div>
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
                          <Star
                            weight={isPrimary ? 'fill' : 'regular'}
                            className={`size-3 ${isPrimary ? 'text-amber-500' : ''}`}
                          />
                          {isPrimary ? t('users.primaryBank', 'Primary Bank') : t('users.setPrimary', 'Set as Primary')}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
