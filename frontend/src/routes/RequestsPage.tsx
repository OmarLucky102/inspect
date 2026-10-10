import { ClipboardText, CircleNotch, X, Plus } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import { fetchInspectionRequests, createInspectionRequest, submitInspectionRequest, type CreateInspectionRequestDto } from '@/features/inspection-requests/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'

export function RequestsPage() {
  const { activeBankId } = useWorkspace()
  const queryClient = useQueryClient()
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  const [formData, setFormData] = useState<CreateInspectionRequestDto>({
    customer: { name: '', phone: '', email: '' },
    location: { address: '' },
    notes: '',
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['inspection-requests', activeBankId],
    queryFn: () => fetchInspectionRequests(activeBankId!),
    enabled: !!activeBankId,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateInspectionRequestDto) => createInspectionRequest(activeBankId!, payload),
    onSuccess: () => {
      toast.success('Inspection Request created')
      queryClient.invalidateQueries({ queryKey: ['inspection-requests', activeBankId] })
      setIsCreating(false)
      setFormData({
        customer: { name: '', phone: '', email: '' },
        location: { address: '' },
        notes: '',
      })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create request'))
  })

  const submitMutation = useMutation({
    mutationFn: (requestId: string) => submitInspectionRequest(activeBankId!, requestId, {}),
    onSuccess: () => {
      toast.success('Request submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['inspection-requests', activeBankId] })
      setSelectedRequestId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to submit request'))
  })

  if (!activeBankId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
        <p>Please select or join a bank workspace first.</p>
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
        <p className="text-red-500 mb-4">Failed to load inspection requests.</p>
        <button onClick={() => refetch()} className="text-sm font-medium underline">Try again</button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <ModuleEmptyState
        kicker="CORE WORKFLOW"
        title="Inspection Requests."
        body="Create and manage vehicle inspection requests for your bank."
        icon={ClipboardText}
        actionLabel="New Request"
        onAction={() => setIsCreating(true)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline bg-paper/50 flex justify-between items-center">
          <h2 className="font-semibold text-ink">Inspection Requests</h2>
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="size-4 mr-1" /> New Request
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bone text-ink-mute font-medium border-b border-hairline">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-paper/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-ink">
                    {r.customerName}<br/>
                    <span className="text-xs text-ink-mute font-normal">{r.customerPhone}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{r.locationAddress}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-md bg-ink-mute/10 px-2 py-1 text-[11px] font-mono font-medium text-ink">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-soft text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRequestId(r.id)}>
                      Details
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
          <h3 className="font-semibold text-lg mb-4">New Inspection Request</h3>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate(formData)
            }}
            className="space-y-4 max-w-md"
          >
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">Customer Name</label>
              <input required className="w-full rounded-md border border-hairline px-3 py-2 text-sm" value={formData.customer.name} onChange={e => setFormData({ ...formData, customer: { ...formData.customer, name: e.target.value } })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">Customer Phone</label>
              <input required className="w-full rounded-md border border-hairline px-3 py-2 text-sm" value={formData.customer.phone} onChange={e => setFormData({ ...formData, customer: { ...formData.customer, phone: e.target.value } })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">Location Address</label>
              <input required className="w-full rounded-md border border-hairline px-3 py-2 text-sm" value={formData.location.address} onChange={e => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">Notes</label>
              <textarea className="w-full rounded-md border border-hairline px-3 py-2 text-sm" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Request'}
            </Button>
          </form>
        </div>
      )}

      {selectedRequestId && (
        <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden relative p-6">
          <button 
            className="absolute top-4 right-4 text-ink-mute hover:text-ink"
            onClick={() => setSelectedRequestId(null)}
          >
            <X className="size-5" />
          </button>
          <h3 className="font-semibold text-lg mb-4">Request Details</h3>
          <p className="text-sm text-ink-mute mb-4">Request ID: {selectedRequestId}</p>
          <Button 
            onClick={() => submitMutation.mutate(selectedRequestId)}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      )}
    </div>
  )
}
