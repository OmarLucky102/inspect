import { Globe, Check } from '@phosphor-icons/react'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  changeAppLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/lib/i18n'
import { cn } from '@/lib/cn'

interface LanguageSelectorProps {
  className?: string
  variant?: 'cards' | 'segmented' | 'dropdown'
  onChanged?: (lang: SupportedLanguage) => void
}

/**
 * Full interactive language selector component for User Profile page.
 * Displays English and Arabic choices with visual indicators, flags, and descriptions.
 */
export function LanguageSelector({
  className,
  variant = 'cards',
  onChanged,
}: LanguageSelectorProps) {
  const { i18n } = useTranslation()
  const currentLang = (i18n.language?.startsWith('ar') ? 'ar' : 'en') as SupportedLanguage

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    if (lang === currentLang) return
    void changeAppLanguage(lang)
    onChanged?.(lang)
    toast.success(
      lang === 'ar'
        ? 'تم تغيير لغة النظام إلى العربية بنجاح'
        : 'Language changed to English successfully',
    )
  }

  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-xl border border-hairline bg-paper/60 p-1 text-xs',
          className,
        )}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentLang === lang.code
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelectLanguage(lang.code)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer',
                isSelected
                  ? 'bg-white text-ink shadow-xs border border-hairline/80 font-semibold'
                  : 'text-ink-mute hover:text-ink hover:bg-white/40',
              )}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Default 'cards' variant: two prominent selectable cards
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isSelected = currentLang === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelectLanguage(lang.code)}
            className={cn(
              'group relative flex items-start gap-3.5 rounded-xl border p-3.5 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent',
              isSelected
                ? 'border-accent bg-accent/5 ring-1 ring-accent/30 shadow-xs'
                : 'border-hairline bg-paper/40 hover:border-hairline/90 hover:bg-paper/70',
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white border border-hairline text-base shadow-2xs">
              {lang.flag}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                  {lang.nativeName}
                </span>
                <span
                  className={cn(
                    'font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border tracking-wider',
                    isSelected
                      ? 'border-accent/40 bg-accent/10 text-accent font-semibold'
                      : 'border-hairline bg-paper text-ink-mute',
                  )}
                >
                  {lang.code.toUpperCase()} · {lang.dir.toUpperCase()}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-mute truncate">
                {lang.name} — {lang.description}
              </p>
            </div>

            {isSelected && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-2xs mt-0.5">
                <Check className="size-3" weight="bold" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Compact Quick Language Toggle for Admin Header and Navigation Bars.
 * Provides a dropdown or direct toggle between EN and AR.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = (i18n.language?.startsWith('ar') ? 'ar' : 'en') as SupportedLanguage
  const activeObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ||
    SUPPORTED_LANGUAGES[0]

  useEffect(() => {
    if (!isOpen) return
    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const toggleLanguage = () => {
    const nextLang: SupportedLanguage = currentLang === 'en' ? 'ar' : 'en'
    void changeAppLanguage(nextLang)
    toast.success(
      nextLang === 'ar'
        ? 'تم تغيير لغة النظام إلى العربية بنجاح'
        : 'Language changed to English successfully',
    )
  }

  return (
    <div ref={dropdownRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={toggleLanguage}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-hairline bg-white/80 px-2.5 text-xs font-medium text-ink-soft shadow-2xs backdrop-blur-xs transition-colors hover:bg-paper hover:text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        title={`Current language: ${activeObj.nativeName}. Click to switch to ${
          currentLang === 'en' ? 'العربية' : 'English'
        }`}
        aria-label="Switch Language"
      >
        <Globe className="size-4 text-accent" />
        <span className="font-semibold">{currentLang === 'en' ? 'EN' : 'عربي'}</span>
        <span className="text-sm leading-none opacity-80">{activeObj.flag}</span>
      </button>
    </div>
  )
}
