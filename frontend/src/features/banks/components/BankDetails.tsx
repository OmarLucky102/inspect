import { CircleNotch, X, CaretDown, Trash } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import {
  fetchBankById,
  createBankUser,
  addBankMember,
  fetchBankMembers,
  removeBankMember,
  type CreateBankUserDto,
  type AddBankMemberDto,
} from '../api'
import { fetchUsers } from '@/features/users/api'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'

import { useTranslation } from 'react-i18next'

interface BankDetailsProps {
  bankId: string
  onClose: () => void
}

export function BankDetails({ bankId, onClose }: BankDetailsProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'newUser' | 'existingUser'>('details')

  const { data: bank, isLoading, isError } = useQuery({
    queryKey: ['banks', bankId],
    queryFn: () => fetchBankById(bankId),
  })

  return (
    <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden relative">
      <div className="flex border-b border-hairline bg-paper/50 px-5 pt-4">
        <h3 className="font-semibold text-lg pb-4 me-6">{t('banks.manageBank', 'Manage Bank')}</h3>
        <nav className="flex gap-4">
          {(['details', 'members', 'newUser', 'existingUser'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-ink text-ink font-semibold'
                  : 'border-transparent text-ink-mute hover:text-ink'
              }`}
            >
              {tab === 'details' && t('banks.tabDetails', 'Details')}
              {tab === 'members' && t('banks.tabMembers', 'Members')}
              {tab === 'newUser' && t('banks.tabNewUser', 'Create User')}
              {tab === 'existingUser' && t('banks.tabExistingUser', 'Assign User')}
            </button>
          ))}
        </nav>
      </div>
      
      <button 
        className="absolute top-4 end-4 text-ink-mute hover:text-ink cursor-pointer modal-close"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <CircleNotch className="size-6 animate-spin text-ink-mute" />
          </div>
        ) : isError || !bank ? (
          <p className="text-red-500">Failed to load bank details.</p>
        ) : (
          <>
            {activeTab === 'details' && <TabDetails bank={bank} />}
            {activeTab === 'members' && <TabMembers bankId={bankId} />}
            {activeTab === 'newUser' && <TabNewUser bankId={bankId} />}
            {activeTab === 'existingUser' && <TabExistingUser bankId={bankId} />}
          </>
        )}
      </div>
    </div>
  )
}

function TabDetails({ bank }: { bank: any }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-ink-mute font-medium text-xs mb-1">ID</p>
        <p className="font-mono text-ink">{bank.id}</p>
      </div>
      <div>
        <p className="text-ink-mute font-medium text-xs mb-1">CODE</p>
        <p className="font-mono font-medium text-ink">{bank.code}</p>
      </div>
      <div>
        <p className="text-ink-mute font-medium text-xs mb-1">NAME</p>
        <p className="text-ink">{bank.name}</p>
      </div>
      <div>
        <p className="text-ink-mute font-medium text-xs mb-1">CONTACT</p>
        <p className="text-ink">{bank.email || bank.phone || 'N/A'}</p>
      </div>
      <div>
        <p className="text-ink-mute font-medium text-xs mb-1">STATUS</p>
        <p className="text-ink">{bank.isActive ? 'Active' : 'Inactive'}</p>
      </div>
    </div>
  )
}

function TabMembers({ bankId }: { bankId: string }) {
  const queryClient = useQueryClient()
  const { data: members, isLoading, isError, refetch } = useQuery({
    queryKey: ['bankMembers', bankId],
    queryFn: () => fetchBankMembers(bankId),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeBankMember(bankId, userId),
    onSuccess: () => {
      toast.success('Member removed from bank')
      queryClient.invalidateQueries({ queryKey: ['bankMembers', bankId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['banks', bankId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to remove member')),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <CircleNotch className="size-6 animate-spin text-ink-mute" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-4 text-sm text-red-500">
        Failed to load bank members.{' '}
        <button onClick={() => refetch()} className="font-medium underline ml-1">
          Retry
        </button>
      </div>
    )
  }

  if (!members || members.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-ink-mute">
        No members currently assigned to this bank. You can assign existing users or create new bank accounts.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-bone text-ink-mute font-medium border-b border-hairline">
          <tr>
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">Email</th>
            <th className="px-4 py-2.5">Role</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-paper/50 transition-colors">
              <td className="px-4 py-2.5 font-medium text-ink">
                <div className="flex items-center gap-2">
                  <span>{m.firstName} {m.lastName}</span>
                  {m.isPrimary && (
                    <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                      Primary
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2.5 text-ink-soft">{m.email}</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex rounded-md bg-ink-mute/10 px-2 py-0.5 text-[11px] font-mono font-medium text-ink">
                  {m.role}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                  <span className="size-1.5 rounded-full bg-green-500" />
                  {m.status || 'Active'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={removeMutation.isPending}
                  onClick={() => {
                    if (confirm(`Remove ${m.firstName} ${m.lastName} from this bank?`)) {
                      removeMutation.mutate(m.id)
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash className="size-3.5 mr-1" />
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabNewUser({ bankId }: { bankId: string }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<CreateBankUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'MANAGER',
    isPrimary: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateBankUserDto) => createBankUser(bankId, data),
    onSuccess: () => {
      toast.success('User created and assigned to bank')
      setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'MANAGER', isPrimary: false })
      queryClient.invalidateQueries({ queryKey: ['bankMembers', bankId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['banks', bankId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create user'))
  })

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData) }}
      className="space-y-4 max-w-md"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-mute mb-1">First Name</label>
          <input required className="w-full rounded-md border border-hairline px-3 py-2 text-sm" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-mute mb-1">Last Name</label>
          <input required className="w-full rounded-md border border-hairline px-3 py-2 text-sm" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-mute mb-1">Email</label>
        <input required type="email" className="w-full rounded-md border border-hairline px-3 py-2 text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-mute mb-1">Temporary Password</label>
        <input required type="password" minLength={8} className="w-full rounded-md border border-hairline px-3 py-2 text-sm" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-mute mb-1">Phone</label>
        <input required className="w-full rounded-md border border-hairline px-3 py-2 text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink mb-1.5">Role in Bank</label>
        <div className="relative flex items-center">
          <select
            required
            className="w-full appearance-none rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none cursor-pointer hover:border-ink/20 focus:border-ink/40 focus:ring-1 focus:ring-accent transition-all pr-8"
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="MANAGER">Manager (Bank Admin)</option>
            <option value="REVIEWER">Reviewer (Auditor)</option>
            <option value="USER">User (Standard)</option>
            <option value="VIEWER">Viewer (Read-only)</option>
            <option value="REPRESENTATIVE">Representative (Field Inspector)</option>
          </select>
          <CaretDown className="pointer-events-none absolute right-3 size-3.5 text-ink-mute" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
        <input type="checkbox" checked={formData.isPrimary} onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })} />
        Set as Primary Contact
      </label>
      <div className="pt-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create & Assign User'}
        </Button>
      </div>
    </form>
  )
}

function TabExistingUser({ bankId }: { bankId: string }) {
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  })

  const assignMutation = useMutation({
    mutationFn: (data: AddBankMemberDto) => addBankMember(bankId, data),
    onSuccess: () => {
      toast.success('User assigned to bank successfully')
      setUserId('')
      setIsPrimary(false)
      queryClient.invalidateQueries({ queryKey: ['bankMembers', bankId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['banks', bankId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to assign user'))
  })

  const userOptions = useMemo(
    () =>
      users?.map(u => ({
        value: u.id || '',
        label: `${u.firstName} ${u.lastName}`.trim() || u.email,
        secondaryLabel: u.email,
        badge: u.role,
      })) ?? [],
    [users]
  )

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); assignMutation.mutate({ userId, isPrimary }) }}
      className="space-y-4 max-w-md"
    >
      <div>
        <label className="block text-xs font-medium text-ink mb-1.5">Select User to Assign</label>
        <SearchableSelect
          options={userOptions}
          value={userId}
          onChange={setUserId}
          placeholder={isLoading ? 'Loading users...' : 'Choose a user to assign to this bank...'}
          searchPlaceholder="Search by name, email, or role..."
          disabled={isLoading || assignMutation.isPending}
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
        <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} />
        Set as Primary Contact
      </label>
      <div className="pt-2">
        <Button type="submit" disabled={assignMutation.isPending || !userId}>
          {assignMutation.isPending ? 'Assigning...' : 'Assign to Bank'}
        </Button>
      </div>
    </form>
  )
}
