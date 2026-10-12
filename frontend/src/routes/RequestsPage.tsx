import { ClipboardText, CircleNotch, X, Plus } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import {
  fetchInspectionRequests,
  createInspectionRequest,
  fetchGovernorates,
  type CreateInspectionRequestDto,
  type InspectionRequest,
} from '@/features/inspection-requests/api'
import { RequestDetailModal } from '@/features/inspection-requests/components/RequestDetailModal'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    PENDING: 'bg-amber-500/10 text-amber-800 border-amber-300',
    ASSIGNED: 'bg-sky-500/10 text-sky-800 border-sky-300',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-800 border-indigo-300',
    UNDER_REVIEW: 'bg-purple-500/10 text-purple-800 border-purple-300',
    COMPLETED: 'bg-teal-500/10 text-teal-800 border-teal-300',
    APPROVED: 'bg-emerald-500/10 text-emerald-800 border-emerald-300',
    REJECTED: 'bg-rose-500/10 text-rose-800 border-rose-300',
    CANCELLED: 'bg-zinc-200 text-zinc-600 border-zinc-300',
  }
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider ${
        styles[status] || 'bg-bone text-ink-soft border-hairline'
      }`}
    >
      {status}
    </span>
  )
}

export function RequestsPage() {
  const { activeBankId } = useWorkspace()
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<InspectionRequest | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    governorateId: '',
    cityId: '',
    address: '',
    notes: '',
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['inspection-requests', activeBankId],
    queryFn: () => fetchInspectionRequests(activeBankId!),
    enabled: !!activeBankId,
  })

  const { data: governorates = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', 'governorates'],
    queryFn: fetchGovernorates,
  })

  const selectedGovernorate = useMemo(
    () => governorates.find((g) => g.id === form.governorateId),
    [governorates, form.governorateId]
  )

  const governorateOptions = useMemo(
    () =>
      governorates.map((g) => ({
        value: g.id,
        label: g.name,
        secondaryLabel: g.nameAr ?? undefined,
        badge: g.cities && g.cities.length > 0 ? `${g.cities.length} cities` : undefined,
      })),
    [governorates]
  )

  const cityOptions = useMemo(() => {
    if (!selectedGovernorate || !selectedGovernorate.cities) return []
    return selectedGovernorate.cities.map((c) => ({
      value: c.id,
      label: c.name,
      secondaryLabel: c.nameAr ?? undefined,
    }))
  }, [selectedGovernorate])

  const handleGovernorateChange = (govId: string) => {
    setForm((prev) => ({
      ...prev,
      governorateId: govId,
      cityId: '', // Reset dependent city when governorate changes
    }))
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateInspectionRequestDto) =>
      createInspectionRequest(activeBankId!, payload),
    onSuccess: () => {
      toast.success('Inspection Request created successfully')
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      })
      setIsCreating(false)
      setForm({
        fullName: '',
        phone: '',
        email: '',
        governorateId: '',
        cityId: '',
        address: '',
        notes: '',
      })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create request')),
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error('Customer name and phone are required')
      return
    }

    if (!form.governorateId) {
      toast.error('Governorate is required')
      return
    }

    if (!form.cityId) {
      toast.error('City is required')
      return
    }

    const payload: CreateInspectionRequestDto = {
      customer: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      },
      location: {
        governorateId: form.governorateId,
        cityId: form.cityId,
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
      },
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Governorate *
                </label>
                <SearchableSelect
                  required
                  options={governorateOptions}
                  value={form.governorateId}
                  onChange={handleGovernorateChange}
                  placeholder={
                    isLoadingLocations
                      ? 'Loading governorates...'
                      : 'Select governorate...'
                  }
                  searchPlaceholder="Type governorate name..."
                  emptyText="No matching governorates"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  City *
                </label>
                <SearchableSelect
                  required
                  options={cityOptions}
                  value={form.cityId}
                  onChange={(cityId) => setForm((prev) => ({ ...prev, cityId }))}
                  disabled={!form.governorateId}
                  disabledMessage="Select governorate first"
                  placeholder={
                    !form.governorateId
                      ? 'Select governorate first'
                      : 'Select city...'
                  }
                  searchPlaceholder="Type city name..."
                  emptyText={
                    form.governorateId
                      ? 'No matching cities'
                      : 'Select governorate first'
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Detailed Address (Optional)
              </label>
              <input
                className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                placeholder="e.g. Building 14, St 10, Apartment 3"
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
                    {getStatusBadge(r.currentStatus)}
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
        <RequestDetailModal
          requestId={selectedRequest.id}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  )
}
