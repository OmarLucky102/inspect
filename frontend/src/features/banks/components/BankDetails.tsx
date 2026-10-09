import { CircleNotch, X } from '@phosphor-icons/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchBankById, createBankUser, addBankMember, type CreateBankUserDto, type AddBankMemberDto } from '../api'
import { fetchUsers } from '@/features/users/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'

interface BankDetailsProps {
  bankId: string
  onClose: () => void
}

export function BankDetails({ bankId, onClose }: BankDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'newUser' | 'existingUser'>('details')

  const { data: bank, isLoading, isError } = useQuery({
    queryKey: ['banks', bankId],
    queryFn: () => fetchBankById(bankId),
  })

  return (
    <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden relative">
      <div className="flex border-b border-hairline bg-paper/50 px-5 pt-4">
        <h3 className="font-semibold text-lg pb-4 mr-6">Manage Bank</h3>
        <nav className="flex gap-4">
          {(['details', 'newUser', 'existingUser'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-mute hover:text-ink'
              }`}
            >
              {tab === 'details' && 'Details'}
              {tab === 'newUser' && 'Create User'}
              {tab === 'existingUser' && 'Assign User'}
            </button>
          ))}
        </nav>
      </div>
      
      <button 
        className="absolute top-4 right-4 text-ink-mute hover:text-ink"
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

function TabNewUser({ bankId }: { bankId: string }) {
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
        <label className="block text-xs font-medium text-ink-mute mb-1">Role</label>
        <select required className="w-full rounded-md border border-hairline px-3 py-2 text-sm bg-white" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
          <option value="MANAGER">Manager</option>
          <option value="REVIEWER">Reviewer</option>
          <option value="USER">User</option>
          <option value="VIEWER">Viewer</option>
          <option value="REPRESENTATIVE">Representative</option>
        </select>
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
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to assign user'))
  })

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); assignMutation.mutate({ userId, isPrimary }) }}
      className="space-y-4 max-w-md"
    >
      <div>
        <label className="block text-xs font-medium text-ink-mute mb-1">Select User</label>
        {isLoading ? (
          <p className="text-sm text-ink-mute">Loading users...</p>
        ) : (
          <select 
            required 
            className="w-full rounded-md border border-hairline px-3 py-2 text-sm bg-white" 
            value={userId} 
            onChange={e => setUserId(e.target.value)}
          >
            <option value="" disabled>Select a user</option>
            {users?.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email}) - {u.role}</option>
            ))}
          </select>
        )}
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
