import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car,
  Gauge,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  FileCheck2,
  ZoomIn,
  Banknote,
  FileText,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Info,
  ClipboardCheck,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { Select, type SelectOption } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import {
  fetchVehicleLookups,
  submitMediaReview,
  type InspectionRequestDetail,
  type MediaReviewPayload,
} from '../api';
import { fetchInspectionMedia, getMediaFileUrl } from '@/features/media/api';

// Fallback lookup options matching backend DTO definitions
const DEFAULT_TRANSMISSION_OPTIONS: SelectOption[] = [
  { value: 'Automatic', label: 'أوتوماتيك', secondaryLabel: 'Automatic' },
  { value: 'Manual', label: 'عادي / مانيوال', secondaryLabel: 'Manual' },
];

const DEFAULT_SUNROOF_OPTIONS: SelectOption[] = [
  { value: 'NO_SUNROOF', label: 'بدون فتحة سقف', secondaryLabel: 'No Sunroof' },
  { value: 'ELECTRIC', label: 'فتحة سقف كهربائية', secondaryLabel: 'Electric Sunroof' },
  { value: 'PANORAMIC', label: 'فتحة سقف بانورامية', secondaryLabel: 'Panoramic Sunroof' },
  { value: 'PANORAMIC_MOONROOF', label: 'فتحة سقف بانورامية زجاجية', secondaryLabel: 'Panoramic Moonroof' },
  { value: 'MANUAL', label: 'فتحة سقف يدوية', secondaryLabel: 'Manual Sunroof' },
  { value: 'SLIDING', label: 'فتحة سقف منزلقة', secondaryLabel: 'Sliding Sunroof' },
  { value: 'TILT_AND_SLIDE', label: 'فتحة سقف قابلة للإمالة والانزلاق', secondaryLabel: 'Tilt-and-Slide Sunroof' },
  { value: 'POP_UP', label: 'فتحة سقف قابلة للرفع', secondaryLabel: 'Pop-up Sunroof' },
];

const DEFAULT_SIDE_MIRROR_OPTIONS: SelectOption[] = [
  { value: 'ELECTRIC', label: 'كهرباء / طي كهربائي', secondaryLabel: 'Electric' },
  { value: 'MANUAL', label: 'يدوي', secondaryLabel: 'Manual' },
];

const DEFAULT_CAR_INTERIOR_OPTIONS: SelectOption[] = [
  { value: 'FACTORY_PAINT', label: 'فابريكا بالكامل (حالة المصنع)', secondaryLabel: 'Factory Paint' },
  { value: 'PARTIAL_REPAINT', label: 'رش أجزاء خارجية فقط (دواخل فابريكا)', secondaryLabel: 'Partial Repaint' },
  { value: 'INTERNAL_REPAINT', label: 'رش داخلي أو تغيير أجزاء', secondaryLabel: 'Internal Repaint' },
];

interface CarDetailsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  requestId: string;
  details: InspectionRequestDetail;
  onSuccess?: () => void;
}

