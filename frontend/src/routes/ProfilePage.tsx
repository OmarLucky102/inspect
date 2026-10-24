import { UserCircle, Palette, Globe } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { UserProfileForm } from '@/features/users/components/UserProfileForm'
import { ThemeSelector } from '@/components/layout/ThemeToggle'
import { LanguageSelector } from '@/components/layout/LanguageToggle'

export function ProfilePage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-300">
      {/* Page Header */}
      <div className="border-b border-hairline pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-paper px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-ink-mute uppercase border border-hairline">
            <UserCircle className="size-3 text-accent" />
            {t('profile.badge', 'Identity · Account')}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {t('profile.title', 'My Profile')}
        </h1>
        <p className="text-sm text-ink-mute mt-1">
          {t(
            'profile.subtitle',
            'Review your account role, active status, contact details, and update personal information.',
          )}
        </p>
      </div>

      {/* Language / Localization Preference Card */}
      <div className="max-w-4xl rounded-2xl border border-hairline bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-accent border border-hairline">
            <Globe className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">
              {t('profile.languageTitle', 'Language & Localization')}
            </h2>
            <p className="text-xs text-ink-mute">
              {t(
                'profile.languageDesc',
                'Choose your interface language. Seamlessly switch between English and Arabic with full RTL layout support.',
              )}
            </p>
          </div>
        </div>
        <LanguageSelector variant="cards" />
      </div>

      {/* Theme / Appearance Preference Card */}
      <div className="max-w-4xl rounded-2xl border border-hairline bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-accent border border-hairline">
            <Palette className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">
              {t('profile.themeTitle', 'Interface Theme')}
            </h2>
            <p className="text-xs text-ink-mute">
              {t(
                'profile.themeDesc',
                'Customize appearance across Inspect. Choose light, dark, or sync with your system.',
              )}
            </p>
          </div>
        </div>
        <ThemeSelector className="w-full sm:w-64 shrink-0" />
      </div>

      {/* Main Profile Form */}
      <div className="max-w-4xl">
        <UserProfileForm />
      </div>
    </div>
  )
}
