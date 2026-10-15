import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  CircleNotch,
  FloppyDisk,
  IdentificationCard,
  Info,
  Plus,
  ShieldCheck,
  Trash,
  Warning,
  XCircle,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { getApiErrorMessage } from '@/lib/api'
import {
  fetchInspectionPhotoChecklist,
  updateInspectionPhotoChecklist,
  type InspectionPhotoChecklistDto,
  type CustomPhotoCategory,
} from '../api'

interface InspectionPhotoChecklistTabProps {
  requestId: string
  bankId: string
  status: string
  initialChecklist?: InspectionPhotoChecklistDto | null
  mode?: 'tab' | 'wizard'
  onBack?: () => void
  onSubmitFinal?: () => void
  isSubmittingFinal?: boolean
}

export function InspectionPhotoChecklistTab({
  requestId,
  bankId,
  status,
  initialChecklist,
  mode = 'tab',
  onBack,
  onSubmitFinal,
  isSubmittingFinal = false,
}: InspectionPhotoChecklistTabProps) {
  const { user } = useWorkspace()
  const queryClient = useQueryClient()

  const isReviewerOrAdmin =
    !user?.role ||
    user?.role === 'MANAGER' ||
    user?.role === 'REVIEWER' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SYSTEM_ADMIN'

  const isLocked = [
    'COMPLETED',
    'APPROVED',
    'CANCELLED',
    'REJECTED',
  ].includes(status)

  // Standard photo state — default all to TRUE (Yes)
  const [licensePhoto, setLicensePhoto] = useState(true)
  const [airbagPhoto, setAirbagPhoto] = useState(true)
  const [roofPhoto, setRoofPhoto] = useState(true)
  const [odometerPhoto, setOdometerPhoto] = useState(true)
  const [chassisPhoto, setChassisPhoto] = useState(true)

  // Dynamic custom fields state
  const [customFields, setCustomFields] = useState<CustomPhotoCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [customFieldsError, setCustomFieldsError] = useState<string | null>(null)

  // Fetch checklist with fallback to initial data
  const {
    data: checklist,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['inspection-photo-checklist', bankId, requestId],
    queryFn: () => fetchInspectionPhotoChecklist(bankId, requestId),
    initialData: initialChecklist ?? undefined,
    enabled: !!bankId && !!requestId,
  })

  // Sync state when checklist data arrives
  useEffect(() => {
    if (checklist) {
      setLicensePhoto(checklist.licensePhoto !== false)
      setAirbagPhoto(checklist.airbagPhoto !== false)
      setRoofPhoto(checklist.roofPhoto !== false)
      setOdometerPhoto(checklist.odometerPhoto !== false)
      setChassisPhoto(checklist.chassisPhoto !== false)

      try {
        if (Array.isArray(checklist.customFields)) {
          setCustomFields(
            checklist.customFields.map((cf) => ({
              id: cf.id,
              name: cf.name,
              required: cf.required !== false,
            })),
          )
        } else {
          setCustomFields([])
        }
        setCustomFieldsError(null)
      } catch (err) {
        console.error('Failed to parse dynamic checklist categories:', err)
        setCustomFieldsError(
          'Failed to load dynamic custom categories. Standard photo requirements are loaded.',
        )
      }
    }
  }, [checklist])

  // Mutation to persist review criteria
  const updateMutation = useMutation({
    mutationFn: (payload: {
      licensePhoto: boolean
      airbagPhoto: boolean
      roofPhoto: boolean
      odometerPhoto: boolean
      chassisPhoto: boolean
      customFields: Array<{ id?: string; name: string; required: boolean }>
    }) => updateInspectionPhotoChecklist(bankId, requestId, payload),
    onSuccess: () => {
      toast.success('Inspection checklist updated successfully')
      void queryClient.invalidateQueries({
        queryKey: ['inspection-photo-checklist', bankId, requestId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', bankId, requestId],
      })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update inspection checklist'))
    },
  })

  const handleSaveChecklist = (
    overrides?: Partial<{
      licensePhoto: boolean
      airbagPhoto: boolean
      roofPhoto: boolean
      odometerPhoto: boolean
      chassisPhoto: boolean
      customFields: CustomPhotoCategory[]
    }>,
    onSuccessCallback?: () => void,
  ) => {
    if (isLocked) {
      toast.error('This inspection is finalized or locked and cannot be modified')
      return
    }

    if (!isReviewerOrAdmin) {
      toast.error('Only Bank Admins and Reviewers can modify checklist criteria')
      return
    }

    const payload = {
      licensePhoto: overrides?.licensePhoto ?? licensePhoto,
      airbagPhoto: overrides?.airbagPhoto ?? airbagPhoto,
      roofPhoto: overrides?.roofPhoto ?? roofPhoto,
      odometerPhoto: overrides?.odometerPhoto ?? odometerPhoto,
      chassisPhoto: overrides?.chassisPhoto ?? chassisPhoto,
      customFields: (overrides?.customFields ?? customFields).map((f) => ({
        id: f.id,
        name: f.name.trim(),
        required: f.required,
      })),
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        onSuccessCallback?.()
      },
    })
  }

  const handleToggleStandard = (
    field: 'license' | 'airbag' | 'roof' | 'odometer' | 'chassis',
    value: boolean,
  ) => {
    if (isLocked || !isReviewerOrAdmin) return

    const currentValues = {
      license: licensePhoto,
      airbag: airbagPhoto,
      roof: roofPhoto,
      odometer: odometerPhoto,
      chassis: chassisPhoto,
    }

    if (currentValues[field] === value) return

    let nextState = {
      licensePhoto,
      airbagPhoto,
      roofPhoto,
      odometerPhoto,
      chassisPhoto,
      customFields,
    }

    if (field === 'license') {
      setLicensePhoto(value)
      nextState.licensePhoto = value
    } else if (field === 'airbag') {
      setAirbagPhoto(value)
      nextState.airbagPhoto = value
    } else if (field === 'roof') {
      setRoofPhoto(value)
      nextState.roofPhoto = value
    } else if (field === 'odometer') {
      setOdometerPhoto(value)
      nextState.odometerPhoto = value
    } else if (field === 'chassis') {
      setChassisPhoto(value)
      nextState.chassisPhoto = value
    }

    handleSaveChecklist(nextState)
  }

  const handleToggleCustom = (index: number, value: boolean) => {
    if (isLocked || !isReviewerOrAdmin) return
    if (customFields[index]?.required === value) return

    const updated = [...customFields]
    updated[index] = { ...updated[index], required: value }
    setCustomFields(updated)
    handleSaveChecklist({ customFields: updated })
  }

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked || !isReviewerOrAdmin) return

    const trimmed = newCategoryName.trim()
    if (!trimmed) {
      toast.error('Category name cannot be empty')
      return
    }

    if (trimmed.length > 100) {
      toast.error('Category name must not exceed 100 characters')
      return
    }

    const duplicate = customFields.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      toast.error(`Custom category "${trimmed}" already exists`)
      return
    }

    // Default to "Yes" (true)
    const newField: CustomPhotoCategory = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: trimmed,
      required: true,
    }

    const updated = [...customFields, newField]
    setCustomFields(updated)
    setNewCategoryName('')
    handleSaveChecklist({ customFields: updated })
  }

  const handleRemoveCustomCategory = (index: number) => {
    if (isLocked || !isReviewerOrAdmin) return

    const updated = customFields.filter((_, i) => i !== index)
    setCustomFields(updated)
    handleSaveChecklist({ customFields: updated })
  }

  if (isLoading && !checklist) {
    return (
      <div className="flex justify-center py-16">
        <CircleNotch className="size-8 animate-spin text-ink-mute" />
      </div>
    )
  }

  if (isError && !checklist) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle className="mb-2 size-8 text-rose-500" />
        <p className="text-sm font-medium text-ink">
          Failed to load inspection checklist
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviewer Instructions Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-accent" />
        <div className="text-xs">
          <p className="font-semibold text-ink">
            Bank Reviewer Checklist Configuration
          </p>
          <p className="mt-0.5 leading-relaxed text-ink-soft">
            All photo requirements default to <strong>"Yes"</strong>. As a reviewer,
            toggle any requirement to <strong>"No"</strong> if it is rejected or
            deemed unnecessary for this inspection request. The field inspector will
            be constrained by these criteria.
          </p>
        </div>
      </div>

      {/* Locked Status Banner */}
      {isLocked && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800">
          <Warning className="size-4 shrink-0 text-amber-600" />
          <span>
            This inspection request is <strong>{status}</strong>. Checklist
            requirements are locked and cannot be modified.
          </span>
        </div>
      )}

      {/* Non-Reviewer Notice */}
      {!isReviewerOrAdmin && (
        <div className="flex items-center gap-2 rounded-xl border border-hairline bg-paper/60 px-4 py-2.5 text-xs text-ink-mute">
          <Info className="size-4 shrink-0" />
          <span>
            You are viewing this checklist in read-only mode. Only Bank Admins and
            Reviewers can toggle criteria.
          </span>
        </div>
      )}

      {/* Graceful Degradation Warning (if dynamic items failed) */}
      {customFieldsError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <Warning className="size-4 shrink-0 text-amber-600" />
          <span>{customFieldsError}</span>
        </div>
      )}

      {/* Standard Photo Requirements Card */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-hairline bg-paper/30 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Camera className="size-4 text-accent" />
            <h3 className="text-sm font-semibold text-ink">
              Standard Required Photo Categories
            </h3>
          </div>
          <span className="font-mono text-[11px] text-ink-mute">
            5 Mandatory Criteria
          </span>
        </div>

        <div className="divide-y divide-hairline">
          {/* 1. License Photo */}
          <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-paper/20">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <IdentificationCard className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">License Photo</p>
                <p className="text-[11px] text-ink-mute">
                  Vehicle traffic license card (front and back validation)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleButtons
                value={licensePhoto}
                disabled={isLocked || !isReviewerOrAdmin}
                onChange={(val) => handleToggleStandard('license', val)}
              />
            </div>
          </div>

          {/* 2. Airbag Photo */}
          <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-paper/20">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">Airbag Photo</p>
                <p className="text-[11px] text-ink-mute">
                  Steering wheel, passenger dash, and side curtain airbag integrity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleButtons
                value={airbagPhoto}
                disabled={isLocked || !isReviewerOrAdmin}
                onChange={(val) => handleToggleStandard('airbag', val)}
              />
            </div>
          </div>

          {/* 3. Roof Photo */}
          <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-paper/20">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Camera className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">Roof Photo</p>
                <p className="text-[11px] text-ink-mute">
                  Roof panel surface, paint thickness, and panoramic glass assessment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleButtons
                value={roofPhoto}
                disabled={isLocked || !isReviewerOrAdmin}
                onChange={(val) => handleToggleStandard('roof', val)}
              />
            </div>
          </div>

          {/* 4. Odometer Photo */}
          <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-paper/20">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Camera className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">Odometer Photo</p>
                <p className="text-[11px] text-ink-mute">
                  Instrument cluster display showing verified kilometer reading
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleButtons
                value={odometerPhoto}
                disabled={isLocked || !isReviewerOrAdmin}
                onChange={(val) => handleToggleStandard('odometer', val)}
              />
            </div>
          </div>

          {/* 5. Chassis Photo */}
          <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-paper/20">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Camera className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">Chassis Photo</p>
                <p className="text-[11px] text-ink-mute">
                  Stamped VIN chassis number plate on metal frame
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleButtons
                value={chassisPhoto}
                disabled={isLocked || !isReviewerOrAdmin}
                onChange={(val) => handleToggleStandard('chassis', val)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Custom Photo Categories Card */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-hairline bg-paper/30 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Dynamic Custom Photo Requirements
            </h3>
            <p className="text-[11px] text-ink-mute">
              Bank-defined custom inspection targets (e.g. Trunk interior, Underbody)
            </p>
          </div>
          <span className="font-mono text-[11px] text-ink-mute">
            {customFields.length} Custom {customFields.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* Existing Custom Items List */}
        {customFields.length === 0 ? (
          <div className="p-6 text-center text-xs text-ink-mute">
            No custom photo categories configured yet. Add one below if specific
            evidence is needed.
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {customFields.map((field, idx) => (
              <div
                key={field.id || idx}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-paper/20"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-paper font-mono text-xs text-ink-mute">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">{field.name}</p>
                    <p className="font-mono text-[10px] text-ink-mute">
                      Custom Bank Requirement
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ToggleButtons
                    value={field.required}
                    disabled={isLocked || !isReviewerOrAdmin}
                    onChange={(val) => handleToggleCustom(idx, val)}
                  />

                  {isReviewerOrAdmin && !isLocked && (
                    <button
                      type="button"
                      title="Remove custom category"
                      className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => handleRemoveCustomCategory(idx)}
                    >
                      <Trash className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Category Form */}
        {isReviewerOrAdmin && !isLocked && (
          <form
            onSubmit={handleAddCustomCategory}
            className="flex items-center gap-3 border-t border-hairline bg-bone/60 p-4"
          >
            <Input
              placeholder="Add custom category (e.g. Trunk interior, Sunroof seals)..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="h-9 text-xs"
              maxLength={100}
            />
            <Button type="submit" size="sm" className="shrink-0">
              <Plus className="mr-1 size-3.5" />
              Add Category
            </Button>
          </form>
        )}
      </div>

      {/* Footer Actions: Wizard Mode vs Tab Mode */}
      {mode === 'wizard' ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Vehicle Info
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={() =>
                handleSaveChecklist(undefined, () =>
                  toast.success('Inspection checklist saved as draft'),
                )
              }
            >
              {updateMutation.isPending ? (
                <CircleNotch className="mr-1.5 size-4 animate-spin" />
              ) : (
                <FloppyDisk className="mr-1.5 size-4" />
              )}
              Save Checklist Draft
            </Button>

            <Button
              type="button"
              disabled={isSubmittingFinal || updateMutation.isPending}
              onClick={() => {
                handleSaveChecklist(undefined, () => {
                  onSubmitFinal?.()
                })
              }}
            >
              {isSubmittingFinal ? (
                <CircleNotch className="mr-1.5 size-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-1.5 size-4" />
              )}
              Submit Inspection Request
            </Button>
          </div>
        </div>
      ) : (
        /* Manual Save / Sync Status Footer for Tab */
        <div className="flex items-center justify-between rounded-xl border border-hairline bg-paper/30 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-ink-mute">
            {updateMutation.isPending ? (
              <>
                <CircleNotch className="size-3.5 animate-spin text-accent" />
                <span>Saving criteria...</span>
              </>
            ) : updateMutation.isSuccess ? (
              <>
                <CheckCircle className="size-3.5 text-emerald-600" />
                <span className="text-emerald-700">All changes saved live</span>
              </>
            ) : (
              <span>Toggles save automatically on review.</span>
            )}
          </div>

          {isReviewerOrAdmin && !isLocked && (
            <Button
              size="sm"
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={() => handleSaveChecklist()}
            >
              <FloppyDisk className="mr-1 size-3.5" />
              Save Checklist
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Reusable Yes / No Segmented Pill Toggle
 */
interface ToggleButtonsProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function ToggleButtons({
  value,
  onChange,
  disabled = false,
}: ToggleButtonsProps) {
  return (
    <div className="inline-flex rounded-lg border border-hairline bg-paper/60 p-0.5 text-xs font-semibold">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!value) onChange(true)
        }}
        className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs transition-all ${
          value
            ? 'bg-emerald-600 text-white shadow-2xs font-bold'
            : 'text-ink-mute hover:text-ink disabled:opacity-50'
        }`}
      >
        <CheckCircle className="size-3" weight={value ? 'bold' : 'regular'} />
        Yes
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (value) onChange(false)
        }}
        className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs transition-all ${
          !value
            ? 'bg-rose-600 text-white shadow-2xs font-bold'
            : 'text-ink-mute hover:text-ink disabled:opacity-50'
        }`}
      >
        <XCircle className="size-3" weight={!value ? 'bold' : 'regular'} />
        No
      </button>
    </div>
  )
}
