import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  CircleNotch,
  User,
  Car,
  Clock,
  ListChecks,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowRight,
  MapPin,
  ChatCenteredText,
  IdentificationCard,
  FileText,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'
import {
  fetchInspectionRequestDetails,
  fetchInspectionStatusHistory,
  updateInspectionStatus,
  assignRepresentative,
} from '../api'
import { fetchBankMembers, type BankMemberUser } from '@/features/banks/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'

interface RequestDetailModalProps {
  requestId: string
  onClose: () => void
}

export function RequestDetailModal({
  requestId,
  onClose,
}: RequestDetailModalProps) {
  const { activeBankId, user } = useWorkspace()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<
    'overview' | 'vehicle' | 'assignment' | 'history'
  >('overview')

  // Modals for actions
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedRepId, setSelectedRepId] = useState('')
  const [assignNotes, setAssignNotes] = useState('')

  const [statusAction, setStatusAction] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState('')

  // Query: Full Request Details
  const {
    data: details,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ['inspection-request-details', activeBankId, requestId],
    queryFn: () => fetchInspectionRequestDetails(activeBankId!, requestId),
    enabled: !!activeBankId && !!requestId,
  })

  // Query: Status History
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['inspection-request-history', activeBankId, requestId],
    queryFn: () => fetchInspectionStatusHistory(activeBankId!, requestId),
    enabled: !!activeBankId && !!requestId,
  })

  // Query: Bank Members for assignment
  const { data: bankMembers = [] } = useQuery({
    queryKey: ['bank-members', activeBankId],
    queryFn: () => fetchBankMembers(activeBankId!),
    enabled: !!activeBankId && isAssigning,
  })

  // Filter representatives
  const representatives = bankMembers.filter(
    (m: BankMemberUser) => m.role === 'REPRESENTATIVE',
  )

  // Mutation: Assign Representative
  const assignMutation = useMutation({
    mutationFn: (payload: { representativeId: string; notes?: string }) =>
      assignRepresentative(activeBankId!, requestId, payload),
    onSuccess: () => {
      toast.success('Representative assigned successfully')
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, requestId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-history', activeBankId, requestId],
      })
      setIsAssigning(false)
      setSelectedRepId('')
      setAssignNotes('')
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to assign representative')),
  })

  // Mutation: Update Status
  const statusMutation = useMutation({
    mutationFn: (payload: { status: string; note?: string }) =>
      updateInspectionStatus(activeBankId!, requestId, payload),
    onSuccess: (_, vars) => {
      toast.success(`Request status updated to ${vars.status}`)
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, requestId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-history', activeBankId, requestId],
      })
      setStatusAction(null)
      setStatusNote('')
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to update request status')),
  })

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRepId) {
      toast.error('Please select a representative')
      return
    }
    assignMutation.mutate({
      representativeId: selectedRepId,
      notes: assignNotes.trim() || undefined,
    })
  }

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!statusAction) return
    statusMutation.mutate({
      status: statusAction,
      note: statusNote.trim() || undefined,
    })
  }

  const getStatusBadge = (status: string) => {
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

  // Calculate allowable status actions
  const isManagerOrAdmin =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'MANAGER'
  const isReviewer = user?.role === 'REVIEWER'
  const isRep = user?.role === 'REPRESENTATIVE'

  const availableActions: Array<{
    status: string
    label: string
    variant?: 'primary' | 'outline'
  }> = []

  if (details) {
    const cur = details.currentStatus

    if (cur === 'PENDING') {
      if (isManagerOrAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        })
      }
    } else if (cur === 'ASSIGNED') {
      if (isRep || isManagerOrAdmin) {
        availableActions.push({
          status: 'IN_PROGRESS',
          label: 'Start Inspection',
          variant: 'primary',
        })
      }
      if (isManagerOrAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        })
      }
    } else if (cur === 'IN_PROGRESS') {
      if (isRep || isManagerOrAdmin) {
        availableActions.push({
          status: 'UNDER_REVIEW',
          label: 'Submit for Review',
          variant: 'primary',
        })
      }
      if (isManagerOrAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        })
      }
    } else if (cur === 'UNDER_REVIEW') {
      if (isReviewer || isManagerOrAdmin) {
        availableActions.push({
          status: 'COMPLETED',
          label: 'Complete Review',
          variant: 'primary',
        })
        availableActions.push({
          status: 'IN_PROGRESS',
          label: 'Request Rework',
          variant: 'outline',
        })
      }
      if (isManagerOrAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        })
      }
    } else if (cur === 'COMPLETED') {
      if (isReviewer || isManagerOrAdmin) {
        availableActions.push({
          status: 'APPROVED',
          label: 'Approve Inspection',
          variant: 'primary',
        })
        availableActions.push({
          status: 'REJECTED',
          label: 'Reject Inspection',
          variant: 'outline',
        })
      }
    }
  }

  const canAssign =
    isManagerOrAdmin &&
    details &&
    (details.currentStatus === 'PENDING' ||
      details.currentStatus === 'ASSIGNED')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex h-[90vh] max-h-[850px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline bg-paper/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FileText className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-lg font-bold text-ink">
                  {details?.requestNumber || 'Inspection Request'}
                </h3>
                {details && getStatusBadge(details.currentStatus)}
              </div>
              <p className="text-xs text-ink-mute">
                ID: {requestId} • Priority:{' '}
                <span className="font-mono font-medium text-ink">
                  {details?.priority ?? 'MEDIUM'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canAssign && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAssigning(true)}
              >
                <UserPlus className="mr-1 size-4" />
                {details.assignedRepresentative ? 'Reassign' : 'Assign'}
              </Button>
            )}

            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-mute hover:bg-paper hover:text-ink"
              onClick={onClose}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isDetailsLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <CircleNotch className="size-8 animate-spin text-ink-mute" />
          </div>
        ) : isDetailsError || !details ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <XCircle className="mb-2 size-10 text-rose-500" />
            <p className="font-medium text-ink">Failed to load request details</p>
            <p className="mt-1 text-xs text-ink-mute">
              Make sure you have proper permissions for this bank request.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => void refetchDetails()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Quick Transition Action Ribbon (if any available) */}
            {availableActions.length > 0 && (
              <div className="flex items-center justify-between border-b border-hairline bg-accent/5 px-6 py-2.5">
                <span className="text-xs font-medium text-ink-soft">
                  Next Available Workflow Actions:
                </span>
                <div className="flex items-center gap-2">
                  {availableActions.map((act) => (
                    <Button
                      key={act.status}
                      size="sm"
                      variant={act.variant ?? 'primary'}
                      onClick={() => setStatusAction(act.status)}
                    >
                      <ArrowRight className="size-3.5" />
                      {act.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-hairline bg-bone px-6">
              {[
                { key: 'overview', label: 'Overview & Customer', icon: User },
                { key: 'vehicle', label: 'Vehicle & Checklist', icon: Car },
                {
                  key: 'assignment',
                  label: 'Assignment',
                  icon: ShieldCheck,
                },
                {
                  key: 'history',
                  label: `Audit History (${history.length})`,
                  icon: Clock,
                },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-accent text-accent font-semibold'
                        : 'border-transparent text-ink-mute hover:text-ink'
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Panes */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Customer Card */}
                  <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <IdentificationCard className="size-4 text-accent" />
                      Customer Information
                    </h4>
                    {details.customer ? (
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                          <p className="text-[11px] text-ink-mute">Full Name</p>
                          <p className="mt-0.5 text-sm font-medium text-ink">
                            {details.customer.fullName}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Phone</p>
                          <p className="mt-0.5 font-mono text-sm font-medium text-ink">
                            {details.customer.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Email</p>
                          <p className="mt-0.5 text-sm text-ink-soft">
                            {details.customer.email || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">National ID</p>
                          <p className="mt-0.5 font-mono text-sm text-ink-soft">
                            {details.customer.nationalId || '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-ink-mute">
                        No customer details attached.
                      </p>
                    )}
                  </div>

                  {/* Location & Schedule Card */}
                  <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <MapPin className="size-4 text-accent" />
                      Location & Scheduling
                    </h4>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] text-ink-mute">Governorate</p>
                        <p className="mt-0.5 text-sm text-ink">
                          {details.location?.governorateName || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">City</p>
                        <p className="mt-0.5 text-sm text-ink">
                          {details.location?.cityName || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">Full Address</p>
                        <p className="mt-0.5 text-sm text-ink">
                          {details.location?.address || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">Requested Date</p>
                        <p className="mt-0.5 font-mono text-xs text-ink">
                          {new Date(details.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">Completion Target</p>
                        <p className="mt-0.5 font-mono text-xs text-ink">
                          {details.requestedCompletionDate
                            ? new Date(
                                details.requestedCompletionDate,
                              ).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">Completed At</p>
                        <p className="mt-0.5 font-mono text-xs text-ink">
                          {details.completedAt
                            ? new Date(details.completedAt).toLocaleString()
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes Card */}
                  {details.notes && (
                    <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <ChatCenteredText className="size-4 text-accent" />
                        Internal Notes & Instructions
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                        {details.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VEHICLE & CHECKLIST */}
              {activeTab === 'vehicle' && (
                <div className="space-y-6">
                  {/* Vehicle Spec Card */}
                  <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Car className="size-4 text-accent" />
                      Vehicle Specifications
                    </h4>
                    {details.vehicle ? (
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                          <p className="text-[11px] text-ink-mute">VIN</p>
                          <p className="mt-0.5 font-mono text-sm font-bold text-ink">
                            {details.vehicle.vin}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Plate Number</p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.plateNumber || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Make / Brand</p>
                          <p className="mt-0.5 text-sm font-medium text-ink">
                            {details.vehicle.brand?.name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Model</p>
                          <p className="mt-0.5 text-sm font-medium text-ink">
                            {details.vehicle.model?.name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Manufacture Year</p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.manufactureYear}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Mileage</p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.mileage != null
                              ? `${details.vehicle.mileage.toLocaleString()} km`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Category</p>
                          <p className="mt-0.5 text-sm text-ink">
                            {details.vehicle.category?.name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Color</p>
                          <p className="mt-0.5 text-sm text-ink">
                            {details.vehicle.color?.name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Fuel Type</p>
                          <p className="mt-0.5 text-sm text-ink">
                            {details.vehicle.fuelType?.name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Transmission</p>
                          <p className="mt-0.5 text-sm text-ink">
                            {details.vehicle.transmissionType?.name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Engine Number</p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.engineNumber || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Insurance Value</p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.insuranceValue != null
                              ? `$${details.vehicle.insuranceValue.toLocaleString()}`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-ink-mute">
                        No vehicle information linked to this request yet.
                      </p>
                    )}
                  </div>

                  {/* Checklist Items */}
                  <div className="rounded-xl border border-hairline bg-white shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-hairline bg-bone px-5 py-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <ListChecks className="size-4 text-accent" />
                        Inspection Checklist Items ({details.checklistItems.length})
                      </h4>
                    </div>

                    {details.checklistItems.length === 0 ? (
                      <p className="p-5 text-xs text-ink-mute">
                        No checklist items configured for this inspection request.
                      </p>
                    ) : (
                      <div className="divide-y divide-hairline">
                        {details.checklistItems.map((ci) => (
                          <div
                            key={ci.id}
                            className="flex items-center justify-between px-5 py-3 text-xs hover:bg-paper/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {ci.completed ? (
                                <CheckCircle className="size-4 text-emerald-600" />
                              ) : (
                                <span className="size-2 rounded-full bg-amber-400" />
                              )}
                              <div>
                                <span className="font-medium text-ink">
                                  {ci.label || ci.code}
                                </span>
                                <span className="ml-2 font-mono text-[10px] text-ink-mute">
                                  [{ci.code}]
                                </span>
                                {ci.isMandatory && (
                                  <span className="ml-2 rounded-md bg-rose-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-rose-700">
                                    MANDATORY
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-[11px] text-ink-soft">
                                {ci.value ? `Value: ${ci.value}` : 'No value'}
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${
                                  ci.completed
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}
                              >
                                {ci.completed ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ASSIGNMENT */}
              {activeTab === 'assignment' && (
                <div className="space-y-6">
                  {/* Current Active Assignment */}
                  <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-hairline pb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-ink">
                          Assigned Representative
                        </h4>
                        <p className="text-xs text-ink-mute">
                          Active field inspector responsible for evaluating this vehicle
                        </p>
                      </div>
                      {canAssign && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAssigning(true)}
                        >
                          <UserPlus className="mr-1 size-4" />
                          {details.assignedRepresentative ? 'Change Representative' : 'Assign Representative'}
                        </Button>
                      )}
                    </div>

                    {details.assignedRepresentative ? (
                      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 font-bold text-accent">
                            {details.assignedRepresentative.firstName[0]}
                            {details.assignedRepresentative.lastName[0]}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {details.assignedRepresentative.firstName}{' '}
                              {details.assignedRepresentative.lastName}
                            </p>
                            <p className="text-xs text-ink-mute">
                              ID: {details.assignedRepresentative.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-mute">Contact Email</p>
                          <p className="mt-0.5 text-xs font-mono text-ink">
                            {details.assignedRepresentative.email}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-mute">Phone Number</p>
                          <p className="mt-0.5 text-xs font-mono text-ink">
                            {details.assignedRepresentative.phone || '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline py-8 text-center">
                        <UserPlus className="mb-2 size-8 text-ink-mute" />
                        <p className="text-xs font-medium text-ink">
                          No representative assigned yet
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-mute">
                          Assign an active bank representative to conduct the on-site inspection.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Active Assignment Status Details */}
                  {details.activeAssignment && (
                    <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                      <h4 className="text-sm font-semibold text-ink">
                        Assignment Lifecycle Details
                      </h4>
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                          <p className="text-[11px] text-ink-mute">Status</p>
                          <span className="mt-0.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                            {details.activeAssignment.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Assigned At</p>
                          <p className="mt-0.5 font-mono text-xs text-ink">
                            {new Date(
                              details.activeAssignment.assignedAt,
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Accepted At</p>
                          <p className="mt-0.5 font-mono text-xs text-ink">
                            {details.activeAssignment.acceptedAt
                              ? new Date(
                                  details.activeAssignment.acceptedAt,
                                ).toLocaleString()
                              : 'Pending acceptance'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Rejected At</p>
                          <p className="mt-0.5 font-mono text-xs text-ink">
                            {details.activeAssignment.rejectedAt
                              ? new Date(
                                  details.activeAssignment.rejectedAt,
                                ).toLocaleString()
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AUDIT HISTORY TIMELINE */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-hairline pb-2">
                    <h4 className="text-sm font-semibold text-ink">
                      Status Change Audit Log
                    </h4>
                    <span className="font-mono text-xs text-ink-mute">
                      Total events: {history.length}
                    </span>
                  </div>

                  {isHistoryLoading ? (
                    <div className="flex justify-center py-10">
                      <CircleNotch className="size-6 animate-spin text-ink-mute" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="py-8 text-center text-xs text-ink-mute">
                      No status transitions recorded for this request yet.
                    </p>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline">
                      {history.map((item, idx) => {
                        const changerName =
                          typeof item.changedBy === 'object' && item.changedBy
                            ? `${item.changedBy.firstName} ${item.changedBy.lastName}`
                            : String(item.changedBy)

                        const changerEmail =
                          typeof item.changedBy === 'object' && item.changedBy
                            ? item.changedBy.email
                            : null

                        return (
                          <div key={item.id || idx} className="relative group">
                            {/* Marker */}
                            <span className="absolute -left-[27px] top-1.5 flex size-4 items-center justify-center rounded-full bg-white ring-4 ring-bone">
                              <span className="size-2 rounded-full bg-accent" />
                            </span>

                            <div className="rounded-xl border border-hairline bg-white p-4 shadow-2xs transition-shadow hover:shadow-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {item.fromStatus ? (
                                    <>
                                      {getStatusBadge(item.fromStatus)}
                                      <ArrowRight className="size-3 text-ink-mute" />
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-mono text-ink-mute uppercase">
                                      Initial
                                    </span>
                                  )}
                                  {getStatusBadge(item.toStatus)}
                                </div>
                                <span className="font-mono text-[11px] text-ink-mute">
                                  {new Date(item.changedAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="mt-2.5 flex items-center justify-between text-xs text-ink-soft border-t border-hairline/60 pt-2">
                                <div className="flex items-center gap-1.5">
                                  <User className="size-3.5 text-ink-mute" />
                                  <span className="font-medium text-ink">
                                    {changerName}
                                  </span>
                                  {changerEmail && (
                                    <span className="text-ink-mute">
                                      ({changerEmail})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {item.note && (
                                <p className="mt-2 rounded-lg bg-paper/60 px-3 py-1.5 text-xs text-ink-soft">
                                  <span className="font-semibold text-ink">
                                    Note:{' '}
                                  </span>
                                  {item.note}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-hairline bg-paper/30 px-6 py-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close Details
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ASSIGN REPRESENTATIVE MODAL */}
      {isAssigning && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
              onClick={() => setIsAssigning(false)}
            >
              <X className="size-5" />
            </button>
            <h3 className="text-base font-bold text-ink">
              Assign Field Representative
            </h3>
            <p className="mt-1 text-xs text-ink-mute">
              Assign an eligible representative to inspect{' '}
              <span className="font-mono font-medium text-ink">
                {details?.requestNumber}
              </span>
            </p>

            <form onSubmit={handleAssignSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Select Representative *
                </label>
                <select
                  required
                  value={selectedRepId}
                  onChange={(e) => setSelectedRepId(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="">-- Choose a Representative --</option>
                  {representatives.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.firstName} {rep.lastName} ({rep.email})
                    </option>
                  ))}
                </select>
                {representatives.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    No representatives found in this bank workspace. Add a
                    representative in the Bank/Users section.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Assignment Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Please expedite exterior photos"
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssigning(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assignMutation.isPending || !selectedRepId}
                >
                  {assignMutation.isPending ? 'Assigning…' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS TRANSITION CONFIRMATION MODAL */}
      {statusAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
              onClick={() => setStatusAction(null)}
            >
              <X className="size-5" />
            </button>
            <h3 className="text-base font-bold text-ink">
              Update Request Status
            </h3>
            <p className="mt-1 text-xs text-ink-mute">
              Transitioning request to{' '}
              <span className="font-mono font-semibold text-accent">
                {statusAction}
              </span>
            </p>

            <form onSubmit={handleStatusSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Reason / Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Physical on-site inspection completed without remarks."
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusAction(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={statusMutation.isPending}>
                  {statusMutation.isPending ? 'Updating…' : 'Confirm Status Change'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
