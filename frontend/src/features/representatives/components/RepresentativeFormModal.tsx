import { useState, useEffect, useMemo } from 'react';
import {
  X,
  IdentificationBadge,
  CircleNotch,
  User,
  Phone,
  EnvelopeSimple,
  Buildings,
  Check,
  LinkBreak,
  MapPin,
  Sparkle,
} from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  createRepresentative,
  updateRepresentative,
  fetchNextRepresentativeId,
  fetchGovernorates,
  type Representative,
  type CreateRepresentativeDto,
  type UpdateRepresentativeDto,
} from '../api';

interface RepresentativeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  representative?: Representative | null;
}

export function RepresentativeFormModal({
  isOpen,
  onClose,
  representative,
}: RepresentativeFormModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!representative;

  // Form State
  const [repCode, setRepCode] = useState('');
  const [isManualCode, setIsManualCode] = useState(false);
  const [name, setName] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAccountLink, setShowAccountLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Governorates & Cities
  const { data: governorates = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', 'governorates'],
    queryFn: fetchGovernorates,
    enabled: isOpen,
    staleTime: 1000 * 60 * 10,
  });

  // Selected Governorate Object
  const selectedGov = useMemo(
    () => governorates.find((g) => g.id === governorateId),
    [governorates, governorateId],
  );

  // Governorate Options for SearchableSelect
  const governorateOptions = useMemo(
    () => [
      { value: '', label: 'None (Unassigned / اختياري)' },
      ...governorates.map((g) => ({
        value: g.id,
        label: g.name,
        secondaryLabel: g.nameAr ?? undefined,
        badge: g.cities && g.cities.length > 0 ? `${g.cities.length} cities` : undefined,
      })),
    ],
    [governorates],
  );

  // Dependent City Options
  const cityOptions = useMemo(() => {
    if (!selectedGov || !selectedGov.cities) return [];
    return [
      { value: '', label: 'None (All Cities in Gov / اختياري)' },
      ...selectedGov.cities.map((c) => ({
        value: c.id,
        label: c.name,
        secondaryLabel: c.nameAr ?? undefined,
      })),
    ];
  }, [selectedGov]);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      return;
    }

    if (representative) {
      setRepCode(representative.representativeId);
      setIsManualCode(true);
      setName(representative.name);
      setGovernorateId(representative.governorateId ?? '');
      setCityId(representative.cityId ?? '');
      setBranchName(representative.branchName ?? '');
      setPhone(representative.phone ?? '');
      setEmail(representative.email ?? '');
      setIsActive(representative.isActive);
      setUserId(representative.userId ?? null);
      setShowAccountLink(!!representative.userId);
      setErrorMessage(null);
    } else {
      setName('');
      setGovernorateId('');
      setCityId('');
      setBranchName('');
      setPhone('');
      setEmail('');
      setIsActive(true);
      setUserId(null);
      setShowAccountLink(false);
      setIsManualCode(false);
      setErrorMessage(null);

      // Auto-fetch default next sequential code
      fetchNextRepresentativeId()
        .then((code) => setRepCode(code))
        .catch(() => setRepCode('REP-001'));
    }
  }, [isOpen, representative]);

  // When governorate changes on a new representative, suggest a region-prefixed code if not manually locked
  const handleGovernorateChange = (newGovId: string) => {
    setGovernorateId(newGovId);
    setCityId(''); // Reset city when governorate changes

    if (!isEdit && !isManualCode) {
      fetchNextRepresentativeId(newGovId || undefined)
        .then((code) => setRepCode(code))
        .catch(() => setRepCode('REP-001'));
    }
  };

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['representatives'] });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (dto: CreateRepresentativeDto) => createRepresentative(dto),
    onSuccess: (data) => {
      toast.success(
        `Representative "${data.name}" (${data.representativeId}) created successfully`,
      );
      invalidateQueries();
      onClose();
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to create representative');
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (dto: UpdateRepresentativeDto) =>
      updateRepresentative(representative!.id, dto),
    onSuccess: (data) => {
      toast.success(`Representative "${data.name}" updated successfully`);
      invalidateQueries();
      onClose();
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to update representative');
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Representative name is required');
      return;
    }

    if (isEdit) {
      const dto: UpdateRepresentativeDto = {
        name: trimmedName,
        representativeId: repCode.trim() || undefined,
        governorateId: governorateId || null,
        cityId: cityId || null,
        branchName: branchName.trim() || null,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        isActive,
        userId: userId ?? (representative?.userId ? null : undefined),
      };
      updateMutation.mutate(dto);
    } else {
      const dto: CreateRepresentativeDto = {
        name: trimmedName,
        representativeId: repCode.trim() || undefined,
        governorateId: governorateId || undefined,
        cityId: cityId || undefined,
        branchName: branchName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        isActive,
        userId: userId || undefined,
      };
      createMutation.mutate(dto);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white shadow-xs">
              <IdentificationBadge className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-ink">
                {isEdit ? 'Edit Representative' : 'Add New Representative'}
              </h3>
              <p className="text-xs text-ink-mute">
                {isEdit
                  ? `Update field details for ${representative?.representativeId}`
                  : 'Register a new field inspection representative'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-ink-mute hover:bg-paper hover:text-ink transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs text-rose-800 leading-relaxed font-medium">
              {errorMessage}
            </div>
          )}

          {/* Row 1: Rep Code & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-ink">
                  Representative Code <span className="text-rose-500">*</span>
                </label>
                {selectedGov && !isEdit && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-accent font-semibold">
                    <Sparkle className="size-3" />
                    Region-aware
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Input
                  value={repCode}
                  onChange={(e) => {
                    setRepCode(e.target.value.toUpperCase());
                    setIsManualCode(true);
                  }}
                  placeholder="REP-001 or REP-CAI-001"
                  required
                  className="font-mono text-sm uppercase tracking-wider"
                  disabled={isSubmitting}
                />
              </div>
              <span className="text-[10px] text-ink-mute mt-1 block">
                Auto-suggests by region (e.g. REP-CAI-001) or type your custom code
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Operational Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                disabled={isSubmitting}
                className={`w-full h-9 px-3.5 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70'
                    : 'border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${
                      isActive ? 'bg-emerald-500 ring-4 ring-emerald-200' : 'bg-zinc-400'
                    }`}
                  />
                  {isActive ? 'Active (Ready for Field)' : 'Inactive (Suspended)'}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-mute">
                  Toggle
                </span>
              </button>
              <span className="text-[10px] text-ink-mute mt-1 block">
                Determines availability for request assignment
              </span>
            </div>
          </div>

          {/* Row 2: Full Name */}
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Full Name (اسم المندوب) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-ink-mute" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmed Mahmoud / أحمد محمود"
                required
                className="pl-9"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Location & Branch Section (3 Optional Cascading Fields) */}
          <div className="rounded-xl border border-hairline bg-paper/40 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-accent" />
                <span className="text-xs font-semibold text-ink">
                  Operating Region & Branch (اختياري / Optional)
                </span>
              </div>
              <span className="text-[10px] font-mono text-ink-mute uppercase tracking-wider">
                All 3 fields optional
              </span>
            </div>

            {/* Part 1 & Part 2: 2 Dropdown Lists from Database */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Part 1: Governorate Dropdown */}
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  Governorate (المحافظة)
                </label>
                <SearchableSelect
                  options={governorateOptions}
                  value={governorateId}
                  onChange={handleGovernorateChange}
                  placeholder={
                    isLoadingLocations ? 'Loading governorates...' : 'Select governorate (Optional)...'
                  }
                  searchPlaceholder="Search governorate..."
                  disabled={isSubmitting || isLoadingLocations}
                />
              </div>

              {/* Part 2: City / Region Dropdown */}
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  City / State (المدينة / المركز)
                </label>
                <SearchableSelect
                  options={cityOptions}
                  value={cityId}
                  onChange={setCityId}
                  placeholder="Select city (Optional)..."
                  searchPlaceholder="Search city in selected governorate..."
                  disabled={isSubmitting || !governorateId}
                  disabledMessage="Select a governorate first"
                />
              </div>
            </div>

            {/* Part 3: Branch Field (Optional) */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Branch / Office Hub (الفرع)
              </label>
              <div className="relative">
                <Buildings className="absolute left-3 top-2.5 size-4 text-ink-mute" />
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Nasr City Branch, Dokki Hub, Alexandria Main (اختياري)"
                  className="pl-9 text-xs"
                  disabled={isSubmitting}
                />
              </div>
              <span className="text-[10px] text-ink-mute mt-1 block">
                Specific branch office or operating station for dispatch
              </span>
            </div>
          </div>

          {/* Row 4: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Phone Number (الموبايل)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-ink-mute" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01012345678"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Email Address (الإيميل)
              </label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-3 top-2.5 size-4 text-ink-mute" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rep@inspect.com"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Row 5: Mobile App Account Linking (Optional) */}
          <div className="rounded-xl border border-hairline bg-paper/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent/70" />
                <span className="text-xs font-semibold text-ink">
                  Mobile App Account Link (Optional)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountLink(!showAccountLink)}
                className="text-[11px] font-medium text-accent hover:underline cursor-pointer"
              >
                {showAccountLink ? 'Hide' : 'Configure Account Link'}
              </button>
            </div>

            <p className="text-[11px] text-ink-mute leading-relaxed">
              Representatives do not need user logins to be created or assigned. When
              an inspector is ready to log into the Mobile App, you can attach their User UUID.
            </p>

            {showAccountLink && (
              <div className="pt-2 border-t border-hairline space-y-2">
                {representative?.user ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-hairline text-xs">
                    <div>
                      <span className="font-semibold text-ink block">
                        {representative.user.firstName} {representative.user.lastName}
                      </span>
                      <span className="text-ink-mute text-[11px]">
                        {representative.user.email} · Role: {representative.user.role}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUserId(null)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-7 gap-1"
                    >
                      <LinkBreak className="size-3.5" />
                      Unlink
                    </Button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-medium text-ink mb-1">
                      User Account UUID (Identity domain)
                    </label>
                    <Input
                      value={userId ?? ''}
                      onChange={(e) => setUserId(e.target.value.trim() || null)}
                      placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                      className="font-mono text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-hairline shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[130px] gap-2 bg-ink text-white hover:bg-ink/90"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch className="size-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                <>
                  <Check className="size-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <IdentificationBadge className="size-4" />
                  Create Agent
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
