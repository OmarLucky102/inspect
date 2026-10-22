import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Desktop } from '@phosphor-icons/react'

/**
 * 1-Click Header Toggle Button (Sun <-> Moon)
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Toggle theme"
        className={`size-9 rounded-xl border border-hairline bg-white/70 flex items-center justify-center text-ink-mute opacity-50 ${className}`}
      >
        <Sun className="size-4.5" />
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`size-9 rounded-xl border border-hairline bg-white p-2 flex items-center justify-center text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer shadow-2xs ${className}`}
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-400" weight="fill" />
      ) : (
        <Moon className="size-4.5 text-ink-soft" weight="fill" />
      )}
    </button>
  )
}

/**
 * 3-Way Segmented Selector (Light / Dark / System) for User Profile Dropdown
 */
export function ThemeSelector({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`h-8 rounded-lg bg-paper/60 animate-pulse ${className}`} />
    )
  }

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Desktop },
  ] as const

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className={`grid grid-cols-3 gap-1 rounded-xl border border-hairline bg-paper/80 p-1 text-xs font-medium ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon
        const isSelected = theme === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-all cursor-pointer ${
              isSelected
                ? 'bg-white font-semibold text-accent shadow-xs'
                : 'text-ink-mute hover:text-ink hover:bg-white/40'
            }`}
          >
            <Icon
              className="size-3.5"
              weight={isSelected ? 'fill' : 'regular'}
            />
            <span>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
