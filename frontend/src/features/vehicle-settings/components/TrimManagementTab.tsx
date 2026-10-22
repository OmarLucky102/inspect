import { useState, useMemo } from 'react';
import {
  Plus,
  MagnifyingGlass,
  SlidersHorizontal,
  Trash,
  PencilSimple,
  CircleNotch,
  X,
  Tag,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchVehicleTrimsAdmin,
  createVehicleTrim,
  updateVehicleTrim,
  toggleVehicleTrimStatus,
  deleteVehicleTrim,
  type VehicleTrimAdmin,
  type CreateTrimPayload,
} from '../api';

const PRESET_TRIMS = [
  { name: 'Standard', nameAr: 'ستاندر', code: 'STD' },
  { name: 'First Category', nameAr: 'الفئة الأولى', code: 'FIRST' },
  { name: 'Second Category', nameAr: 'الفئة الثانية', code: 'SECOND' },
  { name: 'Third Category', nameAr: 'الفئة الثالثة', code: 'THIRD' },
  { name: 'Highline', nameAr: 'هاي لاين', code: 'HIGHLINE' },
  { name: 'Highline Plus', nameAr: 'هاي لاين بلس', code: 'HIGHLINE_PLUS' },
  { name: 'Topline', nameAr: 'توب لاين', code: 'TOPLINE' },
  { name: 'Sport Line', nameAr: 'سبورت لاين', code: 'SPORT_LINE' },
  { name: 'GT Line', nameAr: 'جي تي لاين', code: 'GT_LINE' },
  { name: 'M Sport', nameAr: 'ام سبورت', code: 'M_SPORT' },
  { name: 'AMG Line', nameAr: 'ايه ام جي لاين', code: 'AMG_LINE' },
  { name: 'Full Option', nameAr: 'فل أوبشن', code: 'FULL' },
  { name: 'Luxury', nameAr: 'لكجري', code: 'LUXURY' },
  { name: 'Exclusive', nameAr: 'اكسكلوزيف', code: 'EXCLUSIVE' },
  { name: 'Elegance', nameAr: 'اليجانس', code: 'ELEGANCE' },
  { name: 'Premier', nameAr: 'بريمير', code: 'PREMIER' },
];

