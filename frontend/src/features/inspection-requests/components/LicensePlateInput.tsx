import React, { useState, useRef, useEffect } from 'react';
import { IdentificationCard, Hash, TextAa, X } from '@phosphor-icons/react';

export interface LicensePlateInputProps {
  digits: string;
  letters: string;
  onChange: (combined: string, digits: string, letters: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * Parses an existing plateNumber string (e.g. "1234 ABC" or "ABC 1234" or "١٢٣٤ أ ب ج" or "ابج 1234")
 * into separated digits (max 4) and letters (max 4 characters, cleanly auto-spaced).
 */
export function parseLicensePlate(rawPlate?: string | null): {
  digits: string;
  letters: string;
  digitSlots: [string, string, string, string];
  letterSlots: [string, string, string, string];
} {
  if (!rawPlate) {
    return {
      digits: '',
      letters: '',
      digitSlots: ['', '', '', ''],
      letterSlots: ['', '', '', ''],
    };
  }
  const trimmed = rawPlate.trim();

  // Match digits (Western 0-9 or Arabic-Indic ٠-٩)
  const digitsMatch = trimmed.match(/[\d٠-٩]+/g);
  const cleanDigits = digitsMatch ? digitsMatch.join('').slice(0, 4) : '';
  const dChars = cleanDigits.split('');
  const digitSlots: [string, string, string, string] = [
    dChars[0] || '',
    dChars[1] || '',
    dChars[2] || '',
    dChars[3] || '',
  ];

  // Extract non-digit characters (letters)
  const rawLetters = trimmed
    .replace(/[\d٠-٩]+/g, '')
    .replace(/[-_–—|/]/g, ' ')
    .trim();

  // Strip all whitespace to obtain distinct glyphs
  const chars = rawLetters.replace(/\s+/g, '').slice(0, 4).split('');
  const letterSlots: [string, string, string, string] = [
    chars[0] || '',
    chars[1] || '',
    chars[2] || '',
    chars[3] || '',
  ];

  // Auto-separated letters with space (e.g. "ا ب ج") so Arabic glyphs remain isolated
  const letters = chars.join(' ');

  return { digits: cleanDigits, letters, digitSlots, letterSlots };
}

/**
 * Visual Egyptian Vehicle License Plate Badge
 * Matches authentic Egyptian traffic plates (Right-to-Left):
 * - Right Side (under مصر): Arabic Letters (حروف اللوحة)
 * - Left Side (under EGYPT): Numbers (أرقام اللوحة)
 * Enforces whitespace-nowrap and isolated letter spans so Arabic characters never link or wrap down.
 */
export function LicensePlateBadge({
  plateNumber,
  digits: propDigits,
  letters: propLetters,
  className = '',
}: {
  plateNumber?: string | null;
  digits?: string;
  letters?: string;
  className?: string;
}) {
  let d = propDigits ?? '';
  let l = propLetters ?? '';

  if (!d && !l && plateNumber) {
    const parsed = parseLicensePlate(plateNumber);
    d = parsed.digits;
    l = parsed.letters;
  }

  // Extract up to 4 clean characters (ignoring spaces)
  const lettersArray = l.replace(/\s+/g, '').slice(0, 4).split('');
  const hasContent = Boolean(d || lettersArray.length > 0);

  return (
    <div
      className={`inline-flex flex-col overflow-hidden rounded-lg border-2 border-slate-800 bg-white shadow-2xs select-none shrink-0 whitespace-nowrap ${className}`}
      dir="ltr"
      title={
        hasContent
          ? `Plate: ${d} ${lettersArray.join(' ')}`
          : 'No plate entered'
      }
    >
      {/* Official Egyptian Traffic Header: EGYPT on Left, مصر on Right */}
      <div className="flex items-center justify-between gap-6 bg-sky-600 px-3 py-0.5 text-[9px] font-bold tracking-widest text-white uppercase whitespace-nowrap">
        <span>EGYPT</span>
        <span className="text-[10px] leading-none font-semibold">مصر</span>
      </div>

      {/* Plate Body: Digits on Left (under EGYPT), Characters on Right (under مصر) */}
      <div className="flex items-center justify-center divide-x divide-slate-300 px-2 py-1 text-center font-mono font-black text-slate-900 whitespace-nowrap">
        {/* Left: Digits Section (under EGYPT) */}
        <div className="flex items-center justify-center px-2.5 text-xs font-mono font-bold tracking-widest text-slate-900 whitespace-nowrap min-w-[50px]">
          {d || (
            <span className="text-[11px] font-normal text-slate-300">
              أرقام
            </span>
          )}
        </div>

        {/* Right: Isolated Characters Section (under مصر) */}
        <div
          dir="rtl"
          className="flex items-center justify-center gap-1 px-2 text-xs font-bold whitespace-nowrap min-w-[56px]"
        >
          {lettersArray.length > 0 ? (
            lettersArray.map((ch, idx) => (
              <span
                key={idx}
                className="inline-flex size-5 items-center justify-center rounded bg-slate-100 font-mono text-xs font-bold text-slate-900 shadow-2xs shrink-0"
              >
                {ch.toUpperCase()}
              </span>
            ))
          ) : (
            <span className="text-[11px] font-normal text-slate-300">حروف</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Egyptian Right-to-Left (RTL) OTP-Style License Plate Input:
 * - RTL order: Characters on the Right, Numbers on the Left.
 * - 4 OTP boxes for Characters [1][2][3][4] (isolated Arabic letter glyphs).
 * - 4 OTP boxes for Numbers [1][2][3][4].
 * - Auto-advances across boxes.
 * - Centered Egyptian plate badge preview with no text next to it.
 */
export function LicensePlateInput({
  digits = '',
  letters = '',
  onChange,
  disabled = false,
  className = '',
  label = 'بيانات اللوحة (حروف وأرقام)',
}: LicensePlateInputProps) {
  // Parse digits into 4 slots
  const dChars = digits.replace(/[^\d٠-٩]/g, '').slice(0, 4).split('');
  const [digitSlots, setDigitSlots] = useState<[string, string, string, string]>([
    dChars[0] || '',
    dChars[1] || '',
    dChars[2] || '',
    dChars[3] || '',
  ]);

  // Parse letters into 4 slots
  const lChars = letters.replace(/\s+/g, '').slice(0, 4).split('');
  const [letterSlots, setLetterSlots] = useState<[string, string, string, string]>([
    lChars[0] || '',
    lChars[1] || '',
    lChars[2] || '',
    lChars[3] || '',
  ]);

  // Keep slots in sync if props change externally
  useEffect(() => {
    const freshD = digits.replace(/[^\d٠-٩]/g, '').slice(0, 4).split('');
    setDigitSlots([
      freshD[0] || '',
      freshD[1] || '',
      freshD[2] || '',
      freshD[3] || '',
    ]);
  }, [digits]);

  useEffect(() => {
    const freshL = letters.replace(/\s+/g, '').slice(0, 4).split('');
    setLetterSlots([
      freshL[0] || '',
      freshL[1] || '',
      freshL[2] || '',
      freshL[3] || '',
    ]);
  }, [letters]);

  // Input refs for OTP navigation
  const letterRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Helper to trigger parent onChange
  const triggerChange = (
    newDigits: [string, string, string, string],
    newLetters: [string, string, string, string],
  ) => {
    const cleanD = newDigits.join('');
    const activeL = newLetters.filter(Boolean).join(' ');
    const combined = [cleanD, activeL].filter(Boolean).join(' ');
    onChange(combined, cleanD, activeL);
  };

  // ------------------------------------
  // LETTERS OTP HANDLERS (RTL Flow)
  // ------------------------------------
  const handleLetterChange = (index: number, val: string) => {
    const clean = val.replace(/[\d٠-٩\s]/g, '').slice(-1);
    const newLetters = [...letterSlots] as [string, string, string, string];
    newLetters[index] = clean;
    setLetterSlots(newLetters);
    triggerChange(digitSlots, newLetters);

    // Auto-advance
    if (clean) {
      if (index < 3 && letterRefs[index + 1].current) {
        letterRefs[index + 1].current?.focus();
      } else if (index === 3 && digitRefs[0].current) {
        digitRefs[0].current?.focus();
      }
    }
  };

  const handleLetterKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !letterSlots[index] && index > 0) {
      letterRefs[index - 1].current?.focus();
    }
  };

  const handleLetterPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const chars = pasted.replace(/[\d٠-٩\s]/g, '').slice(0, 4).split('');
    const newLetters: [string, string, string, string] = [
      chars[0] || '',
      chars[1] || '',
      chars[2] || '',
      chars[3] || '',
    ];
    setLetterSlots(newLetters);
    triggerChange(digitSlots, newLetters);

    if (chars.length >= 4 && digitRefs[0].current) {
      digitRefs[0].current?.focus();
    } else {
      const targetIdx = Math.min(chars.length, 3);
      letterRefs[targetIdx].current?.focus();
    }
  };

  // ------------------------------------
  // DIGITS OTP HANDLERS (RTL Flow)
  // ------------------------------------
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^\d٠-٩]/g, '').slice(-1);
    const newDigits = [...digitSlots] as [string, string, string, string];
    newDigits[index] = clean;
    setDigitSlots(newDigits);
    triggerChange(newDigits, letterSlots);

    // Auto-advance
    if (clean && index < 3 && digitRefs[index + 1].current) {
      digitRefs[index + 1].current?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !digitSlots[index]) {
      if (index > 0) {
        digitRefs[index - 1].current?.focus();
      } else if (index === 0 && letterRefs[3].current) {
        letterRefs[3].current?.focus();
      }
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const chars = pasted.replace(/[^\d٠-٩]/g, '').slice(0, 4).split('');
    const newDigits: [string, string, string, string] = [
      chars[0] || '',
      chars[1] || '',
      chars[2] || '',
      chars[3] || '',
    ];
    setDigitSlots(newDigits);
    triggerChange(newDigits, letterSlots);

    const targetIdx = Math.min(chars.length, 3);
    digitRefs[targetIdx].current?.focus();
  };

  const handleClear = () => {
    const emptyD: [string, string, string, string] = ['', '', '', ''];
    const emptyL: [string, string, string, string] = ['', '', '', ''];
    setDigitSlots(emptyD);
    setLetterSlots(emptyL);
    onChange('', '', '');
    letterRefs[0].current?.focus();
  };

  const activeDigits = digitSlots.join('');
  const activeLettersFormatted = letterSlots.filter(Boolean).join(' ');
  const hasValue = Boolean(activeDigits || activeLettersFormatted);

  return (
    <div className={`space-y-2.5 ${className}`} dir="rtl">
      {/* Header (RTL) */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <IdentificationCard className="size-3.5 text-ink-mute" />
          <span>{label}</span>
        </label>
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] font-medium text-ink-mute hover:text-rose-600 transition-colors cursor-pointer"
            title="مسح البيانات"
          >
            <X className="size-3" />
            <span>مسح</span>
          </button>
        )}
      </div>

