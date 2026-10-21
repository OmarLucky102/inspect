import { useState, useRef, useEffect, useMemo } from 'react'
import { CaretUpDown, Check, MagnifyingGlass, X } from '@phosphor-icons/react'

export interface SelectOption {
  value: string
  label: string
  secondaryLabel?: string
  badge?: string
  colorDot?: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  disabledMessage?: string
  required?: boolean
  className?: string
  emptyText?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  disabledMessage,
  required = false,
  className = '',
  emptyText = 'No options found',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  )

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options
    const query = searchTerm.toLowerCase().trim()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.secondaryLabel && opt.secondaryLabel.toLowerCase().includes(query)) ||
        (opt.badge && opt.badge.toLowerCase().includes(query))
    )
  }, [options, searchTerm])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus the search input when opened
      setTimeout(() => inputRef.current?.focus(), 50)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for HTML form validation */}
      <input
        tabIndex={-1}
        className="sr-only"
        required={required}
        value={value}
        onChange={() => {}}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev)
            setSearchTerm('')
          }
        }}
        className={`group flex w-full items-center justify-between rounded-xl border border-hairline bg-white px-3.5 py-2 text-left text-sm transition-colors outline-none focus:border-accent ${
          disabled
            ? 'cursor-not-allowed bg-paper/60 text-ink-mute'
            : 'cursor-pointer hover:border-ink-soft'
        } ${isOpen ? 'border-accent ring-1 ring-accent/30' : ''}`}
        title={disabled && disabledMessage ? disabledMessage : undefined}
      >
        <span className="truncate">
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.colorDot && (
                <span
                  className="size-3.5 shrink-0 rounded-full border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: selectedOption.colorDot }}
                />
              )}
              <span className="font-medium text-ink">{selectedOption.label}</span>
              {selectedOption.secondaryLabel && (
                <span className="font-sans text-xs text-ink-mute">
                  · {selectedOption.secondaryLabel}
                </span>
              )}
              {selectedOption.badge && (
                <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-mute">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-ink-mute">
              {disabled && disabledMessage ? disabledMessage : placeholder}
            </span>
          )}
        </span>

        <div className="flex shrink-0 items-center gap-1 pl-2 text-ink-mute group-hover:text-ink">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
              className="rounded p-0.5 hover:bg-paper hover:text-ink"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </span>
          )}
          <CaretUpDown className="size-4" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-xl border border-hairline bg-white shadow-xl animate-in fade-in-50 zoom-in-95">
          {/* Search Input Bar */}
          <div className="flex items-center gap-2 border-b border-hairline bg-paper/40 px-3 py-2">
            <MagnifyingGlass className="size-4 shrink-0 text-ink-mute" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="cursor-pointer text-ink-mute hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-ink-mute">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent/10 font-medium text-accent'
                        : 'text-ink hover:bg-paper'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.colorDot && (
                        <span
                          className="size-3.5 shrink-0 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: opt.colorDot }}
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.secondaryLabel && (
                        <span className="text-xs text-ink-mute">
                          · {opt.secondaryLabel}
                        </span>
                      )}
                      {opt.badge && (
                        <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-mute">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="size-4 shrink-0 text-accent" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
