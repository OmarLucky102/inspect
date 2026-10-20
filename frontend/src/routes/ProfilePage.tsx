import { UserCircle } from '@phosphor-icons/react'
import { UserProfileForm } from '@/features/users/components/UserProfileForm'

export function ProfilePage() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-300">
      {/* Page Header */}
      <div className="border-b border-hairline pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-paper px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-ink-mute uppercase border border-hairline">
            <UserCircle className="size-3 text-accent" />
            Identity · Account
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          My Profile
        </h1>
        <p className="text-sm text-ink-mute mt-1">
          Review your account role, active status, contact details, and update personal information.
        </p>
      </div>

      {/* Main Profile Form */}
      <div className="max-w-4xl">
        <UserProfileForm />
      </div>
    </div>
  )
}