      {/* Main OTP Input Container (RTL: Characters on Right, Numbers on Left) */}
      <div className="rounded-xl border border-hairline bg-paper/40 p-3 transition-all focus-within:border-accent/40 focus-within:bg-white focus-within:shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 1. Characters (Right Column in RTL: حروف اللوحة) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-medium text-ink-mute">
                <TextAa className="size-3" />
                <span>حروف اللوحة (Letters)</span>
              </span>
              <span
                className={`font-mono text-[10px] ${
                  letterSlots.filter(Boolean).length >= 2
                    ? 'font-bold text-emerald-600'
                    : 'text-ink-mute'
                }`}
              >
                {letterSlots.filter(Boolean).length}/4
              </span>
            </div>
            <div
              className="grid grid-cols-4 gap-1.5"
              dir="rtl"
              onPaste={handleLetterPaste}
            >
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  ref={letterRefs[idx]}
                  type="text"
                  maxLength={1}
                  disabled={disabled}
                  value={letterSlots[idx]}
                  onChange={(e) => handleLetterChange(idx, e.target.value)}
                  onKeyDown={(e) => handleLetterKeyDown(idx, e)}
                  placeholder={idx === 3 ? 'اختياري' : `${idx + 1}`}
                  className="h-10 w-full rounded-lg border border-hairline bg-white text-center font-mono text-sm font-bold uppercase text-ink shadow-2xs outline-none transition-colors placeholder:text-ink-mute/30 hover:border-ink/20 focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
              ))}
            </div>
            <p className="mt-1 text-center font-mono text-[10px] text-ink-mute">
              حروف منفصلة (من اليمين لليسار)
            </p>
          </div>

          {/* 2. Numbers (Left Column in RTL: أرقام اللوحة) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-medium text-ink-mute">
                <Hash className="size-3" />
                <span>أرقام اللوحة (Numbers)</span>
              </span>
              <span
                className={`font-mono text-[10px] ${
                  digitSlots.filter(Boolean).length === 4
                    ? 'font-bold text-emerald-600'
                    : 'text-ink-mute'
                }`}
              >
                {digitSlots.filter(Boolean).length}/4
              </span>
            </div>
            <div
              className="grid grid-cols-4 gap-1.5"
              dir="rtl"
              onPaste={handleDigitPaste}
            >
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  ref={digitRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9٠-٩]*"
                  maxLength={1}
                  disabled={disabled}
                  value={digitSlots[idx]}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  placeholder={`${idx + 1}`}
                  className="h-10 w-full rounded-lg border border-hairline bg-white text-center font-mono text-sm font-bold text-ink shadow-2xs outline-none transition-colors placeholder:text-ink-mute/30 hover:border-ink/20 focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
              ))}
            </div>
            <p className="mt-1 text-center font-mono text-[10px] text-ink-mute">
              أرقام اللوحة (حد أقصى ٤)
            </p>
          </div>
        </div>

        {/* Live Official Egyptian Plate Mockup Badge (Cleanly Centered, No text next to it) */}
        <div className="mt-3 flex items-center justify-center border-t border-hairline/80 pt-2.5">
          <LicensePlateBadge
            digits={activeDigits}
            letters={activeLettersFormatted}
          />
        </div>
      </div>
    </div>
  );
}
