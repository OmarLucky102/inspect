import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  MagnifyingGlass,
  Car,
  Trash,
  PencilSimple,
  CaretDown,
  CaretRight,
  CircleNotch,
  X,
  Tag,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  fetchVehicleBrandsAdmin,
  createVehicleBrand,
  updateVehicleBrand,
  deleteVehicleBrand,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
  type VehicleBrandAdmin,
  type VehicleModelAdmin,
} from '../api';

export function BrandManagementTab() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBrandIds, setExpandedBrandIds] = useState<Set<string>>(
    new Set(),
  );

  // Modals state
  const [isNewBrandModalOpen, setIsNewBrandModalOpen] = useState(false);
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [selectedBrandForModel, setSelectedBrandForModel] = useState<string>('');

  // Editing state
  const [editingBrand, setEditingBrand] = useState<VehicleBrandAdmin | null>(null);
  const [editingModel, setEditingModel] = useState<VehicleModelAdmin | null>(null);

  // Queries
  const { data: brands = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['vehicle', 'brands', 'admin'],
    queryFn: fetchVehicleBrandsAdmin,
  });

  // Toggle brand accordion
  const toggleExpand = (brandId: string) => {
    setExpandedBrandIds((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedBrandIds(new Set(brands.map((b) => b.id)));
  };

  const collapseAll = () => {
    setExpandedBrandIds(new Set());
  };

  // Filtered brands
  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return brands;
    const term = searchTerm.toLowerCase().trim();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        (b.code && b.code.toLowerCase().includes(term)) ||
        b.models.some((m) => m.name.toLowerCase().includes(term)),
    );
  }, [brands, searchTerm]);

  // Options for brand select
  const brandSelectOptions = useMemo(
    () =>
      brands.map((b) => ({
        value: b.id,
        label: b.name,
        secondaryLabel: b.code ?? undefined,
        badge: `${b.models.length} models`,
      })),
    [brands],
  );

  // Invalidate lookups everywhere
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'brands', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'lookups'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'admin', 'overview'] });
  };

  // Mutations
  const createBrandMutation = useMutation({
    mutationFn: createVehicleBrand,
    onSuccess: (newBrand) => {
      toast.success(`Brand "${newBrand.name}" created successfully`);
      setIsNewBrandModalOpen(false);
      invalidateAll();
      // Auto-expand newly created brand
      setExpandedBrandIds((prev) => new Set([...prev, newBrand.id]));
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to create brand'));
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; code?: string } }) =>
      updateVehicleBrand(id, data),
    onSuccess: (updated) => {
      toast.success(`Brand "${updated.name}" updated`);
      setEditingBrand(null);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update brand'));
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: deleteVehicleBrand,
    onSuccess: () => {
      toast.success('Brand deleted successfully');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete brand'));
    },
  });

  const createModelMutation = useMutation({
    mutationFn: ({ brandId, name }: { brandId: string; name: string }) =>
      createVehicleModel(brandId, { name }),
    onSuccess: (newModel) => {
      toast.success(`Model "${newModel.name}" added successfully`);
      setIsAddModelModalOpen(false);
      setSelectedBrandForModel('');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to add model'));
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateVehicleModel(id, { name }),
    onSuccess: (updated) => {
      toast.success(`Model renamed to "${updated.name}"`);
      setEditingModel(null);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update model'));
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: deleteVehicleModel,
    onSuccess: () => {
      toast.success('Model deleted successfully');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete model'));
    },
  });

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
        <p className="text-red-500 mb-4">Failed to load vehicle brands.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-hairline shadow-sm">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-mute pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('vehicleSettings.searchMakeModel', 'Search make or model (e.g. BMW, M3, Porsche)...')}
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

        <div className="flex items-center gap-2">
          {brands.length > 0 && (
            <div className="hidden md:flex items-center text-xs text-ink-mute gap-1 me-2">
              <button
                onClick={expandAll}
                className="hover:text-ink underline cursor-pointer"
              >
                {t('vehicleSettings.expandAll', 'Expand all')}
              </button>
              <span>·</span>
              <button
                onClick={collapseAll}
                className="hover:text-ink underline cursor-pointer"
              >
                {t('vehicleSettings.collapseAll', 'Collapse all')}
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedBrandForModel(brands[0]?.id || '');
              setIsAddModelModalOpen(true);
            }}
            disabled={brands.length === 0}
            className="cursor-pointer gap-1"
          >
            <Plus className="size-4 text-ink-soft" /> {t('vehicleSettings.addModel', 'Add Model')}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsNewBrandModalOpen(true)}
            className="bg-accent text-white cursor-pointer gap-1"
          >
            <Plus className="size-4" /> {t('vehicleSettings.addMake', 'New Make (Brand)')}
          </Button>
        </div>
      </div>

      {/* Brands List */}
      {filteredBrands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-paper/40 p-12 text-center">
          <Car className="size-10 mx-auto text-ink-mute/70 mb-3" />
          <h3 className="text-base font-semibold text-ink">{t('vehicleSettings.noBrandsFound', 'No vehicle makes found')}</h3>
          <p className="text-sm text-ink-mute mt-1 max-w-sm mx-auto">
            {searchTerm
              ? (isArabic ? 'جرب تغيير معايير البحث' : 'Try adjusting your search criteria')
              : (isArabic ? 'ابدأ بإضافة أول ماركة مركبة بالنظام (مثل: تويوتا، مرسيدس، بي إم دبليو)' : 'Start by adding your first car make (e.g. Toyota, Mercedes, BMW)')}
          </p>
          {!searchTerm && (
            <Button
              size="sm"
              className="mt-4 gap-1.5 cursor-pointer"
              onClick={() => setIsNewBrandModalOpen(true)}
            >
              <Plus className="size-4" /> {t('vehicleSettings.addMake', 'Add First Make')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBrands.map((brand) => {
            const isExpanded = expandedBrandIds.has(brand.id);
            return (
              <div
                key={brand.id}
                className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden transition-all duration-150"
              >
                {/* Brand Header */}
                <div className="px-4 py-3.5 flex items-center justify-between hover:bg-paper/40 transition-colors">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                    onClick={() => toggleExpand(brand.id)}
                  >
                    <button
                      type="button"
                      className="size-6 flex items-center justify-center rounded text-ink-mute hover:bg-paper hover:text-ink"
                    >
                      {isExpanded ? (
                        <CaretDown className="size-4" />
                      ) : (
                        <CaretRight className="size-4" />
                      )}
                    </button>

                    <div className="size-8 rounded-lg bg-ink/5 flex items-center justify-center text-ink font-bold text-xs uppercase tracking-wider">
                      {brand.code ? brand.code.slice(0, 3) : brand.name.slice(0, 2)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-base">
                          {brand.name}
                        </span>
                        {brand.code && (
                          <span className="font-mono text-[11px] bg-bone text-ink-mute px-1.5 py-0.5 rounded border border-hairline">
                            {brand.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-mute mt-0.5">
                        {brand.models.length} model{brand.models.length === 1 ? '' : 's'}
                        {brand._count?.vehicles > 0 && (
                          <span> · {brand._count.vehicles} vehicle{brand._count.vehicles === 1 ? '' : 's'} assigned</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs px-2.5 text-accent hover:text-accent-deep hover:bg-accent/10"
                      onClick={() => {
                        setSelectedBrandForModel(brand.id);
                        setIsAddModelModalOpen(true);
                      }}
                    >
                      <Plus className="size-3.5 mr-1" /> Add Model
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-ink-mute hover:text-ink"
                      onClick={() => setEditingBrand(brand)}
                      title="Edit Brand"
                    >
                      <PencilSimple className="size-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500/70 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (brand._count?.vehicles > 0) {
                          toast.error(
                            `Cannot delete "${brand.name}" because ${brand._count.vehicles} vehicle(s) reference it.`,
                          );
                          return;
                        }
                        if (
                          window.confirm(
                            `Are you sure you want to delete brand "${brand.name}" and its ${brand.models.length} model(s)?`,
                          )
                        ) {
                          deleteBrandMutation.mutate(brand.id);
                        }
                      }}
                      title="Delete Brand"
                    >
                      <Trash className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Sub-models Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-hairline bg-paper/20 px-4 py-3">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-mono tracking-wider uppercase text-ink-mute">
                        Models for {brand.name} ({brand.models.length})
                      </span>
                    </div>

                    {brand.models.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-ink-mute italic">
                          No models defined yet for {brand.name}.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs h-7"
                          onClick={() => {
                            setSelectedBrandForModel(brand.id);
                            setIsAddModelModalOpen(true);
                          }}
                        >
                          <Plus className="size-3 mr-1" /> Add Model to {brand.name}
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {brand.models.map((model) => (
                          <div
                            key={model.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-hairline text-sm hover:border-ink/20 group transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-ink truncate text-xs">
                                {model.name}
                              </p>
                              {model._count && model._count.vehicles > 0 && (
                                <p className="text-[10px] text-ink-mute">
                                  {model._count.vehicles} vehicle{model._count.vehicles === 1 ? '' : 's'}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingModel(model)}
                                className="p-1 text-ink-mute hover:text-ink rounded"
                                title="Edit Model Name"
                              >
                                <PencilSimple className="size-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (model._count && model._count.vehicles > 0) {
                                    toast.error(
                                      `Cannot delete "${model.name}" because ${model._count.vehicles} vehicle(s) reference it.`,
                                    );
                                    return;
                                  }
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete model "${model.name}"?`,
                                    )
                                  ) {
                                    deleteModelMutation.mutate(model.id);
                                  }
                                }}
                                className="p-1 text-red-500/70 hover:text-red-600 rounded"
                                title="Delete Model"
                              >
                                <Trash className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal 1: Create Completely New Brand (Make) ───────────────────── */}
      {isNewBrandModalOpen && (
        <CreateBrandModal
          onClose={() => setIsNewBrandModalOpen(false)}
          onSubmit={(data) => createBrandMutation.mutate(data)}
          isLoading={createBrandMutation.isPending}
        />
      )}

      {/* ─── Modal 2: Add Model to Existing Brand ───────────────────────────── */}
      {isAddModelModalOpen && (
        <AddModelModal
          brands={brandSelectOptions}
          initialBrandId={selectedBrandForModel}
          onClose={() => {
            setIsAddModelModalOpen(false);
            setSelectedBrandForModel('');
          }}
          onSubmit={({ brandId, name }) =>
            createModelMutation.mutate({ brandId, name })
          }
          isLoading={createModelMutation.isPending}
        />
      )}

      {/* ─── Modal 3: Edit Brand ───────────────────────────────────────────── */}
      {editingBrand && (
        <EditBrandModal
          brand={editingBrand}
          onClose={() => setEditingBrand(null)}
          onSubmit={(data) =>
            updateBrandMutation.mutate({ id: editingBrand.id, data })
          }
          isLoading={updateBrandMutation.isPending}
        />
      )}

      {/* ─── Modal 4: Edit Model ───────────────────────────────────────────── */}
      {editingModel && (
        <EditModelModal
          model={editingModel}
          onClose={() => setEditingModel(null)}
          onSubmit={(name) =>
            updateModelMutation.mutate({ id: editingModel.id, name })
          }
          isLoading={updateModelMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Modal 1: Create Brand ───────────────────────────────────────────────────
function CreateBrandModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; code?: string; models?: string[] }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [models, setModels] = useState<string[]>([]);

  const handleAddModel = () => {
    const trimmed = modelInput.trim();
    if (trimmed && !models.includes(trimmed)) {
      setModels([...models, trimmed]);
      setModelInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddModel();
    }
  };

  const removeModel = (m: string) => {
    setModels(models.filter((item) => item !== m));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Brand name is required');
      return;
    }
    onSubmit({
      name: name.trim(),
      code: code.trim() ? code.trim().toUpperCase() : undefined,
      models: models.length > 0 ? models : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/30">
          <div>
            <h3 className="font-semibold text-ink text-base">Add New Car Make (Brand)</h3>
            <p className="text-xs text-ink-mute mt-0.5">
              Add a brand new vehicle manufacturer and its initial sub-models
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-mute hover:text-ink p-1 rounded-md"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Make / Brand Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Porsche, Audi, Tesla"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Code (Optional)
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. POR, AUD, TSLA"
              maxLength={10}
            />
            <p className="text-[11px] text-ink-mute mt-1">
              Short abbreviation used in reporting and request identification.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Initial Models (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type model name and press Enter..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddModel}
                disabled={!modelInput.trim()}
              >
                Add
              </Button>
            </div>

            {models.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-bone border border-hairline">
                {models.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-hairline text-xs font-medium text-ink shadow-2xs"
                  >
                    <Tag className="size-3 text-ink-mute" />
                    {m}
                    <button
                      type="button"
                      onClick={() => removeModel(m)}
                      className="text-ink-mute hover:text-red-500 ml-1"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-ink-mute mt-1">
              You can also add more models to this make at any time later.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-hairline">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <CircleNotch className="size-4 animate-spin mr-1.5" /> Creating...
                </>
              ) : (
                'Create Make'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal 2: Add Model to Existing Brand ────────────────────────────────────
function AddModelModal({
  brands,
  initialBrandId,
  onClose,
  onSubmit,
  isLoading,
}: {
  brands: Array<{ value: string; label: string; secondaryLabel?: string; badge?: string }>;
  initialBrandId: string;
  onClose: () => void;
  onSubmit: (data: { brandId: string; name: string }) => void;
  isLoading: boolean;
}) {
  const [brandId, setBrandId] = useState(initialBrandId || brands[0]?.value || '');
  const [modelName, setModelName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) {
      toast.error('Please select a car make');
      return;
    }
    if (!modelName.trim()) {
      toast.error('Model name is required');
      return;
    }
    onSubmit({ brandId, name: modelName.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/30">
          <div>
            <h3 className="font-semibold text-ink text-base">Add Model to Make</h3>
            <p className="text-xs text-ink-mute mt-0.5">
              Link a new sub-model to an existing brand
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-mute hover:text-ink p-1 rounded-md"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Select Car Make (Brand) <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={brands}
              value={brandId}
              onChange={setBrandId}
              placeholder="Select make..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Model Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. M3 Competition, Civic, Corolla Cross"
              required
              autoFocus
            />
            <p className="text-[11px] text-ink-mute mt-1">
              This model will immediately become available in the vehicle inspection dropdown when this Make is selected.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-hairline">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !brandId || !modelName.trim()}>
              {isLoading ? (
                <>
                  <CircleNotch className="size-4 animate-spin mr-1.5" /> Adding...
                </>
              ) : (
                'Add Model'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal 3: Edit Brand ─────────────────────────────────────────────────────
function EditBrandModal({
  brand,
  onClose,
  onSubmit,
  isLoading,
}: {
  brand: VehicleBrandAdmin;
  onClose: () => void;
  onSubmit: (data: { name?: string; code?: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(brand.name);
  const [code, setCode] = useState(brand.code || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Brand name cannot be empty');
      return;
    }
    onSubmit({
      name: name.trim(),
      code: code.trim() ? code.trim().toUpperCase() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/30">
          <div>
            <h3 className="font-semibold text-ink text-base">Edit Car Make</h3>
            <p className="text-xs text-ink-mute mt-0.5">Update make name or code</p>
          </div>
          <button onClick={onClose} className="text-ink-mute hover:text-ink p-1">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Make Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Code (Optional)
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-hairline">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <CircleNotch className="size-4 animate-spin mr-1.5" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal 4: Edit Model ─────────────────────────────────────────────────────
function EditModelModal({
  model,
  onClose,
  onSubmit,
  isLoading,
}: {
  model: VehicleModelAdmin;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(model.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Model name cannot be empty');
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/30">
          <div>
            <h3 className="font-semibold text-ink text-base">Edit Model</h3>
            <p className="text-xs text-ink-mute mt-0.5">Rename this vehicle model</p>
          </div>
          <button onClick={onClose} className="text-ink-mute hover:text-ink p-1">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Model Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-hairline">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <CircleNotch className="size-4 animate-spin mr-1.5" /> Saving...
                </>
              ) : (
                'Save Model'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