export const CarDetailsReviewModal: React.FC<CarDetailsReviewModalProps> = ({
  isOpen,
  onClose,
  bankId,
  requestId,
  details,
  onSuccess,
}) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const queryClient = useQueryClient();

  // Wizard active step:
  // 1 = Specifications (Transmission, Mirrors, Interior)
  // 2 = Evidence & Verification (Odometer -> Mileage, Roof -> Sunroof Spec)
  // 3 = Valuation & Decision (Market Value, Notes, Summary)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  // Note: Proposed Value & Verified Mileage remain completely empty ('') by default
  // until reviewer inputs them (ignoring any legacy dummy '1' values).
  const [proposedValue, setProposedValue] = useState<string>(
    details.latestMarketingDecision?.estimatedValue &&
      details.latestMarketingDecision.estimatedValue > 1
      ? String(details.latestMarketingDecision.estimatedValue)
      : '',
  );
  const [verifiedMileage, setVerifiedMileage] = useState<string>(
    details.vehicle?.mileage && details.vehicle.mileage > 1
      ? String(details.vehicle.mileage)
      : '',
  );
  const [transmissionTypeId, setTransmissionTypeId] = useState<string>(
    details.vehicle?.transmissionType?.id || '',
  );
  const [sunroofSpecification, setSunroofSpecification] = useState<string>(
    details.vehicle?.sunroofSpecification || '',
  );
  const [sideMirrors, setSideMirrors] = useState<string>(
    details.vehicle?.sideMirrors || '',
  );
  const [carInterior, setCarInterior] = useState<string>(
    details.vehicle?.carInterior || '',
  );
  const trimId = details.vehicle?.trim?.id || undefined;
  const [notes, setNotes] = useState<string>('');

  // Lightbox State
  const [activeLightboxImage, setActiveLightboxImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Close Lightbox on Escape without closing the underlying sheet
  React.useEffect(() => {
    if (!activeLightboxImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        setActiveLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeLightboxImage]);

  // 1. Fetch Lookups for Dropdowns
  const { data: lookups, isLoading: isLoadingLookups } = useQuery({
    queryKey: ['vehicle-lookups'],
    queryFn: fetchVehicleLookups,
    staleTime: 5 * 60 * 1000,
  });

  // Unified Dropdown Options with robust fallback
  const transmissionOptions = useMemo<SelectOption[]>(() => {
    if (lookups?.transmissionTypes && lookups.transmissionTypes.length > 0) {
      return lookups.transmissionTypes.map((trans) => ({
        value: trans.id,
        label: isArabic && trans.nameAr ? trans.nameAr : trans.name,
        secondaryLabel: isArabic && trans.nameAr ? trans.name : undefined,
      }));
    }
    return DEFAULT_TRANSMISSION_OPTIONS.map((opt) => ({
      value: opt.value,
      label: isArabic ? opt.label : (opt.secondaryLabel || opt.label),
      secondaryLabel: isArabic ? opt.secondaryLabel : opt.label,
    }));
  }, [lookups?.transmissionTypes, isArabic]);

  const sunroofOptions = useMemo<SelectOption[]>(() => {
    if (lookups?.sunroofTypes && lookups.sunroofTypes.length > 0) {
      return lookups.sunroofTypes.map((sunroof) => {
        const code = sunroof.code || sunroof.name;
        return {
          value: code,
          label: isArabic && sunroof.nameAr ? sunroof.nameAr : sunroof.name,
          secondaryLabel: isArabic && sunroof.nameAr ? sunroof.name : undefined,
        };
      });
    }
    return DEFAULT_SUNROOF_OPTIONS.map((opt) => ({
      value: opt.value,
      label: isArabic ? opt.label : (opt.secondaryLabel || opt.label),
      secondaryLabel: isArabic ? opt.secondaryLabel : opt.label,
    }));
  }, [lookups?.sunroofTypes, isArabic]);

  const sideMirrorOptions = useMemo<SelectOption[]>(() => {
    if (lookups?.sideMirrorTypes && lookups.sideMirrorTypes.length > 0) {
      return lookups.sideMirrorTypes.map((mirror) => {
        const code = mirror.code || mirror.name;
        return {
          value: code,
          label: isArabic && mirror.nameAr ? mirror.nameAr : mirror.name,
          secondaryLabel: isArabic && mirror.nameAr ? mirror.name : undefined,
        };
      });
    }
    return DEFAULT_SIDE_MIRROR_OPTIONS.map((opt) => ({
      value: opt.value,
      label: isArabic ? opt.label : (opt.secondaryLabel || opt.label),
      secondaryLabel: isArabic ? opt.secondaryLabel : opt.label,
    }));
  }, [lookups?.sideMirrorTypes, isArabic]);

  const carInteriorOptions = useMemo<SelectOption[]>(() => {
    if (lookups?.carInteriorTypes && lookups.carInteriorTypes.length > 0) {
      return lookups.carInteriorTypes.map((cond) => {
        const code = cond.code || cond.id;
        return {
          value: code,
          label: isArabic && cond.nameAr ? cond.nameAr : cond.name,
          secondaryLabel: isArabic && cond.nameAr ? cond.name : undefined,
        };
      });
    }
    return DEFAULT_CAR_INTERIOR_OPTIONS.map((opt) => ({
      value: opt.value,
      label: isArabic ? opt.label : (opt.secondaryLabel || opt.label),
      secondaryLabel: isArabic ? opt.secondaryLabel : opt.label,
    }));
  }, [lookups?.carInteriorTypes, isArabic]);

  // 2. Fetch Side Evidence Media (Odometer & Sunroof photos)
  const { data: evidenceMedia = [], isLoading: isLoadingMedia } = useQuery({
    queryKey: ['inspection-evidence-media', requestId],
    queryFn: () =>
      fetchInspectionMedia(requestId, {
        checklistItemCodes: ['odometer_cluster', 'panoramic_roof'],
      }),
    enabled: isOpen,
    staleTime: 30 * 1000,
  });

  const odometerPhoto = useMemo(
    () => evidenceMedia.find((m) => m.checklistItemCode === 'odometer_cluster'),
    [evidenceMedia],
  );

  const roofPhoto = useMemo(
    () => evidenceMedia.find((m) => m.checklistItemCode === 'panoramic_roof'),
    [evidenceMedia],
  );

  // 3. Validation Logic
  const numericMileage = useMemo(() => {
    const cleaned = verifiedMileage.replace(/,/g, '').trim();
    return cleaned === '' ? NaN : Number(cleaned);
  }, [verifiedMileage]);

  const isStep2Complete = !isNaN(numericMileage) && numericMileage >= 0;

  const numericProposedValue = useMemo(() => {
    const cleaned = proposedValue.replace(/,/g, '').trim();
    return cleaned === '' ? NaN : Number(cleaned);
  }, [proposedValue]);

  const isStep3Complete = !isNaN(numericProposedValue) && numericProposedValue > 0;

  // Selected label helpers for summary card
  const selectedTransmissionLabel = useMemo(() => {
    return transmissionOptions.find((o) => o.value === transmissionTypeId)?.label || '—';
  }, [transmissionOptions, transmissionTypeId]);

  const selectedSunroofLabel = useMemo(() => {
    return sunroofOptions.find((o) => o.value === sunroofSpecification)?.label || '—';
  }, [sunroofOptions, sunroofSpecification]);

  const selectedSideMirrorsLabel = useMemo(() => {
    return sideMirrorOptions.find((o) => o.value === sideMirrors)?.label || '—';
  }, [sideMirrorOptions, sideMirrors]);

  const selectedInteriorLabel = useMemo(() => {
    return carInteriorOptions.find((o) => o.value === carInterior)?.label || '—';
  }, [carInteriorOptions, carInterior]);

  // 4. Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (payload: MediaReviewPayload) =>
      submitMediaReview(bankId, requestId, payload),
    onSuccess: () => {
      toast.success(
        isArabic
          ? 'تم اعتماد مواصفات السيارة والتقييم بنجاح'
          : 'Vehicle details & valuation submitted successfully',
      );
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', bankId, requestId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', requestId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-status-history', requestId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', bankId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests'],
      });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(
        getApiErrorMessage(
          err,
          isArabic
            ? 'فشل في حفظ مواصفات السيارة والتقييم'
            : 'Failed to submit car details & valuation',
        ),
      );
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!isStep2Complete) {
        toast.error(
          isArabic
            ? 'يرجى إدخال قراءة العداد بشكل صحيح أولاً'
            : 'Please enter a valid verified mileage first',
        );
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (Math.max(1, prev - 1) as 1 | 2 | 3));
  };

  const handleSubmit = () => {
    if (!isStep3Complete) {
      toast.error(
        isArabic
          ? 'يرجى إدخال القيمة السوقية المقترحة بشكل صحيح'
          : 'Please enter a valid proposed market value',
      );
      return;
    }

    if (!isStep2Complete) {
      toast.error(
        isArabic
          ? 'يرجى التأكد من قراءة العداد في الخطوة السابقة'
          : 'Please ensure verified mileage is set correctly',
      );
      setCurrentStep(2);
      return;
    }

    const payload: MediaReviewPayload = {
      proposedMarketingValue: numericProposedValue,
      verifiedMileage: numericMileage,
      transmissionTypeId: transmissionTypeId || undefined,
      sunroofSpecification: sunroofSpecification || undefined,
      sideMirrors: sideMirrors || undefined,
      carInterior: carInterior || undefined,
      trimId: trimId || undefined,
      notes: notes.trim() || undefined,
    };

    submitMutation.mutate(payload);
  };

  const vehicleName = details.vehicle
    ? `${details.vehicle.manufactureYear} ${details.vehicle.brand?.name || ''} ${details.vehicle.model?.name || ''}`
    : details.requestNumber;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest?.('[role="listbox"]') || target?.closest?.('.select-portal-menu')) {
              e.preventDefault();
            }
          }}
          className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col h-full bg-white dark:bg-[#0c1017] text-neutral-900 dark:text-neutral-100 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {/* Top Header */}
          <SheetHeader className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 backdrop-blur-md shrink-0">
            <div className="flex flex-col gap-1 text-start">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FileCheck2 className="size-3.5" />
                  {isArabic ? 'معالج مراجعة المواصفات والتقييم' : 'Vehicle Valuation Wizard'}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {details.requestNumber}
                </span>
              </div>
              <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {isArabic
                  ? 'مواصفات المركبة والتقييم السوقي'
                  : 'Vehicle Specifications & Market Valuation'}
              </SheetTitle>
              <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                {vehicleName} •{' '}
                {isArabic
                  ? 'مراجعة وتوثيق مواصفات السيارة والعداد والسقف واعتماد السعر السوقي المقترح'
                  : 'Review vehicle specifications, verify odometer reading and roof, and establish proposed valuation.'}
              </SheetDescription>
            </div>

            {/* Stepper Progress Bar */}
            <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
                {/* Step 1 Pill */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl p-2 sm:p-2.5 text-left rtl:text-right transition-all duration-200 cursor-pointer border',
                    currentStep === 1
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'bg-neutral-100/70 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all',
                      currentStep === 1
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                    )}
                  >
                    <SlidersHorizontal className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 hidden sm:block">
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                      {isArabic ? 'الخطوة 1' : 'Step 1'}
                    </p>
                    <p className="truncate text-xs font-bold">
                      {isArabic ? 'المواصفات العامة' : 'General Specs'}
                    </p>
                  </div>
                </button>

                {/* Step 2 Pill */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl p-2 sm:p-2.5 text-left rtl:text-right transition-all duration-200 cursor-pointer border',
                    currentStep === 2
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : isStep2Complete
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15'
                        : 'bg-neutral-100/70 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all',
                      currentStep === 2
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                        : isStep2Complete
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                    )}
                  >
                    {isStep2Complete ? (
                      <Check className="size-4 stroke-[2.5]" />
                    ) : (
                      <Gauge className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 hidden sm:block">
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                      {isArabic ? 'الخطوة 2' : 'Step 2'}
                    </p>
                    <p className="truncate text-xs font-bold">
                      {isArabic ? 'العداد والسقف' : 'Mileage & Sunroof'}
                    </p>
                  </div>
                </button>

                {/* Step 3 Pill */}
                <button
                  type="button"
                  onClick={() => {
                    if (isStep2Complete) setCurrentStep(3);
                    else {
                      toast.error(
                        isArabic
                          ? 'يرجى إكمال قراءة العداد في الخطوة 2 أولاً'
                          : 'Please complete verified mileage in Step 2 first',
                      );
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl p-2 sm:p-2.5 text-left rtl:text-right transition-all duration-200 border',
                    !isStep2Complete
                      ? 'opacity-60 cursor-not-allowed bg-neutral-100/40 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800 text-neutral-400'
                      : currentStep === 3
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs cursor-pointer'
                        : isStep3Complete
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 cursor-pointer'
                          : 'bg-neutral-100/70 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 cursor-pointer',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all',
                      currentStep === 3
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                        : isStep3Complete
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400',
                    )}
                  >
                    {isStep3Complete ? (
                      <Check className="size-4 stroke-[2.5]" />
                    ) : (
                      <Banknote className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 hidden sm:block">
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                      {isArabic ? 'الخطوة 3' : 'Step 3'}
                    </p>
                    <p className="truncate text-xs font-bold">
                      {isArabic ? 'التقييم والاعتماد' : 'Valuation & Decision'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* Step Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* STEP 1: VEHICLE SPECIFICATIONS (Transmission, Mirrors, Interior) */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <SlidersHorizontal className="size-5 text-emerald-600 dark:text-emerald-400" />
                      {isArabic ? 'مواصفات وتجهيزات المركبة' : 'Vehicle Specifications & Trim Details'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {isArabic
                        ? 'حدد مواصفات السيارة الميكانيكية والجمالية باستخدام القوائم الموحدة المعتمدة'
                        : 'Select mechanical and aesthetic vehicle features using standardized system dropdowns.'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {isArabic ? '3 مواصفات عامة' : '3 Standard Specs'}
                  </span>
                </div>

                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Transmission Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Car className="size-3.5 text-neutral-500" />
                        {isArabic ? 'ناقل الحركة' : 'Transmission'}
                      </label>
                      <Select
                        portal={false}
                        size="md"
                        searchable="auto"
                        clearable
                        value={transmissionTypeId}
                        onChange={(val) => setTransmissionTypeId(val)}
                        disabled={isLoadingLookups}
                        placeholder={
                          isArabic
                            ? '— اختر نوع ناقل الحركة —'
                            : '— Select Transmission —'
                        }
                        options={transmissionOptions}
                      />
                    </div>

                    {/* Side Mirrors */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <SlidersHorizontal className="size-3.5 text-neutral-500" />
                        {isArabic ? 'المرايات الجانبية' : 'Side Mirrors'}
                      </label>
                      <Select
                        portal={false}
                        size="md"
                        searchable="auto"
                        clearable
                        value={sideMirrors}
                        onChange={(val) => setSideMirrors(val)}
                        disabled={isLoadingLookups}
                        placeholder={
                          isArabic
                            ? '— اختر مواصفة المرايات —'
                            : '— Select Side Mirrors —'
                        }
                        options={sideMirrorOptions}
                      />
                    </div>

                    {/* Car Interior / Paint Condition */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-neutral-500" />
                        {isArabic
                          ? 'حالة الدواخل والدهان'
                          : 'Interior / Paint Condition'}
                      </label>
                      <Select
                        portal={false}
                        size="md"
                        searchable="auto"
                        clearable
                        value={carInterior}
                        onChange={(val) => setCarInterior(val)}
                        disabled={isLoadingLookups}
                        placeholder={
                          isArabic
                            ? '— اختر حالة الدواخل —'
                            : '— Select Paint Condition —'
                        }
                        options={carInteriorOptions}
                      />
                    </div>
                  </div>
                </div>

                {/* Informational Hint */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  <Info className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {isArabic
                      ? 'ملاحظة: سيتم مطابقة وتحديد مواصفة فتحة السقف في الخطوة التالية مباشرةً أمام صورة سقف السيارة المرفوعة.'
                      : 'Note: Sunroof specification will be inspected and confirmed in Step 2 directly against its uploaded photo.'}
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: EVIDENCE & MILEAGE (Odometer -> Mileage, Roof -> Sunroof Spec) */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Gauge className="size-5 text-emerald-600 dark:text-emerald-400" />
                      {isArabic ? 'مطابقة صور الإثبات وتوثيق العداد والسقف' : 'Evidence Verification & Specifications'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {isArabic
                        ? 'عاين صور العداد والسقف لمطابقة قراءة الكيلومترات وتحديد نوع فتحة السقف مباشرةً أسفل كل صورة'
                        : 'Inspect odometer and roof photos to verify mileage and select sunroof specification directly below each photo.'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                    {evidenceMedia.length} {isArabic ? 'صور مرفوعة' : 'photos'}
                  </span>
                </div>

                {/* 2-Column Evidence & Verification Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* CARD 1: ODOMETER EVIDENCE & VERIFIED MILEAGE */}
                  <div className="rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                          <Gauge className="size-4" />
                          {isArabic ? 'صورة عداد الكيلومترات' : 'Odometer Cluster Photo'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          odometer_cluster
                        </span>
                      </div>

                      {isLoadingMedia ? (
                        <div className="aspect-video w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                          <Loader2 className="size-5 animate-spin" />
                        </div>
                      ) : odometerPhoto ? (
                        <div
                          className="group relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 cursor-pointer shadow-xs"
                          onClick={() =>
                            setActiveLightboxImage({
                              url: getMediaFileUrl(odometerPhoto.id),
                              title: isArabic ? 'صورة العداد' : 'Odometer Cluster',
                            })
                          }
                        >
                          <img
                            src={getMediaFileUrl(odometerPhoto.id)}
                            alt="Odometer Cluster"
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                            <ZoomIn className="size-4" />
                            <span>{isArabic ? 'معاينة وتكبير' : 'Click to inspect'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-400 text-xs p-4 text-center">
                          <AlertCircle className="size-6 text-amber-500 mb-1.5" />
                          <span>
                            {isArabic
                              ? 'لم يتم رفع صورة للعداد في هذه المعاينة'
                              : 'No odometer cluster photo available'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verified Mileage Input right below odometer photo */}
                    <div className="pt-3 border-t border-emerald-500/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Gauge className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          {isArabic ? 'قراءة العداد المعتمدة (كم) *' : 'Verified Mileage (KM) *'}
                        </label>
                        {isStep2Complete && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" />
                            {isArabic ? 'تم التوثيق' : 'Verified'}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          required
                          min={0}
                          step={1}
                          placeholder={isArabic ? 'مثال: 45000' : 'e.g. 45000'}
                          value={verifiedMileage}
                          onChange={(e) => setVerifiedMileage(e.target.value)}
                          className="w-full h-11 px-3.5 text-sm font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <div className="absolute inset-y-0 end-3.5 flex items-center pointer-events-none text-xs font-bold text-neutral-400">
                          {isArabic ? 'كم' : 'KM'}
                        </div>
                      </div>

                      {verifiedMileage && !isNaN(Number(verifiedMileage)) && Number(verifiedMileage) >= 0 && (
                        <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
                          {Number(verifiedMileage).toLocaleString()} {isArabic ? 'كيلومتر معتمد' : 'KM verified'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CARD 2: PANORAMIC ROOF EVIDENCE & SUNROOF SPECIFICATION */}
                  <div className="rounded-2xl border-2 border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold">
                          <Car className="size-4" />
                          {isArabic ? 'صورة سقف السيارة' : 'Panoramic Roof / Sunroof'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          panoramic_roof
                        </span>
                      </div>

                      {isLoadingMedia ? (
                        <div className="aspect-video w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                          <Loader2 className="size-5 animate-spin" />
                        </div>
                      ) : roofPhoto ? (
                        <div
                          className="group relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 cursor-pointer shadow-xs"
                          onClick={() =>
                            setActiveLightboxImage({
                              url: getMediaFileUrl(roofPhoto.id),
                              title: isArabic ? 'صورة السقف' : 'Sunroof View',
                            })
                          }
                        >
                          <img
                            src={getMediaFileUrl(roofPhoto.id)}
                            alt="Panoramic Roof"
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                            <ZoomIn className="size-4" />
                            <span>{isArabic ? 'معاينة وتكبير' : 'Click to inspect'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-400 text-xs p-4 text-center">
                          <AlertCircle className="size-6 text-amber-500 mb-1.5" />
                          <span>
                            {isArabic
                              ? 'لم يتم رفع صورة للسقف في هذه المعاينة'
                              : 'No roof photo available'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sunroof Specification dropdown right below roof photo */}
                    <div className="pt-3 border-t border-purple-500/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
                          {isArabic ? 'مواصفة فتحة السقف المعتمدة' : 'Sunroof Specification'}
                        </label>
                        {sunroofSpecification && (
                          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" />
                            {isArabic ? 'محددة' : 'Selected'}
                          </span>
                        )}
                      </div>

                      <Select
                        portal={false}
                        size="md"
                        searchable="auto"
                        clearable
                        value={sunroofSpecification}
                        onChange={(val) => setSunroofSpecification(val)}
                        disabled={isLoadingLookups}
                        placeholder={
                          isArabic
                            ? '— اختر نوع فتحة السقف بناءً على الصورة —'
                            : '— Select Sunroof Spec based on photo —'
                        }
                        options={sunroofOptions}
                      />

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {isArabic
                          ? 'تأكد من مطابقة السقف للصورة المرفوعة أعلاه (مثال: بدون سقف، بانوراما، كهرباء).'
                          : 'Match specification to the uploaded photo above (e.g. No Sunroof, Panoramic, Electric).'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: VALUATION & FINAL DECISION */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Banknote className="size-5 text-emerald-600 dark:text-emerald-400" />
                      {isArabic ? 'التقييم السوقي والقرار النهائي' : 'Proposed Market Valuation & Reviewer Decision'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {isArabic
                        ? 'حدد القيمة السوقية المقترحة للمركبة واكتب ملاحظات التقييم قبل الحفظ والاعتماد'
                        : 'Establish proposed market value and provide final reviewer rationale before approval.'}
                    </p>
                  </div>
                </div>

                {/* Proposed Market Value Card */}
                <div className="rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                      {isArabic ? 'القيمة السوقية المقترحة (جنيه مصري) *' : 'Proposed Market Value (EGP) *'}
                    </label>
                    {isStep3Complete && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        {isArabic ? 'قيمة صالحة' : 'Valid Value'}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      placeholder={isArabic ? 'مثال: 750000' : 'e.g. 750000'}
                      value={proposedValue}
                      onChange={(e) => setProposedValue(e.target.value)}
                      className="w-full h-12 px-4 text-base font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none text-xs font-bold text-neutral-400">
                      {isArabic ? 'ج.م' : 'EGP'}
                    </div>
                  </div>

                  {proposedValue && Number(proposedValue) > 0 && (
                    <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {Number(proposedValue).toLocaleString()}{' '}
                      {isArabic ? 'جنيه مصري' : 'EGP'}
                    </p>
                  )}
                </div>

                {/* Reviewer Notes Card */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-5 space-y-2">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-neutral-500" />
                    {isArabic ? 'ملاحظات وتوجيهات المراجع (اختياري)' : 'Reviewer Notes & Rationale (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      isArabic
                        ? 'أدخل أي ملاحظات حول قراءة العداد، حالة الدواخل، أو مبررات التقييم المالي…'
                        : 'Enter any remarks regarding verified mileage, interior condition, or valuation rationale…'
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl outline-none focus:border-emerald-500 transition-all resize-none"
                  />
                </div>

                {/* Review Summary Breakdown */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <ClipboardCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    {isArabic ? 'ملخص مراجعة المركبة والتقييم' : 'Review Summary Breakdown'}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <div>
                      <p className="text-[11px] text-neutral-400">{isArabic ? 'المركبة' : 'Vehicle'}</p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {vehicleName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">{isArabic ? 'قراءة العداد' : 'Mileage'}</p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {isStep2Complete ? `${Number(verifiedMileage).toLocaleString()} KM` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">{isArabic ? 'السقف (الخطوة 2)' : 'Sunroof (Step 2)'}</p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {selectedSunroofLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">{isArabic ? 'ناقل الحركة' : 'Transmission'}</p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {selectedTransmissionLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">{isArabic ? 'المرايات' : 'Mirrors'}</p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {selectedSideMirrorsLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">{isArabic ? 'الدواخل' : 'Interior'}</p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {selectedInteriorLabel}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] text-neutral-400">{isArabic ? 'القيمة المقترحة' : 'Proposed Value'}</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {isStep3Complete ? `${Number(proposedValue).toLocaleString()} EGP` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Navigation Footer */}
          <SheetFooter className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 backdrop-blur-md flex flex-row items-center justify-between shrink-0">
            <div>
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={submitMutation.isPending}
                  className="rounded-xl cursor-pointer gap-1.5 text-xs"
                >
                  <ChevronLeft className="size-4 rtl:rotate-180" />
                  {isArabic ? 'رجوع' : 'Back'}
                </Button>
              ) : (
                <span className="text-xs text-neutral-400">
                  {isArabic ? 'الخطوة 1 من 3' : 'Step 1 of 3'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStep === 1 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5 text-xs px-5 shadow-sm shadow-emerald-500/20"
                >
                  <span>{isArabic ? 'المتابعة للعداد والسقف' : 'Continue to Mileage & Sunroof'}</span>
                  <ChevronRight className="size-4 rtl:rotate-180" />
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5 text-xs px-5 shadow-sm shadow-emerald-500/20"
                >
                  <span>{isArabic ? 'المتابعة للتقييم النهائي' : 'Continue to Valuation'}</span>
                  <ChevronRight className="size-4 rtl:rotate-180" />
                </Button>
              )}

              {currentStep === 3 && (
                <GlassButton
                  type="button"
                  intent="emerald"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !isStep3Complete}
                  className="rounded-xl px-6 font-semibold flex items-center gap-2 text-xs"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{isArabic ? 'جاري الاعتماد…' : 'Submitting…'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-4 stroke-[2.5]" />
                      <span>{isArabic ? 'حفظ واعتماد التقييم' : 'Submit & Approve Valuation'}</span>
                    </>
                  )}
                </GlassButton>
              )}
            </div>
          </SheetFooter>

          {/* Lightbox / Zoom Modal inside SheetContent to preserve pointer events and focus */}
          {activeLightboxImage && (
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 sm:p-6 animate-in fade-in duration-150"
              onClick={() => setActiveLightboxImage(null)}
            >
              <div
                className="relative max-w-4xl max-h-[92vh] w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Controls Bar */}
                <div className="w-full flex items-center justify-between pb-3 text-white">
                  <span className="text-xs sm:text-sm font-semibold bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20">
                    {activeLightboxImage.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLightboxImage(null);
                    }}
                    className="flex items-center justify-center size-9 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md transition-all cursor-pointer border border-white/25 shadow-lg"
                    aria-label="Close photo preview"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Centered Image */}
                <div className="relative w-full max-h-[82vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black/60 border border-white/15 shadow-2xl">
                  <img
                    src={activeLightboxImage.url}
                    alt={activeLightboxImage.title}
                    className="max-h-[80vh] max-w-full object-contain select-none"
                  />
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
