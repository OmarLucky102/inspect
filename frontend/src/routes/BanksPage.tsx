import { Bank as BankIcon, CircleNotch, WarningCircle, X, Plus } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import { fetchBanks, createBank, type CreateBankDto } from '@/features/banks/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'
import { BankDetails } from '@/features/banks/components/BankDetails'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'

export function BanksPage() {
  const { user } = useWorkspace()
  const queryClient = useQueryClient()
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  const [formData, setFormData] = useState<CreateBankDto>({ name: '', code: '', email: '', phone: '' })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['banks'],
    queryFn: fetchBanks,
    enabled: user?.role === 'SUPER_ADMIN',
  })

  const createMutation = useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      toast.success('Bank created successfully')
      queryClient.invalidateQueries({ queryKey: ['banks'] })
      setIsCreating(false)
      setFormData({ name: '', code: '', email: '', phone: '' })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to create bank'))
    }
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
        <p className="text-red-500 mb-4">Failed to load banks.</p>
        <button onClick={() => refetch()} className="text-sm font-medium underline">
          Try again
        </button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <ModuleEmptyState
        kicker="ORGANIZATION · WORKSPACES"
        title="Bank workspaces and memberships."
        body="Banks, membership roles and inspection scopes will live here, backed by the organization module and bank-membership guard."
        icon={BankIcon}
        actionLabel="New bank"
        onAction={() => setIsCreating(true)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline bg-paper/50 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-ink">Banks (Workspaces)</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-ink-mute bg-bone px-2 py-1 rounded">
              {data.length} TOTAL
            </span>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="size-4 mr-1" /> New Bank
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bone text-ink-mute font-medium border-b border-hairline">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.map((b) => (
                <tr key={b.id} className="hover:bg-paper/50 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-ink">{b.code}</td>
                  <td className="px-5 py-3 text-ink">{b.name}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {b.email || b.phone || '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedBankId(b.id)}>
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreating && (
        <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden relative p-6">
          <button 
            className="absolute top-4 right-4 text-ink-mute hover:text-ink"
            onClick={() => setIsCreating(false)}
          >
            <X className="size-5" />
          </button>
          <h3 className="font-semibold text-lg mb-4">Create New Bank</h3>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              const payload = { ...formData }
              if (!payload.email) delete payload.email
              if (!payload.phone) delete payload.phone
              createMutation.mutate(payload)
            }}
            className="space-y-4 max-w-md"
          >
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">Code</label>
              <input 
                required
                className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CIB"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">Name</label>
              <input 
                required
                className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Commercial International Bank"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">Email</label>
              <input 
                type="email"
                className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">Phone</label>
              <input 
                className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Bank'}
            </Button>
          </form>
        </div>
      )}

      {selectedBankId && (
        <BankDetails 
          bankId={selectedBankId} 
          onClose={() => setSelectedBankId(null)} 
        />
      )}
    </div>
  )
}
