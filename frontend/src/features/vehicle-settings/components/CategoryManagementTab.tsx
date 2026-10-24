import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  MagnifyingGlass,
  Shapes,
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
  fetchVehicleCategoriesAdmin,
  createVehicleCategory,
  updateVehicleCategory,
  toggleVehicleCategoryStatus,
  deleteVehicleCategory,
  type VehicleCategoryAdmin,
  type CreateCategoryPayload,
} from '../api';

const PRESET_CATEGORIES = [
  { name: 'Sedan', nameAr: 'سيدان', code: 'SEDAN' },
  { name: 'SUV', nameAr: 'دفع رباعي / اس يو في', code: 'SUV' },
  { name: 'Crossover', nameAr: 'كروس أوفر', code: 'CROSSOVER' },
  { name: 'Hatchback', nameAr: 'هاتشباك', code: 'HATCHBACK' },
  { name: 'Coupe', nameAr: 'كوبيه', code: 'COUPE' },
  { name: 'Pickup Truck', nameAr: 'بيك أب', code: 'PICKUP' },
  { name: 'Van / Minivan', nameAr: 'فان / ميني فان', code: 'VAN' },
  { name: 'Convertible / Cabrio', nameAr: 'كابريوليه / مكشوفة', code: 'CONVERTIBLE' },
  { name: 'Station Wagon', nameAr: 'ستيشن واجن', code: 'STATION_WAGON' },
  { name: 'Commercial Truck', nameAr: 'شاحنة تجارية', code: 'TRUCK' },
];

