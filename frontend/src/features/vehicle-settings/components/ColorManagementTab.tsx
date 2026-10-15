import { useState, useMemo } from 'react';
import {
  Plus,
  MagnifyingGlass,
  Palette,
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
  fetchVehicleColorsAdmin,
  createVehicleColor,
  updateVehicleColor,
  toggleVehicleColorStatus,
  deleteVehicleColor,
  type VehicleColorAdmin,
} from '../api';

const PRESET_COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Dark Grey', hex: '#374151' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Gold / Champagne', hex: '#D4AF37' },
  { name: 'Brown', hex: '#78350F' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Orange', hex: '#EA580C' },
];

export function ColorManagementTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddColorModalOpen, setIsAddColorModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<VehicleColorAdmin | null>(null);

  const { data: colors = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['vehicle', 'colors', 'admin'],
    queryFn: fetchVehicleColorsAdmin,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'colors', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'lookups'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', 'admin', 'overview'] });
  };

  const createColorMutation = useMutation({
    mutationFn: createVehicleColor,
    onSuccess: (newColor) => {
      toast.success(`Color "${newColor.name}" created successfully`);
      setIsAddColorModalOpen(false);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to create color'));
    },
  });

  const updateColorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateVehicleColor(id, data),
    onSuccess: (updated) => {
      toast.success(`Color "${updated.name}" updated`);
      setEditingColor(null);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update color'));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleVehicleColorStatus,
    onSuccess: (updated) => {
      toast.success(
        `Color "${updated.name}" is now ${updated.isActive ? 'active' : 'inactive'}`,
      );
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update status'));
    },
  });

  const deleteColorMutation = useMutation({
    mutationFn: deleteVehicleColor,
    onSuccess: () => {
      toast.success('Color deleted successfully');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete color'));
    },
  });

  // Filtered list
  const filteredColors = useMemo(() => {
    if (!searchTerm.trim()) return colors;
    const term = searchTerm.toLowerCase().trim();
    return colors.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.nameAr && c.nameAr.toLowerCase().includes(term)) ||
        (c.hex && c.hex.toLowerCase().includes(term)),
    );
  }, [colors, searchTerm]);

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
        <p className="text-red-500 mb-4">Failed to load vehicle colors.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-hairline shadow-sm">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search colors by name, Arabic, or hex (#FFF)..."
            className="pl-10 h-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-mute bg-bone px-2.5 py-1 rounded border border-hairline">
            {colors.filter((c) => c.isActive).length} ACTIVE / {colors.length} TOTAL
          </span>

          <Button
            size="sm"
            onClick={() => setIsAddColorModalOpen(true)}
            className="bg-accent text-white"
          >
            <Plus className="size-4 mr-1" /> Add New Color
          </Button>
        </div>
      </div>

      {/* Colors Grid / List */}
      {filteredColors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-paper/40 p-12 text-center">
          <Palette className="size-10 mx-auto text-ink-mute/70 mb-3" />
          <h3 className="text-base font-semibold text-ink">No vehicle colors found</h3>
          <p className="text-sm text-ink-mute mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No colors match your search query.'
              : 'Add your first vehicle color to populate the inspection color dropdown.'}
          </p>
          {!searchTerm && (
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setIsAddColorModalOpen(true)}
            >
              <Plus className="size-4 mr-1" /> Add First Color
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredColors.map((color) => {
            const isLightColor =
              color.hex?.toUpperCase() === '#FFFFFF' ||
              color.hex?.toUpperCase() === '#FFF' ||
              color.hex?.toUpperCase() === '#F5F5DC';

            return (
              <div
                key={color.id}
                className={`rounded-xl border transition-all p-3.5 flex flex-col justify-between bg-white shadow-2xs hover:shadow-sm ${
                  color.isActive
                    ? 'border-hairline hover:border-ink/25'
                    : 'border-hairline/60 bg-paper/30 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      {/* Color Swatch */}
                      <div
                        className={`size-7 rounded-lg border shadow-inner flex items-center justify-center shrink-0 ${
                          isLightColor ? 'border-hairline' : 'border-black/10'
                        }`}
                        style={{
                          backgroundColor: color.hex || '#E5E7EB',
                        }}
                        title={color.hex || 'No hex specified'}
                      />
                      <div>
                        <h4 className="font-semibold text-ink text-sm leading-tight">
                          {color.name}
                        </h4>
                        {color.nameAr && (
                          <p className="text-xs text-ink-mute font-arabic leading-tight mt-0.5">
                            {color.nameAr}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStatusMutation.mutate(color.id)}
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                        color.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-bone text-ink-mute border border-hairline hover:bg-paper'
                      }`}
                      title="Click to toggle Active status"
                    >
                      {color.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-mute mt-2 pt-2 border-t border-hairline/60">
                    <span className="font-mono text-[11px]">
                      {color.hex || '—'}
                    </span>
                    <span>
                      {color._count?.vehicles > 0
                        ? `${color._count.vehicles} vehicle${color._count.vehicles === 1 ? '' : 's'}`
                        : 'No vehicles'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-hairline">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-ink-mute hover:text-ink"
                    onClick={() => setEditingColor(color)}
                  >
                    <PencilSimple className="size-3.5 mr-1" /> Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-red-500/70 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (color._count?.vehicles > 0) {
                        toast.error(
                          `Cannot delete "${color.name}" because ${color._count.vehicles} vehicle(s) reference it. Deactivate it instead.`,
                        );
                        return;
                      }
                      if (
                        window.confirm(
                          `Are you sure you want to delete color "${color.name}"?`,
                        )
                      ) {
                        deleteColorMutation.mutate(color.id);
                      }
                    }}
                  >
                    <Trash className="size-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Add New Color ─────────────────────────────────────────── */}
      {isAddColorModalOpen && (
        <CreateColorModal
          onClose={() => setIsAddColorModalOpen(false)}
          onSubmit={(data) => createColorMutation.mutate(data)}
          isLoading={createColorMutation.isPending}
        />
      )}

      {/* ─── Modal: Edit Color ───────────────────────────────────────────── */}
      {editingColor && (
        <EditColorModal
          color={editingColor}
          onClose={() => setEditingColor(null)}
          onSubmit={(data) =>
            updateColorMutation.mutate({ id: editingColor.id, data })
          }
          isLoading={updateColorMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Modal: Add Color ────────────────────────────────────────────────────────
function CreateColorModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    nameAr?: string;
    hex?: string;
    isActive?: boolean;
  }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [hex, setHex] = useState('#2563EB');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Color name is required');
      return;
    }
    onSubmit({
      name: name.trim(),
      nameAr: nameAr.trim() || undefined,
      hex: hex.trim() || undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/30">
          <div>
            <h3 className="font-semibold text-ink text-base">Add Vehicle Color</h3>
            <p className="text-xs text-ink-mute mt-0.5">
              Add a new color to dynamic vehicle dropdown lists
            </p>
          </div>
          <button onClick={onClose} className="text-ink-mute hover:text-ink p-1">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Color Name (English) <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Midnight Blue, Alpine White, Pearl Black"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Arabic Translation (Optional)
            </label>
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="e.g. أزرق ليلي، أبيض لؤلؤي"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Color Swatch & Hex Code
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value.toUpperCase())}
                className="size-10 rounded-lg cursor-pointer border border-hairline p-0.5 bg-white shadow-2xs"
              />
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value.toUpperCase())}
                placeholder="#000000"
                className="font-mono text-xs uppercase flex-1"
                maxLength={7}
              />
            </div>

            {/* Quick palette buttons */}
            <div className="mt-2.5">
              <span className="text-[10px] text-ink-mute block mb-1">
                Quick palette presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setHex(preset.hex);
                      if (!name) setName(preset.name);
                    }}
                    className="size-5 rounded border border-black/15 shadow-2xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: preset.hex }}
                    title={`${preset.name} (${preset.hex})`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-hairline text-accent focus:ring-accent"
            />
            <label htmlFor="isActive" className="text-xs text-ink font-medium cursor-pointer">
              Active (immediately selectable in vehicle inspection forms)
            </label>
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
                'Add Color'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Edit Color ────────────────────────────────────────────────────────
function EditColorModal({
  color,
  onClose,
  onSubmit,
  isLoading,
}: {
  color: VehicleColorAdmin;
  onClose: () => void;
  onSubmit: (data: {
    name?: string;
    nameAr?: string;
    hex?: string;
    isActive?: boolean;
  }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(color.name);
  const [nameAr, setNameAr] = useState(color.nameAr || '');
  const [hex, setHex] = useState(color.hex || '#000000');
  const [isActive, setIsActive] = useState(color.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Color name cannot be empty');
      return;
    }
    onSubmit({
      name: name.trim(),
      nameAr: nameAr.trim() || undefined,
      hex: hex.trim() || undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-paper/30">
          <div>
            <h3 className="font-semibold text-ink text-base">Edit Vehicle Color</h3>
            <p className="text-xs text-ink-mute mt-0.5">Update color details</p>
          </div>
          <button onClick={onClose} className="text-ink-mute hover:text-ink p-1">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Color Name (English) <span className="text-red-500">*</span>
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
              Arabic Translation (Optional)
            </label>
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Color Swatch & Hex Code
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value.toUpperCase())}
                className="size-10 rounded-lg cursor-pointer border border-hairline p-0.5 bg-white shadow-2xs"
              />
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value.toUpperCase())}
                className="font-mono text-xs uppercase flex-1"
                maxLength={7}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-hairline text-accent focus:ring-accent"
            />
            <label htmlFor="editIsActive" className="text-xs text-ink font-medium cursor-pointer">
              Active (selectable in vehicle inspection forms)
            </label>
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
