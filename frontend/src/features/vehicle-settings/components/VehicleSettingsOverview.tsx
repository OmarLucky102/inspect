import { Car, Palette, SquaresFour, SlidersHorizontal, Hash } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { fetchVehicleOverview } from '../api';

export function VehicleSettingsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vehicle', 'admin', 'overview'],
    queryFn: fetchVehicleOverview,
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase">Car Makes</span>
          <Car className="size-4" />
        </div>
        <p className="text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalBrands ?? 0}
        </p>
        <span className="text-[11px] text-ink-mute mt-0.5 block">
          Manufacturers
        </span>
      </div>

      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase">Car Models</span>
          <SquaresFour className="size-4" />
        </div>
        <p className="text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalModels ?? 0}
        </p>
        <span className="text-[11px] text-ink-mute mt-0.5 block">
          Linked to makes
        </span>
      </div>

      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase">Trims / الفئات</span>
          <SlidersHorizontal className="size-4" />
        </div>
        <p className="text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalTrims ?? 0}
        </p>
        <span className="text-[11px] text-ink-mute mt-0.5 block">
          Editions & packages
        </span>
      </div>

      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase">Colors</span>
          <Palette className="size-4" />
        </div>
        <p className="text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalColors ?? 0}
        </p>
        <span className="text-[11px] text-ink-mute mt-0.5 block">
          Inspection palette
        </span>
      </div>

      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-ink-mute mb-2">
          <span className="text-xs font-mono tracking-wider uppercase">Vehicles</span>
          <Hash className="size-4" />
        </div>
        <p className="text-2xl font-bold text-ink">
          {isLoading ? '—' : stats?.totalVehicles ?? 0}
        </p>
        <span className="text-[11px] text-ink-mute mt-0.5 block">
          In active database
        </span>
      </div>
    </div>
  );
}