export function CategoryManagementTab() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VehicleCategoryAdmin | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<VehicleCategoryAdmin | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const { data: categories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['vehicle', 'categories', 'admin'],
    queryFn: fetchVehicleCategoriesAdmin,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'categories', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'lookups'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'admin', 'overview'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createVehicleCategory(payload),
    onSuccess: (newCat) => {
      toast.success(`Category "${newCat.name}" added successfully`);
      setIsAddModalOpen(false);
      resetForm();
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to create category'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateVehicleCategory(id, data),
    onSuccess: (updated) => {
      toast.success(`Category "${updated.name}" updated`);
      setEditingCategory(null);
      resetForm();
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update category'));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleVehicleCategoryStatus,
    onSuccess: (updated) => {
      toast.success(
        `Category "${updated.name}" is now ${updated.isActive ? 'active' : 'inactive'}`,
      );
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update status'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicleCategory,
    onSuccess: () => {
      toast.success('Category deleted successfully');
      setCategoryToDelete(null);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete category'));
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

  const openEditModal = (cat: VehicleCategoryAdmin) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormNameAr(cat.nameAr || '');
    setFormCode(cat.code || '');
    setFormIsActive(cat.isActive);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
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

  const applyPreset = (preset: (typeof PRESET_CATEGORIES)[number]) => {
    setFormName(preset.name);
    setFormNameAr(preset.nameAr);
    setFormCode(preset.code);
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.nameAr && c.nameAr.toLowerCase().includes(term)) ||
        (c.code && c.code.toLowerCase().includes(term)),
    );
  }, [categories, searchTerm]);

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
        <p className="text-red-500 mb-4">Failed to load vehicle categories.</p>
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
            placeholder={isArabic ? 'بحث في فئات الهيكل بالاسم أو الاسم بالعربية أو الكود...' : 'Search categories by name, Arabic (فئة الهيكل), or code...'}
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
            {categories.filter((c) => c.isActive).length} {t('common.active', 'ACTIVE')} / {categories.length} {t('banks.total', 'TOTAL')}
          </span>

          <Button
            size="sm"
            onClick={openAddModal}
            className="bg-accent text-white cursor-pointer gap-1"
          >
            <Plus className="size-4" /> {t('vehicleSettings.addNewCategory', 'Add New Category')}
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-paper/40 p-12 text-center">
          <Shapes className="size-10 mx-auto text-ink-mute/70 mb-3" />
          <h3 className="text-base font-semibold text-ink">
            {isArabic ? 'لا توجد فئات هياكل مطابقة' : 'No vehicle categories found'}
          </h3>
          <p className="text-sm text-ink-mute mt-1 max-w-sm mx-auto">
            {searchTerm
              ? (isArabic ? 'لا توجد فئات هيكل تطابق عبارة البحث الحالية.' : 'No categories match your search query.')
              : (isArabic ? 'أضف أول فئة هيكل لتظهر في خيارات إدخال بيانات الفحص.' : 'Add your first vehicle category to populate the inspection intake list.')}
          </p>
          {!searchTerm && (
            <Button size="sm" className="mt-4 gap-1 cursor-pointer" onClick={openAddModal}>
              <Plus className="size-4" /> {t('vehicleSettings.addNewCategory', 'Add First Category')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredCategories.map((cat) => {
            const vehicleRefs = cat._count?.vehicles || 0;
            const checklistRefs = cat._count?.checklists || 0;

            return (
              <div
                key={cat.id}
                className="group relative flex flex-col justify-between p-4 rounded-xl border border-hairline bg-white shadow-2xs hover:border-ink/20 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-ink text-sm truncate">
                          {cat.name}
                        </span>
                        {!cat.isActive && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                            Inactive
                          </span>
                        )}
                      </div>

                      {cat.nameAr && (
                        <p
                          dir="rtl"
                          className="text-xs text-ink-mute mt-0.5 font-medium truncate"
                        >
                          {cat.nameAr}
                        </p>
                      )}
                    </div>

                    {cat.code && (
                      <span className="shrink-0 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-bone border border-hairline text-ink-soft">
                        {cat.code}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-mute">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="size-3.5 text-ink-mute" />
                      {vehicleRefs} {vehicleRefs === 1 ? 'vehicle' : 'vehicles'}
                    </span>
                    {checklistRefs > 0 && (
                      <span className="inline-flex items-center gap-1">
                        · {checklistRefs} {checklistRefs === 1 ? 'checklist' : 'checklists'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline/80 flex items-center justify-between gap-2">
                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleStatusMutation.mutate(cat.id)}
                    disabled={toggleStatusMutation.isPending}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                      cat.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                    }`}
                    title={
                      cat.isActive
                        ? 'Click to deactivate this category'
                        : 'Click to activate this category'
                    }
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        cat.isActive ? 'bg-emerald-600' : 'bg-zinc-400'
                      }`}
                    />
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                      title="Edit category"
                    >
                      <PencilSimple className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                      title="Delete category"
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

      {/* Add / Edit Category Modal */}
      {(isAddModalOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-hairline bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/50">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
                  <Shapes className="size-4.5" />
                </span>
                <h3 className="font-semibold text-ink text-base">
                  {editingCategory ? 'Edit Vehicle Category' : 'Add New Vehicle Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="rounded-lg p-1 text-ink-mute hover:bg-paper hover:text-ink cursor-pointer"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Presets (Add mode only) */}
              {!editingCategory && (
                <div>
                  <label className="block text-xs font-semibold text-ink-mute mb-1.5">
                    Quick Presets (Body Types)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg bg-bone border border-hairline">
                    {PRESET_CATEGORIES.map((p) => (
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
                  Category Name (English) *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sedan, SUV, Crossover, Hatchback"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Category Name (Arabic / فئة الهيكل)
                </label>
                <Input
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="e.g. سيدان، دفع رباعي، هاتشباك"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Category Code (Optional)
                </label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SEDAN, SUV (auto-generated if empty)"
                  className="font-mono uppercase"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="categoryActiveCheckbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="size-4 rounded border-hairline text-accent focus:ring-accent cursor-pointer"
                />
                <label
                  htmlFor="categoryActiveCheckbox"
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
                    setEditingCategory(null);
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
                  ) : editingCategory ? (
                    'Save Changes'
                  ) : (
                    'Create Category'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-white shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-ink">Delete Vehicle Category</h3>
            <p className="text-sm text-ink-mute mt-2">
              Are you sure you want to delete the category{' '}
              <strong className="text-ink">"{categoryToDelete.name}"</strong>?
            </p>
            {((categoryToDelete._count?.vehicles || 0) +
              (categoryToDelete._count?.checklists || 0)) > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-3">
                This category is currently referenced by{' '}
                {(categoryToDelete._count?.vehicles || 0) +
                  (categoryToDelete._count?.checklists || 0)}{' '}
                vehicle(s) or checklist(s). Deletion is blocked; deactivate it instead.
              </p>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteMutation.mutate(categoryToDelete.id)}
                disabled={
                  deleteMutation.isPending ||
                  ((categoryToDelete._count?.vehicles || 0) +
                    (categoryToDelete._count?.checklists || 0)) > 0
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
