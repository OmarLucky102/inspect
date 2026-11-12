import { UserCircle, Palette, Globe } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { UserProfileForm } from '@/features/users/components/UserProfileForm'
import { ThemeSelector } from '@/components/layout/ThemeToggle'
import { LanguageSelector } from '@/components/layout/LanguageToggle'
import { PageHeader } from '@/components/layout/PageHeader'

export function ProfilePage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-300">
      <PageHeader
        kicker={t('profile.badge', 'Identity · Account')}
        kickerIcon={UserCircle}
        title={t('profile.title', 'My Profile')}
        subtitle={t(
          'profile.subtitle',
          'Review your account role, active status, contact details, and update personal information.',
        )}
      />

      {/* Language / Localization Preference Card */}
      <div className="rounded-2xl border border-hairline bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4">
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
      <div className="rounded-2xl border border-hairline bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      <div>
        <UserProfileForm />
      </div>
    </div>
  )
}
