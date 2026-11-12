import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CaretDown, Check, MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useDropdownDismiss } from '@/lib/use-dropdown-dismiss'

export interface SelectOption {
  value: string
  label: string
  secondaryLabel?: string
  badge?: string
  colorDot?: string
  monogram?: string
  icon?: ReactNode
  keywords?: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  /** true = always show search; 'auto' = show when options.length > searchThreshold; false = hidden */
  searchable?: boolean | 'auto'
  searchThreshold?: number
  clearable?: boolean
  disabled?: boolean
  disabledMessage?: string
  required?: boolean
  ariaLabel?: string
  className?: string
  triggerClassName?: string
  menuClassName?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle'
  leadingIcon?: ReactNode
  align?: 'stretch' | 'start' | 'end'
  menuHeader?: {
    title: string
    badge?: string
  }
  menuFooter?: ReactNode | ((close: () => void) => ReactNode)
  emptyText?: string
  onAddNew?: () => void
  addNewText?: string
}

const SIZE_CLASSES: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'h-9 rounded-xl px-2.5 text-xs',
  md: 'min-h-[38px] rounded-xl px-3.5 py-2 text-sm',
  lg: 'h-11 rounded-xl px-3.5 text-sm shadow-[inset_0_1px_2px_rgba(20,23,26,0.05)]',
}

const VARIANT_CLASSES: Record<NonNullable<SelectProps['variant']>, string> = {
  default: 'border-hairline bg-white hover:border-ink/25',
  subtle: 'border-hairline bg-paper hover:border-ink/25 hover:bg-bone',
}

/**
 * Unified dropdown select primitive used across toolbars, headers, filters, and forms.
 * Renders via a viewport-aware portal so menus never clip inside overflow containers
 * and follow light/dark theme tokens plus LTR/RTL direction consistently.
 */
