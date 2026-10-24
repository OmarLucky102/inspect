import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  EnvelopeSimple,
  Phone,
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  Clock,
  CalendarBlank,
  CircleNotch,
  FloppyDisk,
  ArrowCounterClockwise,
  IdentificationBadge,
} from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import {
  fetchMyProfile,
  updateMyProfile,
  type UpdateProfileInput,
} from '../api'
import type { UserProfile } from '@/features/workspaces/api'

interface UserProfileFormProps {
  onSuccess?: (user: UserProfile) => void
  onCancel?: () => void
  showCancelButton?: boolean
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return '—'
  }
}

function getRoleBadgeStyle(role: string): { bg: string; text: string; border: string } {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'SYSTEM_ADMIN':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      }
    case 'MANAGER':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
      }
    case 'REVIEWER':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      }
    case 'REPRESENTATIVE':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
      }
    default:
      return {
        bg: 'bg-zinc-100',
        text: 'text-zinc-700',
        border: 'border-zinc-200',
      }
  }
}

interface ProfileContentProps {
  currentUser: UserProfile
  onSuccess?: (user: UserProfile) => void
  onCancel?: () => void
  showCancelButton?: boolean
}

function ProfileContent({
  currentUser,
  onSuccess,
  onCancel,
  showCancelButton = false,
}: ProfileContentProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { refreshUser } = useWorkspace()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form State initialized directly from currentUser without useEffect
  const [firstName, setFirstName] = useState(currentUser.firstName || '')
  const [lastName, setLastName] = useState(currentUser.lastName || '')
  const [phone, setPhone] = useState(currentUser.phone || '')

  // Track whether form is dirty
  const isDirty = useMemo(() => {
    return (
      firstName.trim() !== (currentUser.firstName || '').trim() ||
      lastName.trim() !== (currentUser.lastName || '').trim() ||
      phone.trim() !== (currentUser.phone || '').trim()
    )
  }, [currentUser, firstName, lastName, phone])

  // Reset to original values
  const handleReset = () => {
    setFirstName(currentUser.firstName || '')
    setLastName(currentUser.lastName || '')
    setPhone(currentUser.phone || '')
    setErrorMessage(null)
  }

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) => updateMyProfile(data),
    onSuccess: async (updated) => {
      toast.success('Profile updated successfully')
      setErrorMessage(null)
      queryClient.setQueryData(['user-profile', 'me'], updated)
      queryClient.invalidateQueries({ queryKey: ['user-profile', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      await refreshUser()
      onSuccess?.(updated)
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to update profile')
      setErrorMessage(msg)
      toast.error(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()

    if (!trimmedFirst) {
      setErrorMessage('First name is required')
      return
    }

    if (!trimmedLast) {
      setErrorMessage('Last name is required')
      return
    }

    updateMutation.mutate({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      phone: phone.trim() || undefined,
    })
  }

  const initials =
    `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase() || '..'
  const roleStyle = getRoleBadgeStyle(currentUser.role)
  const isEmailVerified = currentUser.isEmailVerified ?? true
  const isActive = currentUser.isActive ?? true

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Hero Overview Card */}
      <div className="rounded-xl sm:rounded-2xl border border-hairline bg-paper/40 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            {/* Avatar Circle with Status Dot */}
            <div className="relative shrink-0">
              <span className="flex size-12 sm:size-14 items-center justify-center rounded-xl sm:rounded-2xl bg-ink font-mono text-sm sm:text-base font-semibold text-white shadow-xs">
                {initials}
              </span>
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white ${
                  isActive ? 'bg-emerald-500' : 'bg-zinc-400'
                }`}
                title={isActive ? 'Account Active' : 'Account Inactive'}
              />
            </div>

            {/* Name, Role & Email */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-ink truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <span
                  className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                >
                  {currentUser.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium border ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isActive ? 'bg-emerald-600' : 'bg-zinc-400'
                    }`}
                  />
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-ink-mute">
                <span className="flex items-center gap-1.5 text-ink-soft truncate max-w-[220px] sm:max-w-none">
                  <EnvelopeSimple className="size-3.5 text-ink-mute shrink-0" />
                  <span className="truncate">{currentUser.email}</span>
                </span>
                {currentUser.phone && (
                  <span className="flex items-center gap-1.5 font-mono text-ink-soft">
                    <Phone className="size-3.5 text-ink-mute shrink-0" />
                    <span>{currentUser.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Email Verification Status Pill */}
          <div className="shrink-0 self-start sm:self-auto">
            {isEmailVerified ? (
              <div className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs text-emerald-800 shadow-2xs">
                <CheckCircle className="size-3.5 sm:size-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold leading-tight text-[10px] sm:text-[11px]">
                    Verified Email
                  </p>
                  {currentUser.emailVerifiedAt && (
                    <p className="text-[9px] sm:text-[10px] text-emerald-700/80">
                      {formatDate(currentUser.emailVerifiedAt)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs text-amber-800 shadow-2xs">
                <WarningCircle className="size-3.5 sm:size-4 text-amber-600 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold leading-tight text-[10px] sm:text-[11px]">
                    Pending Verification
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        <div className="rounded-xl sm:rounded-2xl border border-hairline bg-white p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="border-b border-hairline pb-2.5 flex items-center justify-between">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-ink">
                {t('profile.personalInfo', 'Personal Details')}
              </h4>
              <p className="text-[11px] text-ink-mute mt-0.5">
                Authorized editable fields for your account.
              </p>
            </div>
            <span className="font-mono text-[9px] sm:text-[10px] tracking-wider uppercase text-ink-mute bg-paper px-2 py-0.5 rounded border border-hairline">
              Self Service
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                {t('profile.firstName', 'First Name')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute ltr:left-3 rtl:right-3 top-2.5 size-4 text-ink-mute" />
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  required
                  className="ltr:pl-9 rtl:pr-9 text-xs h-9"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                {t('profile.lastName', 'Last Name')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute ltr:left-3 rtl:right-3 top-2.5 size-4 text-ink-mute" />
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Doe"
                  required
                  className="ltr:pl-9 rtl:pr-9 text-xs h-9"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email (Read-only) & Phone (Editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-ink">
                  {t('profile.email', 'Email Address')}
                </label>
                <span className="text-[9px] font-mono text-ink-mute uppercase tracking-wider">
                  Read-only
                </span>
              </div>
              <div className="relative">
                <EnvelopeSimple className="absolute ltr:left-3 rtl:right-3 top-2.5 size-4 text-ink-mute" />
                <Input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="ltr:pl-9 rtl:pr-9 text-xs h-9 bg-paper/60 text-ink-soft cursor-not-allowed border-hairline/80"
                />
              </div>
              <span className="text-[10px] text-ink-mute mt-1 block">
                Tied to your verified login credentials.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                {t('profile.phone', 'Phone Number')}
              </label>
              <div className="relative">
                <Phone className="absolute ltr:left-3 rtl:right-3 top-2.5 size-4 text-ink-mute" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +201012345678"
                  className="ltr:pl-9 rtl:pr-9 text-xs h-9 font-mono"
                  disabled={updateMutation.isPending}
                />
              </div>
              <span className="text-[10px] text-ink-mute mt-1 block">
                Direct mobile number for operational contact.
              </span>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-hairline">
            {showCancelButton && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto text-xs"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            )}

            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto gap-1.5 text-xs text-ink-soft"
              >
                <ArrowCounterClockwise className="size-3.5" />
                Discard
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={!isDirty || updateMutation.isPending}
              className="w-full sm:w-auto gap-2 bg-ink text-white hover:bg-ink/90 min-w-[130px] text-xs cursor-pointer disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <CircleNotch className="size-3.5 animate-spin" />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                <>
                  <FloppyDisk className="size-3.5" />
                  {t('common.saveChanges', 'Save Changes')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Security & Account Metadata (NO UUID EXPOSED) */}
        <div className="rounded-xl sm:rounded-2xl border border-hairline bg-white p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-hairline pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" />
              <h4 className="text-xs sm:text-sm font-semibold text-ink">Account & Status</h4>
            </div>
            <span className="font-mono text-[9px] sm:text-[10px] tracking-wider uppercase text-ink-mute bg-paper px-2 py-0.5 rounded border border-hairline">
              System Roles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
            {/* Role & Level */}
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-paper/40 border border-hairline">
              <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-ink-mute uppercase block mb-0.5">
                Assigned Role
              </span>
              <div className="flex items-center gap-1.5">
                <IdentificationBadge className="size-3.5 text-ink-mute shrink-0" />
                <span className="font-semibold text-ink">{currentUser.role}</span>
              </div>
            </div>

            {/* Operational Status */}
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-paper/40 border border-hairline">
              <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-ink-mute uppercase block mb-0.5">
                Account Status
              </span>
              <span className="font-medium text-ink flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    isActive ? 'bg-emerald-500' : 'bg-zinc-400'
                  }`}
                />
                {isActive ? 'Active Member' : 'Deactivated'}
              </span>
            </div>

            {/* Last Login */}
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-paper/40 border border-hairline">
              <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-ink-mute uppercase block mb-0.5">
                Last Login
              </span>
              <span className="text-ink-soft flex items-center gap-1.5">
                <Clock className="size-3.5 text-ink-mute shrink-0" />
                {formatDate(currentUser.lastLoginAt)}
              </span>
            </div>

            {/* Created At */}
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-paper/40 border border-hairline">
              <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-ink-mute uppercase block mb-0.5">
                Member Since
              </span>
              <span className="text-ink-soft flex items-center gap-1.5">
                <CalendarBlank className="size-3.5 text-ink-mute shrink-0" />
                {formatDate(currentUser.createdAt)}
              </span>
            </div>

            {/* Last Updated */}
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-paper/40 border border-hairline">
              <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-ink-mute uppercase block mb-0.5">
                Last Profile Update
              </span>
              <span className="text-ink-soft flex items-center gap-1.5">
                <Clock className="size-3.5 text-ink-mute shrink-0" />
                {formatDate(currentUser.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export function UserProfileForm({
  onSuccess,
  onCancel,
  showCancelButton = false,
}: UserProfileFormProps) {
  const { user: workspaceUser } = useWorkspace()

  // Fetch fresh profile from backend
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['user-profile', 'me'],
    queryFn: fetchMyProfile,
    initialData: workspaceUser ?? undefined,
  })

  if (isLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-ink-mute">
        <CircleNotch className="size-7 animate-spin text-accent mb-2.5" />
        <p className="text-xs">Loading profile...</p>
      </div>
    )
  }

  if (isError && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <WarningCircle className="size-7 text-rose-500 mb-2" />
        <h4 className="text-xs sm:text-sm font-semibold text-ink">Failed to load profile</h4>
        <p className="text-xs text-ink-mute mt-1 max-w-xs">
          Unable to fetch your profile from the server.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-3 text-xs"
        >
          Try Again
        </Button>
      </div>
    )
  }

  const currentUser = profile || workspaceUser
  if (!currentUser) return null

  return (
    <ProfileContent
      key={currentUser.email + (currentUser.updatedAt ?? '')}
      currentUser={currentUser}
      onSuccess={onSuccess}
      onCancel={onCancel}
      showCancelButton={showCancelButton}
    />
  )
}
