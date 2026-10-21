import { useState, useRef, useEffect, useMemo } from 'react';
import {
  CaretUpDown,
  Check,
  MagnifyingGlass,
  X,
  User,
  MapPin,
  Phone,
  EnvelopeSimple,
  CircleNotch,
} from '@phosphor-icons/react';

export interface RepresentativeOption {
  id: string;
  name: string;
  code: string;
  location?: string;
  phone?: string;
  email?: string;
  source?: 'REGISTERED' | 'USER';
}

interface RepresentativeSelectProps {
  options: RepresentativeOption[];
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'RP').toUpperCase();
}

export function RepresentativeSelect({
  options,
  value,
  onChange,
  isLoading = false,
  required = false,
  disabled = false,
  placeholder = 'Select an eligible representative...',
  className = '',
}: RepresentativeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      const matchName = opt.name.toLowerCase().includes(q);
      const matchCode = opt.code.toLowerCase().includes(q);
      const matchLoc = opt.location?.toLowerCase().includes(q) ?? false;
      const matchPhone = opt.phone?.toLowerCase().includes(q) ?? false;
      const matchEmail = opt.email?.toLowerCase().includes(q) ?? false;
      return matchName || matchCode || matchLoc || matchPhone || matchEmail;
    });
  }, [options, searchTerm]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input after popover renders
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // ESC key listener
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for HTML5 form validation */}
      <input
        type="text"
        tabIndex={-1}
        className="sr-only"
        required={required}
        value={value}
        onChange={() => {}}
      />

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => {
          if (!disabled && !isLoading) {
            setIsOpen((prev) => !prev);
            setSearchTerm('');
          }
        }}
        className={`group flex w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-left transition-all outline-none focus:border-accent ${
          disabled || isLoading
            ? 'cursor-not-allowed bg-paper/60 text-ink-mute border-hairline'
            : 'cursor-pointer hover:border-accent/40 border-hairline'
        } ${isOpen ? 'border-accent ring-2 ring-accent/15 shadow-sm' : 'shadow-2xs'}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-ink-mute">
              <CircleNotch className="size-4 animate-spin text-accent" />
              <span>Loading registered representatives…</span>
            </div>
          ) : selectedOption ? (
            <>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs font-bold text-accent">
                {getInitials(selectedOption.name)}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-ink">
                    {selectedOption.name}
                  </span>
                  <span className="rounded bg-paper px-1.5 py-0.2 font-mono text-[10px] font-semibold text-ink-soft border border-hairline shrink-0">
                    {selectedOption.code}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-ink-mute truncate">
                  {selectedOption.location && (
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="size-3 shrink-0" />
                      {selectedOption.location}
                    </span>
                  )}
                  {selectedOption.phone && (
                    <span className="flex items-center gap-0.5 font-mono shrink-0">
                      <Phone className="size-3 shrink-0" />
                      {selectedOption.phone}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 text-ink-mute">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-paper text-ink-mute">
                <User className="size-4" />
              </span>
              <span className="text-xs text-ink-mute font-normal">
                {placeholder}
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pl-2 text-ink-mute group-hover:text-ink">
          {value && !disabled && !isLoading && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
              className="rounded-md p-1 hover:bg-paper hover:text-ink transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </span>
          )}
          <CaretUpDown className="size-4" />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-70 mt-1.5 max-h-80 overflow-hidden rounded-xl border border-hairline bg-white shadow-xl animate-in fade-in-50 zoom-in-95">
          {/* Search Box */}
          <div className="flex items-center gap-2 border-b border-hairline bg-paper/50 px-3.5 py-2.5">
            <MagnifyingGlass className="size-4 shrink-0 text-ink-mute" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID code, city, phone..."
              className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink-mute"
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

          {/* Header count info */}
          <div className="flex items-center justify-between border-b border-hairline/60 bg-paper/20 px-3.5 py-1.5 text-[10px] font-mono tracking-wider text-ink-mute uppercase">
            <span>Active Field Representatives</span>
            <span>
              {filteredOptions.length} of {options.length}
            </span>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-hairline/40 p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center">
                <User className="mx-auto size-7 text-ink-mute/60" />
                <p className="mt-2 text-xs font-medium text-ink">
                  {options.length === 0
                    ? 'No active representatives found'
                    : 'No matching representatives'}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-mute max-w-xs mx-auto">
                  {options.length === 0
                    ? 'Please register active field representatives in the Representatives module first.'
                    : `No representatives match "${searchTerm}". Try a different name, ID, or location.`}
                </p>
              </div>
            ) : (
              filteredOptions.map((rep) => {
                const isSelected = rep.id === value;
                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => handleSelect(rep.id)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-accent/10 border border-accent/20'
                        : 'hover:bg-paper/70'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                          isSelected
                            ? 'bg-accent text-white'
                            : 'bg-paper text-accent border border-hairline'
                        }`}
                      >
                        {getInitials(rep.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-ink">
                            {rep.name}
                          </span>
                          <span className="rounded bg-paper px-1.5 py-0.2 font-mono text-[10px] font-semibold text-ink-soft border border-hairline shrink-0">
                            {rep.code}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-ink-mute mt-0.5">
                          {rep.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 text-ink-mute shrink-0" />
                              <span className="truncate">{rep.location}</span>
                            </span>
                          )}
                          {rep.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="size-3 text-ink-mute shrink-0" />
                              <span>{rep.phone}</span>
                            </span>
                          )}
                          {!rep.location && !rep.phone && rep.email && (
                            <span className="flex items-center gap-1">
                              <EnvelopeSimple className="size-3 text-ink-mute shrink-0" />
                              <span className="truncate">{rep.email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 pl-2">
                      {isSelected && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-accent text-white">
                          <Check className="size-3 font-bold" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
