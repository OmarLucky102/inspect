import { ClipboardText, CircleNotch, X, Plus } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import {
  fetchInspectionRequests,
  createInspectionRequest,
  type CreateInspectionRequestDto,
  type InspectionRequest,
} from '@/features/inspection-requests/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'

export function RequestsPage() {
  const { activeBankId } = useWorkspace()
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<InspectionRequest | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['inspection-requests', activeBankId],
    queryFn: () => fetchInspectionRequests(activeBankId!),
    enabled: !!activeBankId,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateInspectionRequestDto) =>
      createInspectionRequest(activeBankId!, payload),
    onSuccess: () => {
      toast.success('Inspection Request created successfully')
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      })
      setIsCreating(false)
      setForm({ fullName: '', phone: '', email: '', address: '', notes: '' })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create request')),
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error('Customer name and phone are required')
      return
    }

    const payload: CreateInspectionRequestDto = {
      customer: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      },
      ...(form.address.trim() ? { location: { address: form.address.trim() } } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    }

    createMutation.mutate(payload)
  }

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
        <p className="mb-4 text-red-500">Failed to load inspection requests.</p>
        <button
          onClick={() => void refetch()}
          className="cursor-pointer text-sm font-medium underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <>
        <ModuleEmptyState
          kicker="CORE WORKFLOW"
          title="Inspection Requests."
          body="Create and manage vehicle inspection requests for your bank."
          icon={ClipboardText}
          actionLabel="New Request"
          onAction={() => setIsCreating(true)}
        />

        {isCreating && renderCreateModal()}
      </>
    )
  }

  function renderCreateModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
        <div className="relative w-full max-w-lg rounded-2xl border border-hairline bg-white p-6 shadow-xl">
          <button
            type="button"
            className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
            onClick={() => setIsCreating(false)}
          >
            <X className="size-5" />
          </button>
          <h3 className="mb-1 text-lg font-semibold text-ink">New Inspection Request</h3>
          <p className="mb-5 text-xs text-ink-mute">Create a draft inspection request under the current bank workspace.</p>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Customer Full Name *</label>
              <input
                required
                className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                placeholder="e.g. John Doe"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Phone Number *</label>
                <input
                  required
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="e.g. +962791234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Email (Optional)</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="client@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Inspection Address</label>
              <input
                className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                placeholder="e.g. King Abdullah II St, Amman"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Notes</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                placeholder="Any special inspection instructions or context..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-hairline bg-paper/30 px-6 py-4">
          <div>
            <h2 className="font-semibold text-ink">Inspection Requests</h2>
            <p className="text-xs text-ink-mute">Intake and status of vehicle inspections</p>
          </div>
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="mr-1 size-4" /> New Request
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-bone font-mono text-[11px] tracking-wider text-ink-mute uppercase">
              <tr>
                <th className="px-6 py-3">Request Number</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-paper/40">
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-ink">
                    {r.requestNumber}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-ink-soft">
                    {r.address || '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-800">
                      {r.currentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-ink-mute">
                    {r.priority}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-ink-mute">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(r)}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreating && renderCreateModal()}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-xl">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
              onClick={() => setSelectedRequest(null)}
            >
              <X className="size-5" />
            </button>
            <p className="font-mono text-[11px] tracking-wider text-ink-mute uppercase">Request Details</p>
            <h3 className="mt-1 font-mono text-lg font-semibold text-ink">{selectedRequest.requestNumber}</h3>

            <div className="mt-4 space-y-3 border-t border-hairline pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-mute">Status:</span>
                <span className="font-mono font-medium text-emerald-800">{selectedRequest.currentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Priority:</span>
                <span className="font-mono text-ink">{selectedRequest.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Address:</span>
                <span className="text-right text-ink-soft">{selectedRequest.address || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Created At:</span>
                <span className="font-mono text-xs text-ink-soft">
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </span>
              </div>
              {selectedRequest.notes && (
                <div className="border-t border-hairline pt-2">
                  <span className="text-xs text-ink-mute">Notes:</span>
                  <p className="mt-1 text-xs text-ink-soft">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
