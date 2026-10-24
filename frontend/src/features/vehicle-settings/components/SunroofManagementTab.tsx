import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  MagnifyingGlass,
  Sun,
  Trash,
  PencilSimple,
  CircleNotch,
  X,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchSunroofTypesAdmin,
  createSunroofType,
  updateSunroofType,
  deleteSunroofType,
  type SunroofTypeAdmin,
  type CreateSunroofTypePayload,
} from '../api';

const PRESET_SUNROOFS = [
  { name: 'No Sunroof', nameAr: 'بدون فتحة سقف', code: 'NO_SUNROOF' },
  { name: 'Electric Sunroof', nameAr: 'فتحة سقف كهربائية', code: 'ELECTRIC' },
  { name: 'Panoramic Sunroof', nameAr: 'فتحة سقف بانورامية', code: 'PANORAMIC' },
  { name: 'Panoramic Moonroof', nameAr: 'فتحة سقف بانورامية زجاجية', code: 'PANORAMIC_MOONROOF' },
  { name: 'Manual Sunroof', nameAr: 'فتحة سقف يدوية', code: 'MANUAL' },
  { name: 'Sliding Sunroof', nameAr: 'فتحة سقف منزلقة', code: 'SLIDING' },
  { name: 'Tilt-and-Slide Sunroof', nameAr: 'فتحة سقف قابلة للإمالة والانزلاق', code: 'TILT_SLIDE' },
  { name: 'Pop-up Sunroof', nameAr: 'فتحة سقف قابلة للرفع', code: 'POP_UP' },
];

