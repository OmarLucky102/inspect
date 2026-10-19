import { ClipboardText, CircleNotch, Plus, FunnelSimple } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import {
  fetchInspectionRequests,
  type InspectionRequest,
} from '@/features/inspection-requests/api'
import { RequestDetailModal } from '@/features/inspection-requests/components/RequestDetailModal'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    PENDING: 'bg-amber-500/10 text-amber-800 border-amber-300',
    PENDING_ASSIGNMENT: 'bg-cyan-500/10 text-cyan-800 border-cyan-300',
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
  const { activeBankId, user } = useWorkspace()
  const navigate = useNavigate()
  const [selectedRequest, setSelectedRequest] = useState<InspectionRequest | null>(null)
  const [reviewerQueueFilter, setReviewerQueueFilter] = useState<'ALL' | 'INITIAL' | 'MEDIA' | 'DONE'>('ALL')

  const isReviewer = user?.role === 'REVIEWER'

  // Build query key and status param based on role and active queue filter
  let statusParam: string | undefined = undefined
  if (isReviewer) {
    if (reviewerQueueFilter === 'INITIAL') statusParam = 'PENDING'
    else if (reviewerQueueFilter === 'MEDIA') statusParam = 'UNDER_REVIEW'
    else if (reviewerQueueFilter === 'DONE') statusParam = 'COMPLETED,APPROVED,REJECTED'
    else statusParam = undefined // 'ALL' shows all requests so state updates in-place without disappearing
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['inspection-requests', activeBankId, statusParam],
    queryFn: () => fetchInspectionRequests(activeBankId!, statusParam),
    enabled: !!activeBankId,
  })

  if (!activeBankId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
        <p>Please select a bank workspace first.</p>
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
    if (isReviewer) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-hairline bg-white p-4 rounded-xl">
            <div>
              <h2 className="font-semibold text-ink">Reviewer Workflow Queues</h2>
              <p className="text-xs text-ink-mute">Initial intake reviews and field media inspections</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-hairline bg-paper p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setReviewerQueueFilter('ALL')}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  reviewerQueueFilter === 'ALL'
                    ? 'bg-white font-semibold text-accent shadow-xs'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                All Requests
              </button>
              <button
                type="button"
                onClick={() => setReviewerQueueFilter('INITIAL')}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  reviewerQueueFilter === 'INITIAL'
                    ? 'bg-white font-semibold text-accent shadow-xs'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                Initial Review (Pending)
              </button>
              <button
                type="button"
                onClick={() => setReviewerQueueFilter('MEDIA')}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  reviewerQueueFilter === 'MEDIA'
                    ? 'bg-white font-semibold text-accent shadow-xs'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                Media Review (Under Review)
              </button>
              <button
                type="button"
                onClick={() => setReviewerQueueFilter('DONE')}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  reviewerQueueFilter === 'DONE'
                    ? 'bg-white font-semibold text-accent shadow-xs'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                History
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-white py-16 text-center shadow-xs">
            <ClipboardText className="size-12 text-ink-mute" />
            <h3 className="mt-3 text-base font-bold text-ink">No Requests in Reviewer Queue</h3>
            <p className="mt-1 text-xs text-ink-mute max-w-sm">
              There are currently no inspection requests matching this review queue filter.
            </p>
          </div>
        </div>
      )
    }

    return (
      <ModuleEmptyState
        kicker="CORE WORKFLOW"
        title="Inspection Requests."
        body="Create and manage vehicle inspection requests for your bank."
        icon={ClipboardText}
        actionLabel="New Request"
        onAction={() => navigate('/requests/new')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline bg-paper/30 px-6 py-4">
          <div>
            {isReviewer ? (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-ink">Reviewer Workflow Queues</h2>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 border border-accent/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent tracking-wider">
                    <FunnelSimple className="size-3" />
                    {reviewerQueueFilter}
                  </span>
                </div>
                <p className="text-xs text-ink-mute">Initial intake reviews (Stage 2) & media evaluations (Stage 4)</p>
              </>
            ) : (
              <>
                <h2 className="font-semibold text-ink">Inspection Requests</h2>
                <p className="text-xs text-ink-mute">Intake and status of vehicle inspections</p>
              </>
            )}
          </div>

          {isReviewer ? (
            <div className="flex items-center gap-1 rounded-xl border border-hairline bg-paper p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setReviewerQueueFilter('ALL')}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  reviewerQueueFilter === 'ALL'
                    ? 'bg-white font-semibold text-accent shadow-xs'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                All Requests
              </button>
              <button
                type="button"
                onClick={() => setReviewerQueueFilter('INITIAL')}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  reviewerQueueFilter === 'INITIAL'
                    ? 'bg-white font-semibold text-accent shadow-xs'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                Initial Review
              </button>
              <button
                type="button"
                onClick={() => setReviewerQueueFilter('MEDIA')}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  reviewerQueueFilter === 'MEDIA'
                    ? 'bg-white font-semibold text-accent shadow-xs'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                Media Review
              </button>
              <button
                type="button"
                onClick={() => setReviewerQueueFilter('DONE')}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  reviewerQueueFilter === 'DONE'
                    ? 'bg-white font-semibold text-accent shadow-xs'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                History
              </button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/requests/new')}>
              <Plus className="mr-1 size-4" /> New Request
            </Button>
          )}
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
                    <div className="flex items-center justify-end gap-2">
                      {r.currentStatus === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/requests/new?requestId=${r.id}`)}
                          className="text-xs text-accent hover:border-accent hover:text-accent-deep"
                        >
                          Continue Intake
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(r)}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <RequestDetailModal
          requestId={selectedRequest.id}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  )
}