export function Select({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  searchable = false,
  searchThreshold = 5,
  clearable = false,
  disabled = false,
  disabledMessage,
  required = false,
  ariaLabel,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  size = 'md',
  variant = 'default',
  leadingIcon,
  align = 'stretch',
  menuHeader,
  menuFooter,
  emptyText,
  onAddNew,
  addNewText,
}: SelectProps) {
  const { t } = useTranslation()
  const resolvedPlaceholder =
    placeholder ?? t('common.selectOption', 'Select an option...')
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t('common.typeToSearch', 'Type to search...')
  const resolvedEmptyText =
    emptyText ?? t('common.noOptions', 'No options found')

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }, [])

  useDropdownDismiss(isOpen, closeMenu, [triggerRef, menuRef])

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  )

  const showSearch =
    searchable === true ||
    (searchable === 'auto' && options.length > searchThreshold)

  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchTerm.trim()) return options
    const query = searchTerm.toLowerCase().trim()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.secondaryLabel && opt.secondaryLabel.toLowerCase().includes(query)) ||
        (opt.badge && opt.badge.toLowerCase().includes(query)) ||
        (opt.monogram && opt.monogram.toLowerCase().includes(query)) ||
        (opt.keywords && opt.keywords.toLowerCase().includes(query)),
    )
  }, [options, searchTerm, showSearch])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const isRtl = document.documentElement.dir === 'rtl'
    const viewportPadding = 8
    const maxViewportW = window.innerWidth - viewportPadding * 2
    const measuredW = menuRef.current?.offsetWidth ?? 0

    let left = rect.left
    const widthStyle: CSSProperties = {}

    if (align === 'stretch') {
      widthStyle.width = rect.width
    } else {
      const targetW = Math.min(
        Math.max(rect.width, measuredW || 288),
        maxViewportW,
      )
      const anchorRight =
        (align === 'end' && !isRtl) || (align === 'start' && isRtl)
      left = anchorRight ? rect.right - targetW : rect.left
      left = Math.max(
        viewportPadding,
        Math.min(left, window.innerWidth - targetW - viewportPadding),
      )
      widthStyle.minWidth = Math.max(rect.width, 256)
      widthStyle.maxWidth = maxViewportW
    }

    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openAbove = spaceBelow < 240 && spaceAbove > spaceBelow
    const maxHeight = Math.max(
      160,
      Math.min(340, (openAbove ? spaceAbove : spaceBelow) - 6),
    )

    setMenuStyle({
      position: 'fixed',
      left,
      ...widthStyle,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
      maxHeight,
    })
  }, [align])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()
  }, [isOpen, filteredOptions.length, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    if (showSearch) {
      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true })
      }, 40)
      return () => clearTimeout(timer)
    }
  }, [isOpen, showSearch])

  useEffect(() => {
    if (!isOpen) return

    const handleScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return
      updatePosition()
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen, updatePosition])

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return
    onChange(opt.value)
    closeMenu()
    triggerRef.current?.focus({ preventScroll: true })
  }

  const handleClear = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation()
    event.preventDefault()
    onChange('')
    setSearchTerm('')
  }

  const moveHighlight = (delta: 1 | -1) => {
    if (filteredOptions.length === 0) return
    let next = highlightedIndex
    for (let step = 0; step < filteredOptions.length; step++) {
      next =
        (next + delta + filteredOptions.length) % filteredOptions.length
      if (!filteredOptions[next]?.disabled) {
        setHighlightedIndex(next)
        return
      }
    }
  }

  const handleKeyNavigation = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return

    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        setIsOpen(true)
        const selectedIdx = filteredOptions.findIndex((o) => o.value === value)
        setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveHighlight(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveHighlight(-1)
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault()
      const target = filteredOptions[highlightedIndex]
      if (target) handleSelect(target)
    }
  }

  const selectedVisual = selectedOption?.icon ? (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-ink text-white shadow-2xs">
      {selectedOption.icon}
    </span>
  ) : selectedOption?.monogram ? (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-ink font-mono text-[10px] font-bold uppercase text-white shadow-2xs">
      {selectedOption.monogram}
    </span>
  ) : selectedOption?.colorDot ? (
    <span
      className="size-3.5 shrink-0 rounded-full border border-hairline shadow-2xs"
      style={{ backgroundColor: selectedOption.colorDot }}
    />
  ) : leadingIcon ? (
    <span className="shrink-0 text-ink-mute">{leadingIcon}</span>
  ) : null

  return (
    <div className={cn('relative', className)}>
      {/* Hidden input preserves native HTML5 required form validation */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
        required={required}
        value={value}
        onChange={() => {}}
      />

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onKeyDown={handleKeyNavigation}
        onClick={() => {
          if (disabled) return
          if (isOpen) {
            closeMenu()
          } else {
            const idx = options.findIndex((o) => o.value === value)
            setHighlightedIndex(idx >= 0 ? idx : 0)
            setIsOpen(true)
          }
        }}
        className={cn(
          'group flex w-full items-center justify-between gap-2 border text-start transition-all duration-150 outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25',
          SIZE_CLASSES[size],
          disabled
            ? 'cursor-not-allowed border-hairline bg-paper/60 text-ink-mute opacity-75'
            : cn('cursor-pointer', VARIANT_CLASSES[variant]),
          isOpen && 'border-accent ring-2 ring-accent/20 shadow-sm',
          triggerClassName,
        )}
        title={disabled && disabledMessage ? disabledMessage : undefined}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selectedOption ? (
            <>
              {selectedVisual}
              <span className="truncate font-medium text-ink">
                {selectedOption.label}
              </span>
              {selectedOption.secondaryLabel && (
                <span className="truncate font-sans text-xs text-ink-mute">
                  · {selectedOption.secondaryLabel}
                </span>
              )}
              {selectedOption.badge && (
                <span className="shrink-0 rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-mute border border-hairline">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <>
              {leadingIcon && (
                <span className="shrink-0 text-ink-mute">{leadingIcon}</span>
              )}
              <span className="truncate text-ink-mute">
                {disabled && disabledMessage
                  ? disabledMessage
                  : resolvedPlaceholder}
              </span>
            </>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-1 text-ink-mute group-hover:text-ink">
          {clearable && Boolean(value) && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e)
              }}
              className="rounded p-0.5 transition-colors hover:bg-paper hover:text-ink"
              title={t('common.clear', 'Clear selection')}
            >
              <X className="size-3.5" />
            </span>
          )}
          <CaretDown
            className={cn(
              'size-3.5 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180 text-ink',
            )}
          />
        </span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            onKeyDown={handleKeyNavigation}
            className={cn(
              'z-[120] flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150',
              menuClassName,
            )}
          >
            {menuHeader && (
              <div className="flex shrink-0 items-center justify-between border-b border-hairline/70 bg-paper/50 px-3.5 py-2.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                  {menuHeader.title}
                </span>
                {menuHeader.badge && (
                  <span className="rounded-full border border-hairline bg-paper px-2 py-0.5 font-mono text-[10px] font-medium text-ink-soft">
                    {menuHeader.badge}
                  </span>
                )}
              </div>
            )}

            {showSearch && (
              <div className="shrink-0 border-b border-hairline/70 bg-paper/40 p-2">
                <div className="relative flex items-center">
                  <MagnifyingGlass className="pointer-events-none absolute start-2.5 size-3.5 text-ink-mute" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setHighlightedIndex(0)
                    }}
                    placeholder={resolvedSearchPlaceholder}
                    className="w-full rounded-lg border border-hairline/70 bg-white py-1.5 ps-8 pe-7 text-xs text-ink outline-none transition-colors placeholder:text-ink-mute/70 focus:border-accent"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('')
                        inputRef.current?.focus({ preventScroll: true })
                      }}
                      className="absolute end-2 cursor-pointer text-ink-mute hover:text-ink"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
              {filteredOptions.length === 0 ? (
                <div className="space-y-2 px-3 py-5 text-center text-xs text-ink-mute">
                  <p>{resolvedEmptyText}</p>
                  {onAddNew && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        closeMenu()
                        onAddNew()
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-accent-deep"
                    >
                      <Plus className="size-3.5" />
                      <span>{addNewText || t('common.addNew', 'Add new option')}</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {filteredOptions.map((opt, idx) => {
                    const isSelected = opt.value === value
                    const isHighlighted = idx === highlightedIndex
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={opt.disabled}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onClick={() => handleSelect(opt)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-start text-xs sm:text-sm transition-colors',
                          opt.disabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer',
                          isSelected
                            ? 'bg-accent/10 font-semibold text-accent'
                            : isHighlighted
                              ? 'bg-paper text-ink'
                              : 'text-ink-soft hover:bg-paper hover:text-ink',
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          {opt.icon && (
                            <span
                              className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors',
                                isSelected
                                  ? 'border-accent/30 bg-accent text-white'
                                  : 'border-hairline bg-paper text-ink',
                              )}
                            >
                              {opt.icon}
                            </span>
                          )}
                          {!opt.icon && opt.monogram && (
                            <span
                              className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] font-bold uppercase transition-colors',
                                isSelected
                                  ? 'border-accent/30 bg-accent text-white'
                                  : 'border-hairline bg-paper text-ink',
                              )}
                            >
                              {opt.monogram}
                            </span>
                          )}
                          {opt.colorDot && (
                            <span
                              className="size-3.5 shrink-0 rounded-full border border-hairline shadow-2xs"
                              style={{ backgroundColor: opt.colorDot }}
                            />
                          )}
                          <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <span className="truncate">{opt.label}</span>
                            {opt.secondaryLabel && (
                              <span className="truncate text-xs font-normal text-ink-mute">
                                · {opt.secondaryLabel}
                              </span>
                            )}
                          </div>
                          {opt.badge && (
                            <span
                              className={cn(
                                'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase',
                                isSelected
                                  ? 'border-accent/25 bg-accent/15 text-accent'
                                  : 'border-hairline bg-paper text-ink-mute',
                              )}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                            <Check className="size-3" weight="bold" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                  {onAddNew && (
                    <div className="mt-1 border-t border-hairline/70 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          closeMenu()
                          onAddNew()
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                      >
                        <Plus className="size-3.5" />
                        <span>{addNewText || t('common.addNew', 'Add new option')}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {menuFooter && (
              <div className="shrink-0 border-t border-hairline/70 bg-paper/40 p-1.5">
                {typeof menuFooter === 'function'
                  ? menuFooter(closeMenu)
                  : menuFooter}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
