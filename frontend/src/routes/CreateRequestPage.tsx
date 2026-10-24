import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle,
  CircleNotch,
  FloppyDisk,
  IdentificationCard,
  ListChecks,
  MapPin,
  Plus,
  SlidersHorizontal,
  Shapes,
  Sun,
  X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { getApiErrorMessage } from '@/lib/api';
import {
  createVehicleTrim,
  createVehicleCategory,
  createSunroofType,
} from '@/features/vehicle-settings/api';
import {
  fetchGovernorates,
  createInspectionRequest,
  updateInspectionRequestVehicle,
  fetchVehicleLookups,
  fetchInspectionRequestDetails,
  type CreateInspectionRequestDto,
  type VehicleInfoPayload,
} from '@/features/inspection-requests/api';
import { InspectionPhotoChecklistTab } from '@/features/inspection-requests/components/InspectionPhotoChecklistTab';
import {
  LicensePlateInput,
  parseLicensePlate,
} from '@/features/inspection-requests/components/LicensePlateInput';
import { getVehicleColorHex } from '@/lib/colors';
import { useTranslation } from 'react-i18next';

export function CreateRequestPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const { activeBankId, user } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const existingRequestId = searchParams.get('requestId');

  const canCreateRequest =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'MANAGER';

  useEffect(() => {
    if (user && !canCreateRequest) {
      toast.error('You do not have permission to create inspection requests.');
      navigate('/requests', { replace: true });
    }
  }, [user, canCreateRequest, navigate]);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(
    existingRequestId ? 2 : 1,
  );
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(
    existingRequestId,
  );
  const [requestNumber, setRequestNumber] = useState<string | null>(null);

  // ----------------------------------------------------
  // STEP 1: Customer & Location State
  // ----------------------------------------------------
  const [customerForm, setCustomerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    governorateId: '',
    cityId: '',
    address: '',
    notes: '',
  });

  // ----------------------------------------------------
  // STEP 2: Vehicle Information State (13 Bank Fields)
  // ----------------------------------------------------
  const currentYear = new Date().getFullYear();
  const [vehicleForm, setVehicleForm] = useState({
    vin: '',
    plateNumber: '',
    plateDigits: '',
    plateLetters: '',
    engineNumber: '',
    calendarNumber: '',
    brandId: '',
    modelId: '',
    manufactureYear: currentYear,
    colorId: '',
    categoryId: '',
    trimId: '',
    sunroofSpecification: '',
    engineCc: 1600,
    insuranceValue: '',
    specialInstructions: '',
  });

  // State for adding vehicle trim on the fly
  const [isAddTrimModalOpen, setIsAddTrimModalOpen] = useState(false);
  const [quickTrimName, setQuickTrimName] = useState('');
  const [quickTrimNameAr, setQuickTrimNameAr] = useState('');
  const [quickTrimCode, setQuickTrimCode] = useState('');

  // State for adding vehicle category on the fly
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [quickCategoryNameAr, setQuickCategoryNameAr] = useState('');
  const [quickCategoryCode, setQuickCategoryCode] = useState('');

  // State for adding sunroof specification on the fly
  const [isAddSunroofModalOpen, setIsAddSunroofModalOpen] = useState(false);
  const [quickSunroofName, setQuickSunroofName] = useState('');
  const [quickSunroofNameAr, setQuickSunroofNameAr] = useState('');
  const [quickSunroofCode, setQuickSunroofCode] = useState('');

  // ----------------------------------------------------
  // Queries
  // ----------------------------------------------------
  const { data: governorates = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', 'governorates'],
    queryFn: fetchGovernorates,
  });

  const { data: lookups, isLoading: isLoadingLookups } = useQuery({
    queryKey: ['vehicle', 'lookups'],
    queryFn: fetchVehicleLookups,
  });

  // If loading existing draft request
  const { data: existingRequest } = useQuery({
    queryKey: ['inspection-request-details', activeBankId, existingRequestId],
    queryFn: () =>
      fetchInspectionRequestDetails(activeBankId!, existingRequestId!),
    enabled: !!activeBankId && !!existingRequestId,
  });

  useEffect(() => {
    if (existingRequest) {
      setRequestNumber(existingRequest.requestNumber);
      if (existingRequest.customer) {
        setCustomerForm((prev) => ({
          ...prev,
          fullName: existingRequest.customer?.fullName || '',
          phone: existingRequest.customer?.phone || '',
          email: existingRequest.customer?.email || '',
          nationalId: existingRequest.customer?.nationalId || '',
          governorateId: existingRequest.location?.governorateId || '',
          cityId: existingRequest.location?.cityId || '',
          address: existingRequest.location?.address || '',
          notes: existingRequest.notes || '',
        }));
      }
      if (existingRequest.vehicle) {
        const v = existingRequest.vehicle;
        const parsedPlate = parseLicensePlate(v.plateNumber);
        setVehicleForm((prev) => ({
          ...prev,
          vin: v.vin || '',
          plateNumber: v.plateNumber || '',
          plateDigits: parsedPlate.digits,
          plateLetters: parsedPlate.letters,
          engineNumber: v.engineNumber || '',
          calendarNumber: v.calendarNumber || '',
          brandId: v.brand?.id || '',
          modelId: v.model?.id || '',
          manufactureYear: v.manufactureYear || currentYear,
          colorId: v.color?.id || '',
          categoryId: v.category?.id || '',
          trimId: v.trim?.id || '',
          sunroofSpecification: v.sunroofSpecification || '',
          engineCc: v.engineCc || 1600,
          insuranceValue:
            v.insuranceValue != null ? String(v.insuranceValue) : '',
          specialInstructions: v.specialInstructions || '',
        }));
      }
    }
  }, [existingRequest, currentYear]);

  // Dependent location options
  const selectedGovernorate = useMemo(
    () => governorates.find((g) => g.id === customerForm.governorateId),
    [governorates, customerForm.governorateId],
  );

  const governorateOptions = useMemo(
    () =>
      governorates.map((g) => ({
        value: g.id,
        label: isArabic && g.nameAr ? g.nameAr : g.name,
        secondaryLabel: isArabic ? g.name : (g.nameAr ?? undefined),
        badge:
          g.cities && g.cities.length > 0
            ? isArabic
              ? `${g.cities.length} مدن`
              : `${g.cities.length} cities`
            : undefined,
      })),
    [governorates, isArabic],
  );

  const cityOptions = useMemo(() => {
    if (!selectedGovernorate || !selectedGovernorate.cities) return [];
    return selectedGovernorate.cities.map((c) => ({
      value: c.id,
      label: isArabic && c.nameAr ? c.nameAr : c.name,
      secondaryLabel: isArabic ? c.name : (c.nameAr ?? undefined),
    }));
  }, [selectedGovernorate, isArabic]);

  // Vehicle options
  const brandOptions = useMemo(() => {
    if (!lookups?.brands) return [];
    return lookups.brands.map((b) => ({
      value: b.id,
      label: b.name,
      secondaryLabel: b.code ?? undefined,
      badge:
        b.models && b.models.length > 0
          ? isArabic
            ? `${b.models.length} طراز`
            : `${b.models.length} models`
          : undefined,
    }));
  }, [lookups, isArabic]);

  const selectedBrand = useMemo(
    () => lookups?.brands?.find((b) => b.id === vehicleForm.brandId),
    [lookups, vehicleForm.brandId],
  );

  const modelOptions = useMemo(() => {
    if (!selectedBrand || !selectedBrand.models) return [];
    return selectedBrand.models.map((m) => ({
      value: m.id,
      label: m.name,
    }));
  }, [selectedBrand]);

  const categoryOptions = useMemo(() => {
    if (!lookups?.categories) return [];
    return lookups.categories.map((c) => ({
      value: c.id,
      label: isArabic && c.nameAr ? c.nameAr : c.name,
      secondaryLabel: isArabic ? c.name : (c.nameAr ?? undefined),
    }));
  }, [lookups, isArabic]);

  const colorOptions = useMemo(() => {
    if (!lookups?.colors) return [];
    return lookups.colors.map((c) => ({
      value: c.id,
      label: isArabic && c.nameAr ? c.nameAr : c.name,
      secondaryLabel: isArabic ? c.name : (c.nameAr ?? undefined),
      colorDot: getVehicleColorHex(c.name, c.hex),
    }));
  }, [lookups, isArabic]);

  const trimOptions = useMemo(() => {
    if (!lookups?.trims) return [];
    return lookups.trims.map((t) => ({
      value: t.id,
      label: isArabic && t.nameAr ? t.nameAr : t.name,
      secondaryLabel: isArabic ? t.name : (t.nameAr ?? undefined),
    }));
  }, [lookups, isArabic]);

  const sunroofOptions = useMemo(() => {
    if (!lookups?.sunroofTypes) return [];
    return lookups.sunroofTypes.map((s) => ({
      value: s.name,
      label: isArabic && s.nameAr ? s.nameAr : s.name,
      secondaryLabel: isArabic ? s.name : (s.nameAr ?? undefined),
    }));
  }, [lookups, isArabic]);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear + 1; y >= 1985; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // ----------------------------------------------------
  // Mutations
  // ----------------------------------------------------
  const createStep1Mutation = useMutation({
    mutationFn: (payload: CreateInspectionRequestDto) =>
      createInspectionRequest(activeBankId!, payload),
    onSuccess: (data) => {
      setCreatedRequestId(data.id);
      setRequestNumber(data.requestNumber);
      setCurrentStep(2);
      toast.success(
        `Draft #${data.requestNumber} created! Now enter vehicle info.`,
      );
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      });
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to create request')),
  });

  const saveVehicleMutation = useMutation({
    mutationFn: (vars: {
      payload: VehicleInfoPayload;
      isSubmitting: boolean;
      advanceToStep3?: boolean;
    }) =>
      updateInspectionRequestVehicle(
        activeBankId!,
        createdRequestId!,
        vars.payload,
      ),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          'inspection-request-details',
          activeBankId,
          createdRequestId,
        ],
      });
      if (vars.advanceToStep3) {
        toast.success(
          'Vehicle information saved! Now review the inspection checklist.',
        );
        setCurrentStep(3);
      } else if (vars.isSubmitting) {
        toast.success('Inspection request submitted for review successfully!');
        navigate('/requests');
      } else {
        toast.success('Vehicle information saved as draft.');
        navigate('/requests');
      }
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to save vehicle info')),
  });

  const submitFinalMutation = useMutation({
    mutationFn: () => {
      const payload = getVehiclePayload(true);
      return updateInspectionRequestVehicle(
        activeBankId!,
        createdRequestId!,
        payload,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          'inspection-request-details',
          activeBankId,
          createdRequestId,
        ],
      });
      toast.success('Inspection request submitted for review successfully!');
      navigate('/requests');
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, 'Failed to submit inspection request'),
      ),
  });

  const addTrimMutation = useMutation({
    mutationFn: createVehicleTrim,
    onSuccess: (newTrim) => {
      toast.success(`Trim "${newTrim.name}" added to list and selected!`);
      void queryClient.invalidateQueries({ queryKey: ['vehicle', 'lookups'] });
      void queryClient.invalidateQueries({
        queryKey: ['vehicle', 'trims', 'admin'],
      });
      setVehicleForm((prev) => ({ ...prev, trimId: newTrim.id }));
      setIsAddTrimModalOpen(false);
      setQuickTrimName('');
      setQuickTrimNameAr('');
      setQuickTrimCode('');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to add trim'));
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: createVehicleCategory,
    onSuccess: (newCategory) => {
      toast.success(
        `Category "${newCategory.name}" added to list and selected!`,
      );
      void queryClient.invalidateQueries({ queryKey: ['vehicle', 'lookups'] });
      void queryClient.invalidateQueries({
        queryKey: ['vehicle', 'categories', 'admin'],
      });
      setVehicleForm((prev) => ({ ...prev, categoryId: newCategory.id }));
      setIsAddCategoryModalOpen(false);
      setQuickCategoryName('');
      setQuickCategoryNameAr('');
      setQuickCategoryCode('');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to add vehicle category'));
    },
  });

  const addSunroofMutation = useMutation({
    mutationFn: createSunroofType,
    onSuccess: (newSunroof) => {
      toast.success(
        `Sunroof specification "${newSunroof.name}" added to list and selected!`,
      );
      void queryClient.invalidateQueries({ queryKey: ['vehicle', 'lookups'] });
      void queryClient.invalidateQueries({
        queryKey: ['vehicle', 'sunroofs', 'admin'],
      });
      setVehicleForm((prev) => ({
        ...prev,
        sunroofSpecification: newSunroof.name,
      }));
      setIsAddSunroofModalOpen(false);
      setQuickSunroofName('');
      setQuickSunroofNameAr('');
      setQuickSunroofCode('');
    },
    onError: (err) => {
      toast.error(
        getApiErrorMessage(err, 'Failed to add sunroof specification'),
      );
    },
  });

  // ----------------------------------------------------
  // Handlers
  // ----------------------------------------------------
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.fullName.trim() || !customerForm.phone.trim()) {
      toast.error('Customer name and phone number are required');
      return;
    }
    if (!customerForm.governorateId) {
      toast.error('Please select a governorate');
      return;
    }
    if (!customerForm.cityId) {
      toast.error('Please select a city');
      return;
    }

    if (createdRequestId) {
      // Already created, simply advance
      setCurrentStep(2);
      return;
    }

    const payload: CreateInspectionRequestDto = {
      customer: {
        fullName: customerForm.fullName.trim(),
        phone: customerForm.phone.trim(),
        ...(customerForm.email.trim()
          ? { email: customerForm.email.trim() }
          : {}),
        ...(customerForm.nationalId.trim()
          ? { nationalId: customerForm.nationalId.trim() }
          : {}),
      },
      location: {
        governorateId: customerForm.governorateId,
        cityId: customerForm.cityId,
        ...(customerForm.address.trim()
          ? { address: customerForm.address.trim() }
          : {}),
      },
      ...(customerForm.notes.trim()
        ? { notes: customerForm.notes.trim() }
        : {}),
    };

    createStep1Mutation.mutate(payload);
  };

  const getVehiclePayload = (submit: boolean): VehicleInfoPayload => ({
    vin: vehicleForm.vin.trim().toUpperCase(),
    plateNumber: vehicleForm.plateNumber.trim() || undefined,
    plateDigits: vehicleForm.plateDigits?.trim() || undefined,
    plateLetters: vehicleForm.plateLetters?.trim() || undefined,
    engineNumber: vehicleForm.engineNumber.trim().toUpperCase(),
    calendarNumber: vehicleForm.calendarNumber.trim() || undefined,
    brandId: vehicleForm.brandId,
    modelId: vehicleForm.modelId,
    manufactureYear: Number(vehicleForm.manufactureYear),
    colorId: vehicleForm.colorId || undefined,
    categoryId: vehicleForm.categoryId,
    trimId: vehicleForm.trimId || undefined,
    sunroofSpecification:
      vehicleForm.sunroofSpecification.trim() || undefined,
    engineCc: Number(vehicleForm.engineCc),
    insuranceValue: vehicleForm.insuranceValue
      ? Number(vehicleForm.insuranceValue)
      : undefined,
    specialInstructions: vehicleForm.specialInstructions.trim() || undefined,

    captureMode: 'STANDARD',
    includeInterior: false,

    paymentReceiptImage: null,
    licenseFrontImage: null,
    licenseBackImage: null,

    submit,
  });

  const validateVehicleForm = (): boolean => {
    if (!createdRequestId) {
      toast.error('Please complete customer intake first');
      setCurrentStep(1);
      return false;
    }

    // Required fields: VIN, Motor Number, CC Power, Make/Brand, Model, Year, Category
    if (!vehicleForm.vin.trim()) {
      toast.error('VIN Number is required');
      return false;
    }
    if (vehicleForm.vin.trim().length > 25) {
      toast.error('VIN must not exceed 25 characters');
      return false;
    }
    if (!vehicleForm.engineNumber.trim()) {
      toast.error('Motor Number is required');
      return false;
    }
    if (!vehicleForm.brandId) {
      toast.error('Make / Brand is required');
      return false;
    }
    if (!vehicleForm.modelId) {
      toast.error('Model is required');
      return false;
    }
    if (!vehicleForm.manufactureYear) {
      toast.error('Year is required');
      return false;
    }
    if (!vehicleForm.categoryId) {
      toast.error('Category is required');
      return false;
    }
    if (!vehicleForm.engineCc || Number(vehicleForm.engineCc) <= 0) {
      toast.error('CC Power must be a positive number');
      return false;
    }
    return true;
  };

  const handleStep2Submit = (isSubmitting: boolean, advanceToStep3 = false) => {
    if (!validateVehicleForm()) return;

    const payload = getVehiclePayload(isSubmitting);
    saveVehicleMutation.mutate({ payload, isSubmitting, advanceToStep3 });
  };

  if (!activeBankId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
        <p>Please select a bank workspace first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/requests"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-mute transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" />
            {t('titles.requests', 'Back to Inspection Requests')}
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {t('titles.newRequest', 'New Inspection Request')}
            </h1>
            {requestNumber && (
              <span className="inline-flex items-center rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent">
                {requestNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-mute">
            {t('createRequest.step1Desc', 'Three-step intake process: customer details, vehicle specifications, and required photo checklist.')}
          </p>
        </div>


      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-start transition-all ${
            currentStep === 1
              ? 'border-accent bg-white shadow-xs'
              : 'border-hairline bg-paper/50 hover:bg-white'
          }`}
        >
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
              currentStep === 1
                ? 'bg-accent text-white'
                : createdRequestId
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : 'bg-paper text-ink-mute'
            }`}
          >
            {createdRequestId && currentStep !== 1 ? (
              <CheckCircle className="size-4" />
            ) : (
              '1'
            )}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-wider text-ink-mute uppercase">
              {isArabic ? 'المرحلة 1' : 'STEP 1'}
            </p>
            <p className="truncate text-xs font-semibold text-ink">
              {t('createRequest.step1Title', 'Customer & Location')}
            </p>
          </div>
        </button>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => {
            if (createdRequestId) setCurrentStep(2);
            else toast.info(isArabic ? 'يرجى إكمال بيانات العميل أولاً' : 'Complete customer intake first to continue');
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-start transition-all ${
            currentStep === 2
              ? 'border-accent bg-white shadow-xs'
              : 'border-hairline bg-paper/50 hover:bg-white'
          }`}
        >
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
              currentStep === 2
                ? 'bg-accent text-white'
                : currentStep === 3
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : 'bg-paper text-ink-mute'
            }`}
          >
            {currentStep === 3 ? <CheckCircle className="size-4" /> : '2'}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-wider text-ink-mute uppercase">
              {isArabic ? 'المرحلة 2' : 'STEP 2'}
            </p>
            <p className="truncate text-xs font-semibold text-ink">
              {t('createRequest.step2Title', 'Vehicle Information')}
            </p>
          </div>
        </button>

        {/* Step 3 */}
        <button
          type="button"
          onClick={() => {
            if (!createdRequestId) {
              toast.info(isArabic ? 'يرجى إكمال بيانات العميل أولاً' : 'Complete customer intake first to continue');
              return;
            }
            if (validateVehicleForm()) {
              setCurrentStep(3);
            }
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-start transition-all ${
            currentStep === 3
              ? 'border-accent bg-white shadow-xs'
              : 'border-hairline bg-paper/50 hover:bg-white'
          }`}
        >
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
              currentStep === 3
                ? 'bg-accent text-white'
                : 'bg-paper text-ink-mute'
            }`}
          >
            <ListChecks className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-wider text-ink-mute uppercase">
              {isArabic ? 'المرحلة 3' : 'STEP 3'}
            </p>
            <p className="truncate text-xs font-semibold text-ink">
              {t('createRequest.step3Title', 'Checklist & Media')}
            </p>
          </div>
        </button>
      </div>

      {/* STEP 1 FORM */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-6">
          {/* Customer Details Card */}
          <div className="rounded-2xl border border-hairline bg-white p-6 shadow-2xs">
            <div className="mb-4 flex items-center gap-2 border-b border-hairline pb-3">
              <IdentificationCard className="size-5 text-accent" />
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  {t('createRequest.customerCardTitle', 'Customer Information')}
                </h2>
                <p className="text-[11px] text-ink-mute">
                  {t('createRequest.customerCardSubtitle', 'Vehicle owner or bank applicant contact details')}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.fullName', 'Customer Full Name')} <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder={t('createRequest.fullNamePlaceholder', 'e.g. Tarek Mahmoud')}
                  value={customerForm.fullName}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      fullName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.phone', 'Phone Number')} <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  type="tel"
                  dir="ltr"
                  placeholder={t('createRequest.phonePlaceholder', 'e.g. 01012345678')}
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.email', 'Email Address (Optional)')}
                </label>
                <Input
                  type="email"
                  dir="ltr"
                  placeholder={t('createRequest.emailPlaceholder', 'e.g. customer@example.com')}
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.nationalId', 'National ID (Optional)')}
                </label>
                <Input
                  dir="ltr"
                  placeholder={t('createRequest.nationalIdPlaceholder', '14-digit National ID')}
                  value={customerForm.nationalId}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      nationalId: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Location & Scheduling Card */}
          <div className="rounded-2xl border border-hairline bg-white p-6 shadow-2xs">
            <div className="mb-4 flex items-center gap-2 border-b border-hairline pb-3">
              <MapPin className="size-5 text-accent" />
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  {t('createRequest.locationCardTitle', 'Inspection Location')}
                </h2>
                <p className="text-[11px] text-ink-mute">
                  {t('createRequest.locationCardSubtitle', 'Where the representative will inspect the vehicle')}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.governorate', 'Governorate')} <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={governorateOptions}
                  value={customerForm.governorateId}
                  onChange={(govId) =>
                    setCustomerForm({
                      ...customerForm,
                      governorateId: govId,
                      cityId: '',
                    })
                  }
                  placeholder={
                    isLoadingLocations
                      ? t('createRequest.loadingGovernorates', 'Loading governorates...')
                      : t('createRequest.governoratePlaceholder', 'Select governorate...')
                  }
                  searchPlaceholder={t('createRequest.governorateSearch', 'Search governorate...')}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.city', 'City / District')} <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={cityOptions}
                  value={customerForm.cityId}
                  onChange={(cityId) =>
                    setCustomerForm({ ...customerForm, cityId })
                  }
                  disabled={!customerForm.governorateId}
                  disabledMessage={t('createRequest.selectGovFirst', 'Select a governorate first')}
                  placeholder={t('createRequest.cityPlaceholder', 'Select city...')}
                  searchPlaceholder={t('createRequest.citySearch', 'Search city...')}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.address', 'Street Address / Landmark')}
                </label>
                <Input
                  placeholder={t('createRequest.addressPlaceholder', 'e.g. 14 El-Tahrir St, Near City Center')}
                  value={customerForm.address}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.notes', 'Special Notes / Access Instructions')}
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-xs text-ink shadow-[inset_0_1px_2px_rgba(20,23,26,0.05)] transition-colors outline-none placeholder:text-ink-mute/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
                  placeholder={t('createRequest.notesPlaceholder', 'Any gate codes, preferred inspection time, or contact preferences...')}
                  value={customerForm.notes}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/requests')}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={createStep1Mutation.isPending}>
              {createStep1Mutation.isPending ? (
                <>
                  <CircleNotch className="me-1.5 size-4 animate-spin" />
                  {t('createRequest.creatingDraft', 'Creating Draft...')}
                </>
              ) : (
                <>
                  {t('createRequest.continueToVehicle', 'Continue to Vehicle Info')}
                  <ArrowRight className="ms-1.5 size-4 rtl:rotate-180" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2 FORM */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Active Request Banner */}
          <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-white">
                <Car className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">
                  {requestNumber
                    ? `${t('createRequest.linkedToDraft', 'Linked to Draft Request')} ${requestNumber}`
                    : t('createRequest.customerIntakeSaved', 'Customer Intake Saved')}
                </p>
                <p className="text-[11px] text-ink-soft">
                  {t('createRequest.customerCardTitle', 'Customer')}:{' '}
                  <span className="font-medium text-ink">
                    {customerForm.fullName || '—'}
                  </span>{' '}
                  · {customerForm.phone}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
            >
              {t('createRequest.backToCustomer', 'Edit Customer Info')}
            </Button>
          </div>

          {/* Vehicle Information Card (13 Bank Fields) */}
          <div className="rounded-2xl border border-hairline bg-white p-6 shadow-2xs space-y-6">
            <div className="flex items-center gap-2 border-b border-hairline pb-3">
              <Car className="size-5 text-accent" />
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  {t('createRequest.vehicleCardTitle', 'Vehicle Specifications (Bank Required)')}
                </h2>
                <p className="text-[11px] text-ink-mute">
                  {t('createRequest.vehicleCardSubtitle', 'Required vehicle identification and bank inspection attributes')}
                </p>
              </div>
            </div>

            {/* Top Identity Block: Motor + VIN on Left, Plate on Right */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Left Column: Motor Number (top) + VIN Number (under Motor Number) */}
              <div className="space-y-4">
                {/* 1. Motor Number * */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    {t('createRequest.engineNumber', 'Engine / Motor Number')} <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    dir="ltr"
                    placeholder={t('createRequest.engineNumberPlaceholder', 'e.g. N20B20A123456')}
                    className="font-mono uppercase"
                    value={vehicleForm.engineNumber}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        engineNumber: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>

                {/* 2. VIN / Chassis Number * (Under Motor Number) */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    {t('createRequest.vin', 'VIN / Chassis Number')} <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    maxLength={25}
                    dir="ltr"
                    placeholder={t('createRequest.vinPlaceholder', 'e.g. WBA3A5C50DF123456')}
                    className="font-mono uppercase tracking-wider"
                    value={vehicleForm.vin}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        vin: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>

              {/* Right Column: License Plate (Dual 4-Digits & 4-Characters) */}
              <div>
                <LicensePlateInput
                  label={t('createRequest.licensePlate', 'Egyptian License Plate')}
                  digits={vehicleForm.plateDigits}
                  letters={vehicleForm.plateLetters}
                  onChange={(combined, digits, letters) =>
                    setVehicleForm({
                      ...vehicleForm,
                      plateNumber: combined,
                      plateDigits: digits,
                      plateLetters: letters,
                    })
                  }
                />
              </div>
            </div>

            {/* Vehicle Specifications Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* 3. Calendar Number */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.calendarNumber', 'Calendar Number')}
                </label>
                <Input
                  dir="ltr"
                  placeholder={t('createRequest.calendarNumberPlaceholder', 'e.g. CAL-2026-904')}
                  value={vehicleForm.calendarNumber}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      calendarNumber: e.target.value,
                    })
                  }
                />
              </div>

              {/* 5. Make / Brand */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.brand', 'Make / Brand')} <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={brandOptions}
                  value={vehicleForm.brandId}
                  onChange={(brandId) => {
                    setVehicleForm({
                      ...vehicleForm,
                      brandId,
                      modelId: '', // Reset model when make changes
                    });
                  }}
                  placeholder={
                    isLoadingLookups
                      ? t('createRequest.loadingBrands', 'Loading makes...')
                      : t('createRequest.brandPlaceholder', 'Select make...')
                  }
                  searchPlaceholder={t('createRequest.brandSearch', 'Search make (e.g. Toyota, BMW)...')}
                />
              </div>

              {/* 6. Model */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.model', 'Model')} <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={modelOptions}
                  value={vehicleForm.modelId}
                  onChange={(modelId) =>
                    setVehicleForm({ ...vehicleForm, modelId })
                  }
                  disabled={!vehicleForm.brandId}
                  disabledMessage={t('createRequest.selectBrandFirst', 'Select a make/brand first')}
                  placeholder={t('createRequest.modelPlaceholder', 'Select model...')}
                  searchPlaceholder={t('createRequest.modelSearch', 'Search model...')}
                />
              </div>

              {/* 7. Year */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.year', 'Year')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={vehicleForm.manufactureYear}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      manufactureYear: Number(e.target.value),
                    })
                  }
                  className="h-11 w-full rounded-xl border border-hairline bg-white px-3.5 font-mono text-sm text-ink shadow-[inset_0_1px_2px_rgba(20,23,26,0.05)] transition-colors outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Color */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.color', 'Color')}
                </label>
                <SearchableSelect
                  options={colorOptions}
                  value={vehicleForm.colorId}
                  onChange={(colorId) =>
                    setVehicleForm({ ...vehicleForm, colorId })
                  }
                  placeholder={t('createRequest.colorPlaceholder', 'Select color...')}
                  searchPlaceholder={t('createRequest.colorSearch', 'Search color...')}
                />
              </div>

              {/* 9. Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-ink-soft">
                    {t('createRequest.category', 'Category / Body Type')} <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCategoryName('');
                      setQuickCategoryNameAr('');
                      setQuickCategoryCode('');
                      setIsAddCategoryModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>{t('createRequest.addNewCategory', 'Add New Category')}</span>
                  </button>
                </div>
                <SearchableSelect
                  options={categoryOptions}
                  value={vehicleForm.categoryId}
                  onChange={(categoryId) =>
                    setVehicleForm({ ...vehicleForm, categoryId })
                  }
                  placeholder={t('createRequest.categoryPlaceholder', 'Select category (e.g. Sedan, SUV)...')}
                  searchPlaceholder={t('createRequest.categorySearch', 'Search category...')}
                  onAddNew={() => {
                    setQuickCategoryName('');
                    setQuickCategoryNameAr('');
                    setQuickCategoryCode('');
                    setIsAddCategoryModalOpen(true);
                  }}
                  addNewText={t('createRequest.addNewCategory', 'Add new vehicle category...')}
                />
              </div>

              {/* 10. Trim */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-ink-soft">
                    {t('createRequest.trim', 'Vehicle Trim')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickTrimName('');
                      setQuickTrimNameAr('');
                      setQuickTrimCode('');
                      setIsAddTrimModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>{t('createRequest.addNewTrim', 'Add New Trim')}</span>
                  </button>
                </div>
                <SearchableSelect
                  options={trimOptions}
                  value={vehicleForm.trimId}
                  onChange={(trimId) =>
                    setVehicleForm({ ...vehicleForm, trimId })
                  }
                  placeholder={t('createRequest.trimPlaceholder', 'Select trim...')}
                  searchPlaceholder={t('createRequest.trimSearch', 'Search trim...')}
                  onAddNew={() => {
                    setQuickTrimName('');
                    setQuickTrimNameAr('');
                    setQuickTrimCode('');
                    setIsAddTrimModalOpen(true);
                  }}
                  addNewText={t('createRequest.addNewTrim', 'Add new vehicle trim...')}
                />
              </div>

              {/* 11. Sunroof Specification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-ink-soft">
                    {t('createRequest.sunroof', 'Sunroof Specification')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSunroofName('');
                      setQuickSunroofNameAr('');
                      setQuickSunroofCode('');
                      setIsAddSunroofModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>{t('createRequest.addNewSunroof', 'Add New Spec')}</span>
                  </button>
                </div>
                <SearchableSelect
                  options={sunroofOptions}
                  value={vehicleForm.sunroofSpecification}
                  onChange={(sunroofSpecification) =>
                    setVehicleForm({ ...vehicleForm, sunroofSpecification })
                  }
                  placeholder={t('createRequest.sunroofPlaceholder', 'Select sunroof spec...')}
                  searchPlaceholder={t('createRequest.sunroofSearch', 'Search sunroof spec...')}
                  onAddNew={() => {
                    setQuickSunroofName('');
                    setQuickSunroofNameAr('');
                    setQuickSunroofCode('');
                    setIsAddSunroofModalOpen(true);
                  }}
                  addNewText={t('createRequest.addNewSunroof', 'Add new sunroof specification...')}
                />
              </div>

              {/* 11. CC Power * */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.engineCc', 'CC Power')} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  required
                  placeholder="e.g. 1600"
                  value={vehicleForm.engineCc || ''}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      engineCc: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* 12. Insurance Value (EGP) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.insuranceValue', 'Estimated Insurance Value (EGP)')}
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={t('createRequest.insuranceValuePlaceholder', 'e.g. 850000')}
                  value={vehicleForm.insuranceValue}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      insuranceValue: e.target.value,
                    })
                  }
                />
              </div>

              {/* 13. Vehicle Notes */}
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {t('createRequest.specialInstructions', 'Special Instructions / Notes')}
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-xs text-ink shadow-[inset_0_1px_2px_rgba(20,23,26,0.05)] transition-colors outline-none placeholder:text-ink-mute/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
                  placeholder={t('createRequest.specialInstructionsPlaceholder', 'Any notes for the field representative or vehicle handling...')}
                  value={vehicleForm.specialInstructions}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      specialInstructions: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Submission and Action Buttons */}
          <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft className="me-1.5 size-4 rtl:rotate-180" />
              {t('createRequest.backToCustomer', 'Back to Customer Info')}
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={saveVehicleMutation.isPending}
                onClick={() => handleStep2Submit(false, false)}
              >
                {saveVehicleMutation.isPending ? (
                  <CircleNotch className="me-1.5 size-4 animate-spin" />
                ) : (
                  <FloppyDisk className="me-1.5 size-4" />
                )}
                {t('createRequest.saveAsDraft', 'Save as Draft')}
              </Button>

              <Button
                type="button"
                disabled={saveVehicleMutation.isPending}
                onClick={() => handleStep2Submit(false, true)}
              >
                {saveVehicleMutation.isPending ? (
                  <CircleNotch className="me-1.5 size-4 animate-spin" />
                ) : (
                  <ArrowRight className="me-1.5 size-4 rtl:rotate-180" />
                )}
                {t('createRequest.continueToChecklist', 'Next: Inspection Checklist')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: INSPECTION CHECKLIST */}
      {currentStep === 3 && createdRequestId && (
        <div className="space-y-6">
          <InspectionPhotoChecklistTab
            requestId={createdRequestId}
            bankId={activeBankId}
            status={existingRequest?.currentStatus || 'DRAFT'}
            mode="wizard"
            onBack={() => setCurrentStep(2)}
            onSubmitFinal={() => submitFinalMutation.mutate()}
            isSubmittingFinal={submitFinalMutation.isPending}
          />
        </div>
      )}

      {/* Quick Add Trim Modal */}
      {isAddTrimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5 bg-paper/50">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-white">
                  <SlidersHorizontal className="size-4" />
                </span>
                <h3 className="font-semibold text-ink text-sm">
                  {t('createRequest.addTrimModalTitle', 'Add Vehicle Trim to List')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTrimModalOpen(false)}
                className="rounded-lg p-1 text-ink-mute hover:bg-paper hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickTrimName.trim()) {
                  toast.error(isArabic ? 'يرجى إدخال اسم الفئة' : 'Please enter a trim name');
                  return;
                }
                addTrimMutation.mutate({
                  name: quickTrimName.trim(),
                  nameAr: quickTrimNameAr.trim() || undefined,
                  code: quickTrimCode.trim()
                    ? quickTrimCode.trim().toUpperCase()
                    : undefined,
                  isActive: true,
                });
              }}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.nameEn', 'Trim Name (English)')} *
                </label>
                <Input
                  value={quickTrimName}
                  onChange={(e) => setQuickTrimName(e.target.value)}
                  placeholder={isArabic ? 'مثال: Highline, Sport Line' : 'e.g. Highline, Sport Line, Premier'}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.nameAr', 'Trim Name in Arabic (الفئة)')}
                </label>
                <Input
                  value={quickTrimNameAr}
                  onChange={(e) => setQuickTrimNameAr(e.target.value)}
                  placeholder={isArabic ? 'مثال: هاي لاين، سبورت، الفئة الأولى' : 'e.g. هاي لاين، سبورت، الفئة الأولى'}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.codeSlug', 'Trim Code (Optional)')}
                </label>
                <Input
                  value={quickTrimCode}
                  onChange={(e) => setQuickTrimCode(e.target.value.toUpperCase())}
                  placeholder={isArabic ? 'توليد تلقائي في حال تركه فارغاً' : 'Auto-generated if left empty'}
                  className="font-mono uppercase text-xs"
                />
                <p className="text-[10px] text-ink-mute mt-1">
                  {isArabic
                    ? 'رمز تعريفي فريد. إذا ترك فارغاً سيتم إنشاؤه تلقائياً.'
                    : 'Unique identifier code. If left blank, it will be automatically generated from the name.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddTrimModalOpen(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addTrimMutation.isPending}
                  className="bg-accent text-white"
                >
                  {addTrimMutation.isPending ? (
                    <>
                      <CircleNotch className="size-3.5 animate-spin me-1.5" />
                      {t('createRequest.creating', 'Adding...')}
                    </>
                  ) : (
                    t('createRequest.createAndSelect', 'Add & Select')
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5 bg-paper/50">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-white">
                  <Shapes className="size-4" />
                </span>
                <h3 className="font-semibold text-ink text-sm">
                  {t('createRequest.addCategoryModalTitle', 'Add Vehicle Category to List')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="rounded-lg p-1 text-ink-mute hover:bg-paper hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickCategoryName.trim()) {
                  toast.error(isArabic ? 'يرجى إدخال اسم نوع الهيكل' : 'Please enter a category name');
                  return;
                }
                addCategoryMutation.mutate({
                  name: quickCategoryName.trim(),
                  nameAr: quickCategoryNameAr.trim() || undefined,
                  code: quickCategoryCode.trim()
                    ? quickCategoryCode.trim().toUpperCase()
                    : undefined,
                  isActive: true,
                });
              }}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.nameEn', 'Category Name (English)')} *
                </label>
                <Input
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder={isArabic ? 'مثال: Coupe, Crossover, Sedan' : 'e.g. Coupe, Crossover, Sedan'}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.nameAr', 'Category Name in Arabic (نوع الهيكل)')}
                </label>
                <Input
                  value={quickCategoryNameAr}
                  onChange={(e) => setQuickCategoryNameAr(e.target.value)}
                  placeholder={isArabic ? 'مثال: كوبيه، كروس أوفر، سيدان' : 'e.g. كوبيه، كروس أوفر، سيدان'}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.codeSlug', 'Category Code (Optional)')}
                </label>
                <Input
                  value={quickCategoryCode}
                  onChange={(e) =>
                    setQuickCategoryCode(e.target.value.toUpperCase())
                  }
                  placeholder={isArabic ? 'توليد تلقائي في حال تركه فارغاً' : 'Auto-generated if left empty'}
                  className="font-mono uppercase text-xs"
                />
                <p className="text-[10px] text-ink-mute mt-1">
                  {isArabic
                    ? 'رمز تعريفي فريد. إذا ترك فارغاً سيتم إنشاؤه تلقائياً.'
                    : 'Unique identifier code. If left blank, it will be automatically generated from the name.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addCategoryMutation.isPending}
                  className="bg-accent text-white"
                >
                  {addCategoryMutation.isPending ? (
                    <>
                      <CircleNotch className="size-3.5 animate-spin me-1.5" />
                      {t('createRequest.creating', 'Adding...')}
                    </>
                  ) : (
                    t('createRequest.createAndSelect', 'Add & Select')
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Sunroof Modal */}
      {isAddSunroofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5 bg-paper/50">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <Sun className="size-4" />
                </span>
                <h3 className="font-semibold text-ink text-sm">
                  {t('createRequest.addSunroofModalTitle', 'Add Sunroof Specification to List')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSunroofModalOpen(false)}
                className="rounded-lg p-1 text-ink-mute hover:bg-paper hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickSunroofName.trim()) {
                  toast.error(isArabic ? 'يرجى إدخال مواصفة فتحة السقف' : 'Please enter a sunroof specification');
                  return;
                }
                addSunroofMutation.mutate({
                  name: quickSunroofName.trim(),
                  nameAr: quickSunroofNameAr.trim() || undefined,
                  code: quickSunroofCode.trim()
                    ? quickSunroofCode.trim().toUpperCase()
                    : undefined,
                });
              }}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.nameEn', 'Sunroof Specification (English)')} *
                </label>
                <Input
                  value={quickSunroofName}
                  onChange={(e) => setQuickSunroofName(e.target.value)}
                  placeholder={isArabic ? 'مثال: Panoramic Glass Roof' : 'e.g. Panoramic Glass Roof, Electric Tilt & Slide'}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.nameAr', 'Sunroof Specification in Arabic (فتحة السقف)')}
                </label>
                <Input
                  value={quickSunroofNameAr}
                  onChange={(e) => setQuickSunroofNameAr(e.target.value)}
                  placeholder={isArabic ? 'مثال: سقف بانوراما زجاجي، فتحة سقف كهربائية' : 'e.g. سقف بانوراما زجاجي، فتحة سقف كهربائية'}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('createRequest.codeSlug', 'Specification Code (Optional)')}
                </label>
                <Input
                  value={quickSunroofCode}
                  onChange={(e) =>
                    setQuickSunroofCode(e.target.value.toUpperCase())
                  }
                  placeholder={isArabic ? 'توليد تلقائي في حال تركه فارغاً' : 'Auto-generated if left empty'}
                  className="font-mono uppercase text-xs"
                />
                <p className="text-[10px] text-ink-mute mt-1">
                  {isArabic
                    ? 'رمز تعريفي فريد. إذا ترك فارغاً سيتم إنشاؤه تلقائياً.'
                    : 'Unique identifier code. If left blank, it will be automatically generated from the name.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddSunroofModalOpen(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addSunroofMutation.isPending}
                  className="bg-accent text-white"
                >
                  {addSunroofMutation.isPending ? (
                    <>
                      <CircleNotch className="size-3.5 animate-spin me-1.5" />
                      {t('createRequest.creating', 'Adding...')}
                    </>
                  ) : (
                    t('createRequest.createAndSelect', 'Add & Select')
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