export function TrimManagementTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrim, setEditingTrim] = useState<VehicleTrimAdmin | null>(null);
  const [trimToDelete, setTrimToDelete] = useState<VehicleTrimAdmin | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const { data: trims = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['vehicle', 'trims', 'admin'],
    queryFn: fetchVehicleTrimsAdmin,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'trims', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'lookups'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'admin', 'overview'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateTrimPayload) => createVehicleTrim(payload),
    onSuccess: (newTrim) => {
      toast.success(`Trim "${newTrim.name}" added successfully`);
      setIsAddModalOpen(false);
      resetForm();
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to create vehicle trim'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateVehicleTrim(id, data),
    onSuccess: (updated) => {
      toast.success(`Trim "${updated.name}" updated`);
      setEditingTrim(null);
      resetForm();
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update vehicle trim'));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleVehicleTrimStatus,
    onSuccess: (updated) => {
      toast.success(
        `Trim "${updated.name}" is now ${updated.isActive ? 'active' : 'inactive'}`,
      );
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update status'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicleTrim,
    onSuccess: () => {
      toast.success('Trim deleted successfully');
      setTrimToDelete(null);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete trim'));
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormNameAr('');
    setFormCode('');
    setFormIsActive(true);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (trim: VehicleTrimAdmin) => {
    setEditingTrim(trim);
    setFormName(trim.name);
    setFormNameAr(trim.nameAr || '');
    setFormCode(trim.code);
    setFormIsActive(trim.isActive);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please enter a trim name');
      return;
    }

    if (editingTrim) {
      updateMutation.mutate({
        id: editingTrim.id,
        data: {
          name: formName.trim(),
          nameAr: formNameAr.trim() || undefined,
          code: formCode.trim() ? formCode.trim().toUpperCase() : undefined,
          isActive: formIsActive,
        },
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        nameAr: formNameAr.trim() || undefined,
        code: formCode.trim() ? formCode.trim().toUpperCase() : undefined,
        isActive: formIsActive,
      });
    }
  };

  const applyPreset = (preset: (typeof PRESET_TRIMS)[number]) => {
    setFormName(preset.name);
    setFormNameAr(preset.nameAr);
    setFormCode(preset.code);
  };

  // Filtered trims
  const filteredTrims = useMemo(() => {
    if (!searchTerm.trim()) return trims;
    const term = searchTerm.toLowerCase().trim();
    return trims.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        (t.nameAr && t.nameAr.toLowerCase().includes(term)) ||
        t.code.toLowerCase().includes(term),
    );
  }, [trims, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <CircleNotch className="size-8 animate-spin text-ink-mute" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">Failed to load vehicle trims.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-hairline shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search trims by name, Arabic (الفئة), or code..."
            className="pl-10 h-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-mute bg-bone px-2.5 py-1 rounded border border-hairline">
            {trims.filter((t) => t.isActive).length} ACTIVE / {trims.length} TOTAL
          </span>

          <Button
            size="sm"
            onClick={openAddModal}
            className="bg-accent text-white"
          >
            <Plus className="size-4 mr-1" /> Add New Trim
          </Button>
        </div>
      </div>

      {/* Trims Grid */}
      {filteredTrims.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-paper/40 p-12 text-center">
          <SlidersHorizontal className="size-10 mx-auto text-ink-mute/70 mb-3" />
          <h3 className="text-base font-semibold text-ink">No vehicle trims found</h3>
          <p className="text-sm text-ink-mute mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No trims match your search query.'
              : 'Add your first vehicle trim to populate the inspection trim dropdown list.'}
          </p>
          {!searchTerm && (
            <Button size="sm" className="mt-4" onClick={openAddModal}>
              <Plus className="size-4 mr-1" /> Add First Trim
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredTrims.map((trim) => {
            const vehicleRefs =
              (trim._count?.vehicles || 0) +
              (trim._count?.originalTrimRequests || 0);

            return (
              <div
                key={trim.id}
                className="group relative flex flex-col justify-between p-4 rounded-xl border border-hairline bg-white shadow-2xs hover:border-ink/20 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-ink text-sm truncate">
                          {trim.name}
                        </span>
                        {!trim.isActive && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                            Inactive
                          </span>
                        )}
                      </div>

                      {trim.nameAr && (
                        <p
                          dir="rtl"
                          className="text-xs text-ink-mute mt-0.5 font-medium truncate"
                        >
                          {trim.nameAr}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-bone border border-hairline text-ink-soft">
                      {trim.code}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-mute">
                    <Tag className="size-3.5 text-ink-mute" />
                    <span>
                      {vehicleRefs} {vehicleRefs === 1 ? 'vehicle' : 'vehicles'} linked
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline/80 flex items-center justify-between gap-2">
                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleStatusMutation.mutate(trim.id)}
                    disabled={toggleStatusMutation.isPending}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                      trim.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                    }`}
                    title={
                      trim.isActive
                        ? 'Click to deactivate this trim'
                        : 'Click to activate this trim'
                    }
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        trim.isActive ? 'bg-emerald-600' : 'bg-zinc-400'
                      }`}
                    />
                    {trim.isActive ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(trim)}
                      className="p-1.5 rounded-lg text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                      title="Edit trim"
                    >
                      <PencilSimple className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrimToDelete(trim)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                      title="Delete trim"
                    >
                      <Trash className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Trim Modal */}
      {(isAddModalOpen || editingTrim) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-hairline bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/50">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
                  <SlidersHorizontal className="size-4.5" />
                </span>
                <h3 className="font-semibold text-ink text-base">
                  {editingTrim ? 'Edit Vehicle Trim' : 'Add New Vehicle Trim'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTrim(null);
                  resetForm();
                }}
                className="rounded-lg p-1 text-ink-mute hover:bg-paper hover:text-ink cursor-pointer"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Preset Quick Fill (Add mode only) */}
              {!editingTrim && (
                <div>
                  <label className="block text-xs font-semibold text-ink-mute mb-1.5">
                    Quick Presets (Common Trims)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg bg-bone border border-hairline">
                    {PRESET_TRIMS.map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                          formCode === p.code
                            ? 'bg-ink text-white font-medium shadow-2xs'
                            : 'bg-white hover:bg-paper text-ink-soft border border-hairline'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Trim Name (English) *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Highline, Sport Line, Premier"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Trim Name (Arabic / الفئة)
                </label>
                <Input
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="e.g. هاي لاين، سبورت، الفئة الأولى"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Trim Code (Unique Identifier)
                </label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Leave empty to auto-generate (e.g. HIGHLINE)"
                  className="font-mono uppercase"
                />
                <p className="text-[11px] text-ink-mute mt-1">
                  Uppercase code used for system identifiers. If left empty, it will be automatically derived from the name.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="trimActiveCheckbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="size-4 rounded border-hairline text-accent focus:ring-accent cursor-pointer"
                />
                <label
                  htmlFor="trimActiveCheckbox"
                  className="text-xs font-medium text-ink cursor-pointer"
                >
                  Active in inspection dropdown lists
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-hairline">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTrim(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-accent text-white"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <CircleNotch className="size-4 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : editingTrim ? (
                    'Save Changes'
                  ) : (
                    'Create Trim'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {trimToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-white shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-ink">Delete Vehicle Trim</h3>
            <p className="text-sm text-ink-mute mt-2">
              Are you sure you want to delete the trim{' '}
              <strong className="text-ink">"{trimToDelete.name}"</strong>?
            </p>
            {((trimToDelete._count?.vehicles || 0) +
              (trimToDelete._count?.originalTrimRequests || 0)) > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-3">
                This trim is currently referenced by{' '}
                {(trimToDelete._count?.vehicles || 0) +
                  (trimToDelete._count?.originalTrimRequests || 0)}{' '}
                vehicle(s) or inspection request(s). Deletion is blocked; deactivate it instead.
              </p>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrimToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteMutation.mutate(trimToDelete.id)}
                disabled={
                  deleteMutation.isPending ||
                  ((trimToDelete._count?.vehicles || 0) +
                    (trimToDelete._count?.originalTrimRequests || 0)) > 0
                }
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
              >
                {deleteMutation.isPending ? (
                  <CircleNotch className="size-4 animate-spin mr-1" />
                ) : (
                  <Trash className="size-4 mr-1" />
                )}
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
