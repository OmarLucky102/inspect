import {
  ListChecks,
  Plus,
  Trash,
  CircleNotch,
  Lock,
  X,
  Car,
  FileText,
  CheckCircle,
} from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import {
  fetchVehicleCategories,
  fetchCategoryChecklist,
  addCustomChecklistItem,
  removeCustomChecklistItem,
  fetchRequestChecklistItems,
  type ChecklistItem,
  type AddChecklistItemDto,
  type ChecklistInputType,
} from '@/features/checklists/api'
import { fetchInspectionRequests } from '@/features/inspection-requests/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'

export function ChecklistsPage() {
  const { activeBankId, user } = useWorkspace()
  const queryClient = useQueryClient()

  // Permissions: MANAGER & SUPER_ADMIN can add/remove custom items
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER'

  const [activeTab, setActiveTab] = useState<'templates' | 'evidence'>('templates')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null)

  // Request evidence inspector state
  const [selectedRequestId, setSelectedRequestId] = useState<string>('')

  // Add Item Form State
  const [form, setForm] = useState<{
    code: string
    label: string
    description: string
    inputType: ChecklistInputType
    options: string
    weight: number
  }>({
    code: '',
    label: '',
    description: '',
    inputType: 'BOOLEAN',
    options: '',
    weight: 1,
  })

  // 1. Fetch Vehicle Categories
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['checklist-categories', activeBankId],
    queryFn: () => fetchVehicleCategories(activeBankId!),
    enabled: !!activeBankId,
  })

  // Auto-select first category if none active
  const currentCategoryId = selectedCategoryId || (categories.length > 0 ? categories[0].id : null)

  // 2. Fetch Checklist Items for Category
  const {
    data: checklistItems = [],
    isLoading: isItemsLoading,
    isError: isItemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['category-checklist', activeBankId, currentCategoryId],
    queryFn: () => fetchCategoryChecklist(activeBankId!, currentCategoryId!),
    enabled: !!activeBankId && !!currentCategoryId,
  })

  // Derive template checklist ID (from any existing item or system mandatory ID)
  const activeChecklistId =
    checklistItems.length > 0
      ? checklistItems[0].checklistId
      : '0259bafa-b32d-4837-85db-08cd609dc036'

  // 3. Fetch Requests for Evidence View
  const { data: requests = [] } = useQuery({
    queryKey: ['inspection-requests', activeBankId],
    queryFn: () => fetchInspectionRequests(activeBankId!),
    enabled: !!activeBankId && activeTab === 'evidence',
  })

  // 4. Fetch Evidence Checklist items for Selected Request
  const {
    data: evidenceItems = [],
    isLoading: isEvidenceLoading,
  } = useQuery({
    queryKey: ['request-evidence-items', activeBankId, selectedRequestId],
    queryFn: () => fetchRequestChecklistItems(activeBankId!, selectedRequestId),
    enabled: !!activeBankId && !!selectedRequestId && activeTab === 'evidence',
  })

  // Add Custom Item Mutation
  const addMutation = useMutation({
    mutationFn: (dto: AddChecklistItemDto) =>
      addCustomChecklistItem(activeBankId!, activeChecklistId, dto),
    onSuccess: () => {
      toast.success('Checklist item added successfully')
      void queryClient.invalidateQueries({
        queryKey: ['category-checklist', activeBankId, currentCategoryId],
      })
      setIsAddModalOpen(false)
      setForm({
        code: '',
        label: '',
        description: '',
        inputType: 'BOOLEAN',
        options: '',
        weight: 1,
      })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to add checklist item')),
  })

  // Remove Custom Item Mutation
  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      removeCustomChecklistItem(activeBankId!, activeChecklistId, itemId),
    onSuccess: () => {
      toast.success('Custom checklist item removed')
      void queryClient.invalidateQueries({
        queryKey: ['category-checklist', activeBankId, currentCategoryId],
      })
      setItemToDelete(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete checklist item')),
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = form.code.trim().toUpperCase().replace(/\s+/g, '_')
    if (!trimmedCode) {
      toast.error('Item code is required')
      return
    }
    if (!form.label.trim()) {
      toast.error('Item label is required')
      return
    }

    const payload: AddChecklistItemDto = {
      code: trimmedCode,
      label: form.label.trim(),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      inputType: form.inputType,
      weight: Number(form.weight) || 1,
      ...(form.inputType === 'SELECT' && form.options.trim()
        ? { options: form.options.trim() }
        : {}),
    }

    addMutation.mutate(payload)
  }

  if (!activeBankId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-ink-mute">
        <ListChecks className="mb-3 size-12 opacity-30" />
        <h3 className="text-base font-semibold text-ink">No Bank Workspace Selected</h3>
        <p className="mt-1 text-xs text-ink-mute">Please select a bank workspace in the top header to manage checklists.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Mode Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-ink text-xl">Inspection Checklists</h2>
          <p className="text-xs text-ink-mute">
            Configure audit templates per vehicle category &amp; inspect completed request evidence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-hairline bg-paper/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-white text-ink shadow-xs'
                  : 'text-ink-mute hover:text-ink'
              }`}
            >
              Category Templates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'evidence'
                  ? 'bg-white text-ink shadow-xs'
                  : 'text-ink-mute hover:text-ink'
              }`}
            >
              Request Evidence
            </button>
          </div>

          {activeTab === 'templates' && canManage && (
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-1 size-4" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* Category Pills Navigation */}
          {isCategoriesLoading ? (
            <div className="flex items-center gap-2 py-4">
              <CircleNotch className="size-5 animate-spin text-ink-mute" />
              <span className="text-xs text-ink-mute">Loading vehicle categories…</span>
            </div>
          ) : isCategoriesError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
              Failed to load vehicle categories.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-4">
              <span className="mr-1 font-mono text-[11px] tracking-wider text-ink-mute uppercase">
                Category:
              </span>
              {categories.map((cat) => {
                const isSelected = cat.id === currentCategoryId
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-ink bg-ink text-white shadow-xs'
                        : 'border-hairline bg-white text-ink-soft hover:bg-paper/80 hover:text-ink'
                    }`}
                  >
                    <Car className="size-3.5" />
                    <span>{cat.name}</span>
                    {cat.code && (
                      <span
                        className={`font-mono text-[10px] ${
                          isSelected ? 'text-white/70' : 'text-ink-mute'
                        }`}
                      >
                        {cat.code}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Checklist Items Table */}
          <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-xs">
            <div className="border-b border-hairline bg-paper/30 px-6 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Checklist Items</h3>
                <p className="text-[11px] text-ink-mute">
                  Items evaluated during vehicle inspection. Mandatory items are enforced system-wide.
                </p>
              </div>
              <span className="font-mono text-xs text-ink-mute">
                {checklistItems.length} {checklistItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {isItemsLoading ? (
              <div className="flex justify-center py-16">
                <CircleNotch className="size-8 animate-spin text-ink-mute" />
              </div>
            ) : isItemsError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="mb-3 text-xs text-red-500">Failed to load category checklist.</p>
                <Button variant="outline" size="sm" onClick={() => void refetchItems()}>
                  Retry
                </Button>
              </div>
            ) : checklistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-ink-mute">
                <ListChecks className="mb-2 size-10 opacity-30" />
                <p className="text-sm font-medium">No items found for this category</p>
                <p className="mt-1 text-xs">Add a custom item to define inspection criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-hairline bg-bone font-mono text-[11px] tracking-wider text-ink-mute uppercase">
                    <tr>
                      <th className="px-6 py-3">Order</th>
                      <th className="px-6 py-3">Code</th>
                      <th className="px-6 py-3">Label &amp; Description</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Weight</th>
                      <th className="px-6 py-3">Scope</th>
                      {canManage && <th className="px-6 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {checklistItems.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-paper/30">
                        <td className="px-6 py-3.5 font-mono text-xs text-ink-mute">
                          #{item.sortOrder}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs font-semibold text-ink">
                          {item.code}
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-ink">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-ink-mute">{item.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex rounded-lg border border-hairline bg-paper px-2 py-0.5 font-mono text-[11px] text-ink-soft">
                            {item.inputType}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-ink">
                          {item.weight}
                        </td>
                        <td className="px-6 py-3.5">
                          {item.isMandatory ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-purple-700">
                              <Lock className="size-3" /> SYSTEM MANDATORY
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-700">
                              BANK CUSTOM
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-6 py-3.5 text-right">
                            {item.isMandatory ? (
                              <span
                                className="inline-flex cursor-not-allowed items-center text-xs text-ink-mute"
                                title="System mandatory items cannot be deleted"
                              >
                                <Lock className="size-4 opacity-50" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setItemToDelete(item)}
                                className="cursor-pointer rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Remove custom checklist item"
                              >
                                <Trash className="size-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Request Evidence Inspector View */
        <div className="space-y-4">
          <div className="rounded-2xl border border-hairline bg-white p-6 shadow-xs">
            <h3 className="mb-1 text-sm font-semibold text-ink">Inspection Request Evidence</h3>
            <p className="mb-4 text-xs text-ink-mute">
              Inspect submitted checklist items, recorded values, and completion status for a specific vehicle request.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-ink-soft">Select Request</label>
                <select
                  value={selectedRequestId}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="">-- Choose an inspection request --</option>
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestNumber} ({r.currentStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-ink-soft">Or Enter Request UUID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 61a6ec22-f392-445d-a3a9-35ca0f350eee"
                    value={selectedRequestId}
                    onChange={(e) => setSelectedRequestId(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 font-mono text-xs text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          {selectedRequestId && (
            <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-xs">
              <div className="border-b border-hairline bg-paper/30 px-6 py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-ink">Evaluated Checklist Results</h4>
                  <p className="font-mono text-xs text-ink-mute">Request ID: {selectedRequestId}</p>
                </div>
                <span className="font-mono text-xs text-ink-mute">
                  {evidenceItems.length} {evidenceItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {isEvidenceLoading ? (
                <div className="flex justify-center py-16">
                  <CircleNotch className="size-8 animate-spin text-ink-mute" />
                </div>
              ) : evidenceItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-ink-mute">
                  <FileText className="mb-2 size-10 opacity-30" />
                  <p className="text-sm font-medium">No checklist evidence submitted yet</p>
                  <p className="mt-1 text-xs">
                    Evidence items will be recorded once the inspector evaluates vehicle checkpoints.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-hairline bg-bone font-mono text-[11px] tracking-wider text-ink-mute uppercase">
                      <tr>
                        <th className="px-6 py-3">Checklist Item ID</th>
                        <th className="px-6 py-3">Recorded Value</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Notes</th>
                        <th className="px-6 py-3">Completed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {evidenceItems.map((e) => (
                        <tr key={e.id} className="transition-colors hover:bg-paper/30">
                          <td className="px-6 py-3.5 font-mono text-xs text-ink">
                            {e.checklistItemId}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-xs font-semibold text-ink">
                            {typeof e.value === 'object'
                              ? JSON.stringify(e.value)
                              : String(e.value ?? '—')}
                          </td>
                          <td className="px-6 py-3.5">
                            {e.completed ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-800">
                                <CheckCircle className="size-3.5" /> Completed
                              </span>
                            ) : (
                              <span className="inline-flex rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-ink-soft">
                            {e.notes || '—'}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-xs text-ink-mute">
                            {e.completedAt ? new Date(e.completedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Custom Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-hairline bg-white p-6 shadow-xl">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
              onClick={() => setIsAddModalOpen(false)}
            >
              <X className="size-5" />
            </button>
            <h3 className="mb-1 text-lg font-semibold text-ink">Add Custom Checklist Item</h3>
            <p className="mb-5 text-xs text-ink-mute">
              Add a bank-scoped inspection criteria item for this category template.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Item Code *
                  </label>
                  <input
                    required
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 font-mono text-xs text-ink uppercase outline-none focus:border-accent"
                    placeholder="e.g. SUNROOF_MOTOR"
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                      })
                    }
                  />
                  <p className="mt-1 text-[10px] text-ink-mute">Unique uppercase snake_case identifier</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Weight (Score / Impact)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 font-mono text-xs text-ink outline-none focus:border-accent"
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Display Label *
                </label>
                <input
                  required
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="e.g. Sunroof Motor & Seals Condition"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Description / Inspection Guidance
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="Instructions for the field inspector..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Input Type</label>
                <select
                  value={form.inputType}
                  onChange={(e) =>
                    setForm({ ...form, inputType: e.target.value as ChecklistInputType })
                  }
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="BOOLEAN">Boolean (Pass / Fail / Yes / No)</option>
                  <option value="TEXT">Text (Freeform notes / value)</option>
                  <option value="NUMBER">Number (Numeric rating or metric)</option>
                  <option value="SELECT">Select (Predefined choices)</option>
                </select>
              </div>

              {form.inputType === 'SELECT' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Select Options (comma-separated)
                  </label>
                  <input
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                    placeholder="e.g. Good, Fair, Poor, Replaced"
                    value={form.options}
                    onChange={(e) => setForm({ ...form, options: e.target.value })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding…' : 'Add Checklist Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-hairline bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-ink">Remove Custom Item?</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Are you sure you want to remove item{' '}
              <strong className="font-mono text-ink">{itemToDelete.code}</strong> (
              {itemToDelete.label}) from this bank&apos;s checklist?
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setItemToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="!bg-red-600 hover:!bg-red-700 !text-white shadow-xs"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(itemToDelete.id)}
              >
                {deleteMutation.isPending ? 'Removing…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
