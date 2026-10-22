import {
  Car,
  Palette,
  SquaresFour,
  SlidersHorizontal,
  Shapes,
  Sun,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { fetchVehicleOverview } from '../api';

export function VehicleSettingsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vehicle', 'admin', 'overview'],
    queryFn: fetchVehicleOverview,
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="p-3.5 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-1.5">
          <span className="text-[11px] font-mono tracking-wider uppercase">Makes</span>
          <Car className="size-4" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalBrands ?? 0}
        </p>
        <span className="text-[10px] text-ink-mute mt-0.5 block truncate">
          Brands
        </span>
      </div>

      <div className="p-3.5 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-1.5">
          <span className="text-[11px] font-mono tracking-wider uppercase">Models</span>
          <SquaresFour className="size-4" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalModels ?? 0}
        </p>
        <span className="text-[10px] text-ink-mute mt-0.5 block truncate">
          Sub-models
        </span>
      </div>

      <div className="p-3.5 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-1.5">
          <span className="text-[11px] font-mono tracking-wider uppercase">Categories</span>
          <Shapes className="size-4" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalCategories ?? 0}
        </p>
        <span className="text-[10px] text-ink-mute mt-0.5 block truncate">
          Body types
        </span>
      </div>

      <div className="p-3.5 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-1.5">
          <span className="text-[11px] font-mono tracking-wider uppercase">Trims</span>
          <SlidersHorizontal className="size-4" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalTrims ?? 0}
        </p>
        <span className="text-[10px] text-ink-mute mt-0.5 block truncate">
          Editions
        </span>
      </div>

      <div className="p-3.5 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-1.5">
          <span className="text-[11px] font-mono tracking-wider uppercase">Sunroof Specs</span>
          <Sun className="size-4" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalSunroofTypes ?? 0}
        </p>
        <span className="text-[10px] text-ink-mute mt-0.5 block truncate">
          Roof options
        </span>
      </div>

      <div className="p-3.5 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-1.5">
          <span className="text-[11px] font-mono tracking-wider uppercase">Colors</span>
          <Palette className="size-4" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalColors ?? 0}
        </p>
        <span className="text-[10px] text-ink-mute mt-0.5 block truncate">
          Palette
        </span>
      </div>
    </div>
  );
}