export function SunroofManagementTab() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSunroof, setEditingSunroof] = useState<SunroofTypeAdmin | null>(null);
  const [sunroofToDelete, setSunroofToDelete] = useState<SunroofTypeAdmin | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCode, setFormCode] = useState('');

  const { data: sunroofs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['vehicle', 'sunroof-types', 'admin'],
    queryFn: fetchSunroofTypesAdmin,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'sunroof-types', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'lookups'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'admin', 'overview'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateSunroofTypePayload) => createSunroofType(payload),
    onSuccess: (newSunroof) => {
      toast.success(`Sunroof specification "${newSunroof.name}" added successfully`);
      setIsAddModalOpen(false);
      resetForm();
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to create sunroof specification'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateSunroofType(id, data),
    onSuccess: (updated) => {
      toast.success(`Sunroof specification "${updated.name}" updated`);
      setEditingSunroof(null);
      resetForm();
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update sunroof specification'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSunroofType,
    onSuccess: () => {
      toast.success('Sunroof specification deleted successfully');
      setSunroofToDelete(null);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete sunroof specification'));
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormNameAr('');
    setFormCode('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (s: SunroofTypeAdmin) => {
    setEditingSunroof(s);
    setFormName(s.name);
    setFormNameAr(s.nameAr || '');
    setFormCode(s.code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please enter a sunroof specification name');
      return;
    }

    if (editingSunroof) {
      updateMutation.mutate({
        id: editingSunroof.id,
        data: {
          name: formName.trim(),
          nameAr: formNameAr.trim() || undefined,
          code: formCode.trim() ? formCode.trim().toUpperCase() : undefined,
        },
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        nameAr: formNameAr.trim() || undefined,
        code: formCode.trim() ? formCode.trim().toUpperCase() : undefined,
      });
    }
  };

  const applyPreset = (preset: (typeof PRESET_SUNROOFS)[number]) => {
    setFormName(preset.name);
    setFormNameAr(preset.nameAr);
    setFormCode(preset.code);
  };

  // Filtered sunroofs
  const filteredSunroofs = useMemo(() => {
    if (!searchTerm.trim()) return sunroofs;
    const term = searchTerm.toLowerCase().trim();
    return sunroofs.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.nameAr && s.nameAr.toLowerCase().includes(term)) ||
        s.code.toLowerCase().includes(term),
    );
  }, [sunroofs, searchTerm]);

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
        <p className="text-red-500 mb-4">Failed to load sunroof specifications.</p>
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
          <MagnifyingGlass className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-mute pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isArabic
                ? 'بحث في مواصفات فتحات السقف بالاسم أو بالعربية أو الكود...'
                : 'Search sunroofs by name, Arabic (فتحة السقف), or code...'
            }
            className="ps-10 pe-9 h-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-mute bg-bone px-2.5 py-1 rounded border border-hairline">
            {sunroofs.length} {isArabic ? 'مواصفة' : 'SPECIFICATIONS'}
          </span>

          <Button
            size="sm"
            onClick={openAddModal}
            className="bg-accent text-white cursor-pointer gap-1"
          >
            <Plus className="size-4" /> {t('vehicleSettings.addNewSunroof', 'Add New Sunroof Spec')}
          </Button>
        </div>
      </div>

      {/* Sunroof Grid */}
      {filteredSunroofs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-paper/40 p-12 text-center">
          <Sun className="size-10 mx-auto text-ink-mute/70 mb-3" />
          <h3 className="text-base font-semibold text-ink">
            {isArabic ? 'لا توجد مواصفات فتحات سقف مطابقة' : 'No sunroof specifications found'}
          </h3>
          <p className="text-sm text-ink-mute mt-1 max-w-sm mx-auto">
            {searchTerm
              ? (isArabic ? 'لا توجد مواصفات فتحة سقف تطابق عبارة البحث الحالية.' : 'No sunroof specifications match your search query.')
              : (isArabic ? 'أضف أول مواصفة فتحة سقف لتظهر في خيارات فحص المركبات.' : 'Add your first sunroof specification to populate the vehicle inspection options.')}
          </p>
          {!searchTerm && (
            <Button size="sm" className="mt-4 cursor-pointer gap-1" onClick={openAddModal}>
              <Plus className="size-4" /> {t('vehicleSettings.addNewSunroof', 'Add First Sunroof Spec')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredSunroofs.map((sunroof) => (
            <div
              key={sunroof.id}
              className="group relative flex flex-col justify-between p-4 rounded-xl border border-hairline bg-white shadow-2xs hover:border-ink/20 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-ink text-sm truncate block">
                      {sunroof.name}
                    </span>

                    {sunroof.nameAr && (
                      <p
                        dir="rtl"
                        className="text-xs text-ink-mute mt-0.5 font-medium truncate"
                      >
                        {sunroof.nameAr}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-bone border border-hairline text-ink-soft">
                    {sunroof.code}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-hairline/80 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(sunroof)}
                  className="p-1.5 rounded-lg text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                  title={isArabic ? 'تعديل مواصفة فتحة السقف' : 'Edit sunroof specification'}
                >
                  <PencilSimple className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSunroofToDelete(sunroof)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                  title={isArabic ? 'حذف مواصفة فتحة السقف' : 'Delete sunroof specification'}
                >
                  <Trash className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Sunroof Modal */}
      {(isAddModalOpen || editingSunroof) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-hairline bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/50">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
                  <Sun className="size-4.5" />
                </span>
                <h3 className="font-semibold text-ink text-base">
                  {editingSunroof
                    ? (isArabic ? 'تعديل مواصفة فتحة السقف' : 'Edit Sunroof Specification')
                    : (isArabic ? 'إضافة مواصفة فتحة سقف جديدة' : 'Add New Sunroof Specification')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSunroof(null);
                  resetForm();
                }}
                className="rounded-lg p-1 text-ink-mute hover:bg-paper hover:text-ink cursor-pointer"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Presets (Add mode only) */}
              {!editingSunroof && (
                <div>
                  <label className="block text-xs font-semibold text-ink-mute mb-1.5">
                    {isArabic ? 'نماذج جاهزة سريعة (أنواع فتحات السقف الشائعة)' : 'Quick Presets (Common Sunroof Specs)'}
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg bg-bone border border-hairline">
                    {PRESET_SUNROOFS.map((p) => (
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
                        {isArabic && p.nameAr ? p.nameAr : p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {isArabic ? 'مواصفة فتحة السقف (بالإنجليزية) *' : 'Sunroof Specification (English) *'}
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Panoramic Sunroof, Electric Sunroof"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {isArabic ? 'مواصفة فتحة السقف (بالعربية / فتحة السقف)' : 'Sunroof Specification (Arabic / فتحة السقف)'}
                </label>
                <Input
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="e.g. فتحة سقف بانورامية، فتحة سقف كهربائية"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {isArabic ? 'الكود التعريفي (اختياري)' : 'Code (Optional)'}
                </label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PANORAMIC (auto-generated if empty)"
                  className="font-mono uppercase"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-hairline">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSunroof(null);
                    resetForm();
                  }}
                  className="cursor-pointer"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-accent text-white cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <CircleNotch className="size-4 animate-spin mr-1.5" />
                      {t('common.saving', 'Saving...')}
                    </>
                  ) : editingSunroof ? (
                    t('common.saveChanges', 'Save Changes')
                  ) : (
                    isArabic ? 'إنشاء المواصفة' : 'Create Specification'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {sunroofToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-white shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-ink">
              {isArabic ? 'حذف مواصفة فتحة السقف' : 'Delete Sunroof Specification'}
            </h3>
            <p className="text-sm text-ink-mute mt-2">
              {isArabic ? (
                <>هل أنت متأكد من حذف مواصفة فتحة السقف <strong className="text-ink">"{sunroofToDelete.nameAr || sunroofToDelete.name}"</strong>؟</>
              ) : (
                <>Are you sure you want to delete the sunroof specification <strong className="text-ink">"{sunroofToDelete.name}"</strong>?</>
              )}
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSunroofToDelete(null)}
                className="cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteMutation.mutate(sunroofToDelete.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700 border-red-600 cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <CircleNotch className="size-4 animate-spin mr-1" />
                ) : (
                  <Trash className="size-4 mr-1" />
                )}
                {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
