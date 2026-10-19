import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { getApiErrorMessage } from '@/lib/api'
import {
  fetchGovernorates,
  createInspectionRequest,
  updateInspectionRequestVehicle,
  fetchVehicleLookups,
  fetchInspectionRequestDetails,
  type CreateInspectionRequestDto,
  type VehicleInfoPayload,
} from '@/features/inspection-requests/api'
import { InspectionPhotoChecklistTab } from '@/features/inspection-requests/components/InspectionPhotoChecklistTab'

export function CreateRequestPage() {
  const { activeBankId, user } = useWorkspace()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const existingRequestId = searchParams.get('requestId')

  useEffect(() => {
    if (user?.role === 'REVIEWER') {
      toast.error('Reviewers are not permitted to create inspection requests.')
      navigate('/requests', { replace: true })
    }
  }, [user, navigate])

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(existingRequestId ? 2 : 1)
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(existingRequestId)
  const [requestNumber, setRequestNumber] = useState<string | null>(null)

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
  })

  // ----------------------------------------------------
  // STEP 2: Vehicle Information State (13 Bank Fields)
  // ----------------------------------------------------
  const currentYear = new Date().getFullYear()
  const [vehicleForm, setVehicleForm] = useState({
    vin: '',
    plateNumber: '',
    engineNumber: '',
    calendarNumber: '',
    brandId: '',
    modelId: '',
    manufactureYear: currentYear,
    colorId: '',
    categoryId: '',
    trimId: '',
    engineCc: 1600,
    insuranceValue: '',
    specialInstructions: '',
  })

  // ----------------------------------------------------
  // Queries
  // ----------------------------------------------------
  const { data: governorates = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', 'governorates'],
    queryFn: fetchGovernorates,
  })

  const { data: lookups, isLoading: isLoadingLookups } = useQuery({
    queryKey: ['vehicle', 'lookups'],
    queryFn: fetchVehicleLookups,
  })

  // If loading existing draft request
  const { data: existingRequest } = useQuery({
    queryKey: ['inspection-request-details', activeBankId, existingRequestId],
    queryFn: () => fetchInspectionRequestDetails(activeBankId!, existingRequestId!),
    enabled: !!activeBankId && !!existingRequestId,
  })

  useEffect(() => {
    if (existingRequest) {
      setRequestNumber(existingRequest.requestNumber)
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
        }))
      }
      if (existingRequest.vehicle) {
        const v = existingRequest.vehicle
        setVehicleForm((prev) => ({
          ...prev,
          vin: v.vin || '',
          plateNumber: v.plateNumber || '',
          engineNumber: v.engineNumber || '',
          calendarNumber: v.calendarNumber || '',
          brandId: v.brand?.id || '',
          modelId: v.model?.id || '',
          manufactureYear: v.manufactureYear || currentYear,
          colorId: v.color?.id || '',
          categoryId: v.category?.id || '',
          trimId: v.trim?.id || '',
          engineCc: v.engineCc || 1600,
          insuranceValue: v.insuranceValue != null ? String(v.insuranceValue) : '',
          specialInstructions: v.specialInstructions || '',
        }))
      }
    }
  }, [existingRequest, currentYear])

  // Dependent location options
  const selectedGovernorate = useMemo(
    () => governorates.find((g) => g.id === customerForm.governorateId),
    [governorates, customerForm.governorateId],
  )

  const governorateOptions = useMemo(
    () =>
      governorates.map((g) => ({
        value: g.id,
        label: g.name,
        secondaryLabel: g.nameAr ?? undefined,
        badge: g.cities && g.cities.length > 0 ? `${g.cities.length} cities` : undefined,
      })),
    [governorates],
  )

  const cityOptions = useMemo(() => {
    if (!selectedGovernorate || !selectedGovernorate.cities) return []
    return selectedGovernorate.cities.map((c) => ({
      value: c.id,
      label: c.name,
      secondaryLabel: c.nameAr ?? undefined,
    }))
  }, [selectedGovernorate])

  // Vehicle options
  const brandOptions = useMemo(() => {
    if (!lookups?.brands) return []
    return lookups.brands.map((b) => ({
      value: b.id,
      label: b.name,
      secondaryLabel: b.code ?? undefined,
      badge: b.models && b.models.length > 0 ? `${b.models.length} models` : undefined,
    }))
  }, [lookups])

  const selectedBrand = useMemo(
    () => lookups?.brands?.find((b) => b.id === vehicleForm.brandId),
    [lookups, vehicleForm.brandId],
  )

  const modelOptions = useMemo(() => {
    if (!selectedBrand || !selectedBrand.models) return []
    return selectedBrand.models.map((m) => ({
      value: m.id,
      label: m.name,
    }))
  }, [selectedBrand])

  const categoryOptions = useMemo(() => {
    if (!lookups?.categories) return []
    return lookups.categories.map((c) => ({
      value: c.id,
      label: c.name,
      secondaryLabel: c.nameAr ?? undefined,
    }))
  }, [lookups])

  const colorOptions = useMemo(() => {
    if (!lookups?.colors) return []
    return lookups.colors.map((c) => ({
      value: c.id,
      label: c.name,
      secondaryLabel: c.nameAr ?? undefined,
      badge: c.hex ?? undefined,
    }))
  }, [lookups])

  const trimOptions = useMemo(() => {
    if (!lookups?.trims) return []
    return lookups.trims.map((t) => ({
      value: t.id,
      label: t.name,
      secondaryLabel: t.nameAr ?? undefined,
    }))
  }, [lookups])

  const yearOptions = useMemo(() => {
    const years: number[] = []
    for (let y = currentYear + 1; y >= 1985; y--) {
      years.push(y)
    }
    return years
  }, [currentYear])

  // ----------------------------------------------------
  // Mutations
  // ----------------------------------------------------
  const createStep1Mutation = useMutation({
    mutationFn: (payload: CreateInspectionRequestDto) =>
      createInspectionRequest(activeBankId!, payload),
    onSuccess: (data) => {
      setCreatedRequestId(data.id)
      setRequestNumber(data.requestNumber)
      setCurrentStep(2)
      toast.success(`Draft #${data.requestNumber} created! Now enter vehicle info.`)
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create request')),
  })

  const saveVehicleMutation = useMutation({
    mutationFn: (vars: {
      payload: VehicleInfoPayload
      isSubmitting: boolean
      advanceToStep3?: boolean
    }) =>
      updateInspectionRequestVehicle(activeBankId!, createdRequestId!, vars.payload),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, createdRequestId],
      })
      if (vars.advanceToStep3) {
        toast.success('Vehicle information saved! Now review the inspection checklist.')
        setCurrentStep(3)
      } else if (vars.isSubmitting) {
        toast.success('Inspection request submitted for review successfully!')
        navigate('/requests')
      } else {
        toast.success('Vehicle information saved as draft.')
        navigate('/requests')
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to save vehicle info')),
  })

  const submitFinalMutation = useMutation({
    mutationFn: () => {
      const payload = getVehiclePayload(true)
      return updateInspectionRequestVehicle(activeBankId!, createdRequestId!, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, createdRequestId],
      })
      toast.success('Inspection request submitted for review successfully!')
      navigate('/requests')
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to submit inspection request')),
  })

  // ----------------------------------------------------
  // Handlers
  // ----------------------------------------------------
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerForm.fullName.trim() || !customerForm.phone.trim()) {
      toast.error('Customer name and phone number are required')
      return
    }
    if (!customerForm.governorateId) {
      toast.error('Please select a governorate')
      return
    }
    if (!customerForm.cityId) {
      toast.error('Please select a city')
      return
    }

    if (createdRequestId) {
      // Already created, simply advance
      setCurrentStep(2)
      return
    }

    const payload: CreateInspectionRequestDto = {
      customer: {
        fullName: customerForm.fullName.trim(),
        phone: customerForm.phone.trim(),
        ...(customerForm.email.trim() ? { email: customerForm.email.trim() } : {}),
        ...(customerForm.nationalId.trim()
          ? { nationalId: customerForm.nationalId.trim() }
          : {}),
      },
      location: {
        governorateId: customerForm.governorateId,
        cityId: customerForm.cityId,
        ...(customerForm.address.trim() ? { address: customerForm.address.trim() } : {}),
      },
      ...(customerForm.notes.trim() ? { notes: customerForm.notes.trim() } : {}),
    }

    createStep1Mutation.mutate(payload)
  }

  const getVehiclePayload = (submit: boolean): VehicleInfoPayload => ({
    vin: vehicleForm.vin.trim().toUpperCase(),
    plateNumber: vehicleForm.plateNumber.trim() || undefined,
    engineNumber: vehicleForm.engineNumber.trim().toUpperCase(),
    calendarNumber: vehicleForm.calendarNumber.trim() || undefined,
    brandId: vehicleForm.brandId,
    modelId: vehicleForm.modelId,
    manufactureYear: Number(vehicleForm.manufactureYear),
    colorId: vehicleForm.colorId || undefined,
    categoryId: vehicleForm.categoryId,
    trimId: vehicleForm.trimId || undefined,
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
  })

  const validateVehicleForm = (): boolean => {
    if (!createdRequestId) {
      toast.error('Please complete customer intake first')
      setCurrentStep(1)
      return false
    }

    // Required fields: VIN, Motor Number, CC Power, Make/Brand, Model, Year, Category
    if (!vehicleForm.vin.trim()) {
      toast.error('VIN Number is required')
      return false
    }
    if (vehicleForm.vin.trim().length > 25) {
      toast.error('VIN must not exceed 25 characters')
      return false
    }
    if (!vehicleForm.engineNumber.trim()) {
      toast.error('Motor Number is required')
      return false
    }
    if (!vehicleForm.brandId) {
      toast.error('Make / Brand is required')
      return false
    }
    if (!vehicleForm.modelId) {
      toast.error('Model is required')
      return false
    }
    if (!vehicleForm.manufactureYear) {
      toast.error('Year is required')
      return false
    }
    if (!vehicleForm.categoryId) {
      toast.error('Category is required')
      return false
    }
    if (!vehicleForm.engineCc || Number(vehicleForm.engineCc) <= 0) {
      toast.error('CC Power must be a positive number')
      return false
    }
    return true
  }

  const handleStep2Submit = (isSubmitting: boolean, advanceToStep3 = false) => {
    if (!validateVehicleForm()) return

    const payload = getVehiclePayload(isSubmitting)
    saveVehicleMutation.mutate({ payload, isSubmitting, advanceToStep3 })
  }

  if (!activeBankId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
        <p>Please select a bank workspace first.</p>
      </div>
    )
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
            <ArrowLeft className="size-3.5" />
            Back to Inspection Requests
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              New Inspection Request
            </h1>
            {requestNumber && (
              <span className="inline-flex items-center rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent">
                {requestNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-mute">
            Three-step intake process: customer details, vehicle specifications, and required photo checklist.
          </p>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-all ${
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
            {createdRequestId && currentStep !== 1 ? <CheckCircle className="size-4" /> : '1'}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-wider text-ink-mute uppercase">
              STEP 1
            </p>
            <p className="truncate text-xs font-semibold text-ink">
              Customer & Location
            </p>
          </div>
        </button>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => {
            if (createdRequestId) setCurrentStep(2)
            else toast.info('Complete customer intake first to continue')
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-all ${
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
              STEP 2
            </p>
            <p className="truncate text-xs font-semibold text-ink">
              Vehicle Information
            </p>
          </div>
        </button>

        {/* Step 3 */}
        <button
          type="button"
          onClick={() => {
            if (!createdRequestId) {
              toast.info('Complete customer intake first to continue')
              return
            }
            if (validateVehicleForm()) {
              setCurrentStep(3)
            }
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-all ${
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
              STEP 3
            </p>
            <p className="truncate text-xs font-semibold text-ink">
              Inspection Checklist
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
                <h2 className="text-sm font-semibold text-ink">Customer Information</h2>
                <p className="text-[11px] text-ink-mute">
                  Primary vehicle owner or requesting party details
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Tarek Mahmoud"
                  value={customerForm.fullName}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, fullName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. 01012345678"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Email Address (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  National ID (Optional)
                </label>
                <Input
                  placeholder="14-digit National ID"
                  value={customerForm.nationalId}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, nationalId: e.target.value })
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
                <h2 className="text-sm font-semibold text-ink">Inspection Location</h2>
                <p className="text-[11px] text-ink-mute">
                  Where the representative will inspect the vehicle
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Governorate <span className="text-rose-500">*</span>
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
                    isLoadingLocations ? 'Loading governorates...' : 'Select governorate...'
                  }
                  searchPlaceholder="Search governorate..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  City / District <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={cityOptions}
                  value={customerForm.cityId}
                  onChange={(cityId) =>
                    setCustomerForm({ ...customerForm, cityId })
                  }
                  disabled={!customerForm.governorateId}
                  disabledMessage="Select a governorate first"
                  placeholder="Select city..."
                  searchPlaceholder="Search city..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Street Address / Landmark
                </label>
                <Input
                  placeholder="e.g. 14 El-Tahrir St, Near City Center"
                  value={customerForm.address}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, address: e.target.value })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Special Notes / Access Instructions
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-xs text-ink shadow-[inset_0_1px_2px_rgba(20,23,26,0.05)] transition-colors outline-none placeholder:text-ink-mute/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
                  placeholder="Any gate codes, preferred inspection time, or contact preferences..."
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStep1Mutation.isPending}
            >
              {createStep1Mutation.isPending ? (
                <>
                  <CircleNotch className="mr-1.5 size-4 animate-spin" />
                  Creating Draft...
                </>
              ) : (
                <>
                  Continue to Vehicle Info
                  <ArrowRight className="ml-1.5 size-4" />
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
                    ? `Linked to Draft Request ${requestNumber}`
                    : 'Customer Intake Saved'}
                </p>
                <p className="text-[11px] text-ink-soft">
                  Customer: <span className="font-medium text-ink">{customerForm.fullName || '—'}</span> · {customerForm.phone}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
            >
              Edit Customer Info
            </Button>
          </div>

          {/* Vehicle Information Card (13 Bank Fields) */}
          <div className="rounded-2xl border border-hairline bg-white p-6 shadow-2xs space-y-6">
            <div className="flex items-center gap-2 border-b border-hairline pb-3">
              <Car className="size-5 text-accent" />
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Vehicle Information
                </h2>
                <p className="text-[11px] text-ink-mute">
                  Required vehicle identification and bank inspection attributes
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* 1. VIN Number * */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  VIN Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  maxLength={25}
                  placeholder="e.g. WBA3A5C50DF123456"
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

              {/* 2. License Plate */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  License Plate
                </label>
                <Input
                  placeholder="e.g. ABC 1234 / أ ب ج ١٢٣٤"
                  value={vehicleForm.plateNumber}
                  onChange={(e) =>
                    setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })
                  }
                />
              </div>

              {/* 3. Motor Number * */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Motor Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. N20B20A123456"
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

              {/* 4. Calendar Number */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Calendar Number
                </label>
                <Input
                  placeholder="e.g. CAL-2026-904"
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
                  Make / Brand <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={brandOptions}
                  value={vehicleForm.brandId}
                  onChange={(brandId) => {
                    setVehicleForm({
                      ...vehicleForm,
                      brandId,
                      modelId: '', // Reset model when make changes
                    })
                  }}
                  placeholder={
                    isLoadingLookups ? 'Loading makes...' : 'Select make...'
                  }
                  searchPlaceholder="Search make (e.g. Toyota, BMW)..."
                />
              </div>

              {/* 6. Model */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Model <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={modelOptions}
                  value={vehicleForm.modelId}
                  onChange={(modelId) =>
                    setVehicleForm({ ...vehicleForm, modelId })
                  }
                  disabled={!vehicleForm.brandId}
                  disabledMessage="Select a make/brand first"
                  placeholder="Select model..."
                  searchPlaceholder="Search model..."
                />
              </div>

              {/* 7. Year */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Year <span className="text-rose-500">*</span>
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
                  Color
                </label>
                <SearchableSelect
                  options={colorOptions}
                  value={vehicleForm.colorId}
                  onChange={(colorId) =>
                    setVehicleForm({ ...vehicleForm, colorId })
                  }
                  placeholder="Select color..."
                  searchPlaceholder="Search color..."
                />
              </div>

              {/* 9. Category */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Category <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={categoryOptions}
                  value={vehicleForm.categoryId}
                  onChange={(categoryId) =>
                    setVehicleForm({ ...vehicleForm, categoryId })
                  }
                  placeholder="Select category (e.g. Sedan, SUV)..."
                  searchPlaceholder="Search category..."
                />
              </div>

              {/* 10. Trim */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Trim
                </label>
                <SearchableSelect
                  options={trimOptions}
                  value={vehicleForm.trimId}
                  onChange={(trimId) =>
                    setVehicleForm({ ...vehicleForm, trimId })
                  }
                  placeholder="Select trim..."
                  searchPlaceholder="Search trim..."
                />
              </div>

              {/* 11. CC Power * */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  CC Power <span className="text-rose-500">*</span>
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
                  Insurance Value (EGP)
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 850000.00"
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
                  Vehicle Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-xs text-ink shadow-[inset_0_1px_2px_rgba(20,23,26,0.05)] transition-colors outline-none placeholder:text-ink-mute/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
                  placeholder="Any special vehicle notes, instructions, or condition remarks..."
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
              <ArrowLeft className="mr-1.5 size-4" />
              Back to Customer Info
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={saveVehicleMutation.isPending}
                onClick={() => handleStep2Submit(false, false)}
              >
                {saveVehicleMutation.isPending ? (
                  <CircleNotch className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <FloppyDisk className="mr-1.5 size-4" />
                )}
                Save as Draft
              </Button>

              <Button
                type="button"
                disabled={saveVehicleMutation.isPending}
                onClick={() => handleStep2Submit(false, true)}
              >
                {saveVehicleMutation.isPending ? (
                  <CircleNotch className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-1.5 size-4" />
                )}
                Next: Inspection Checklist
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
    </div>
  )
}
