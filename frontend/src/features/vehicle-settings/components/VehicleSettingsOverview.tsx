import {
  Car,
  Palette,
  SquaresFour,
  SlidersHorizontal,
  Shapes,
  Sun,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { fetchVehicleOverview } from '../api';

export function VehicleSettingsOverview() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vehicle', 'admin', 'overview'],
    queryFn: fetchVehicleOverview,
  });

  const items = [
    {
      label: t('vehicleSettings.brands', 'Makes'),
      sub: t('vehicleSettings.totalBrands', 'Brands'),
      value: stats?.totalBrands ?? 0,
      icon: Car,
      tint: 'text-sky-600 dark:text-sky-400 bg-sky-500/12',
    },
    {
      label: t('vehicleSettings.models', 'Models'),
      sub: t('vehicleSettings.totalModels', 'Sub-models'),
      value: stats?.totalModels ?? 0,
      icon: SquaresFour,
      tint: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/12',
    },
    {
      label: t('vehicleSettings.categories', 'Categories'),
      sub: t('vehicleSettings.totalCategories', 'Body types'),
      value: stats?.totalCategories ?? 0,
      icon: Shapes,
      tint: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/12',
    },
    {
      label: t('vehicleSettings.trims', 'Trims'),
      sub: t('vehicleSettings.totalTrims', 'Editions'),
      value: stats?.totalTrims ?? 0,
      icon: SlidersHorizontal,
      tint: 'text-purple-600 dark:text-purple-400 bg-purple-500/12',
    },
    {
      label: t('vehicleSettings.sunroofs', 'Sunroof Specs'),
      sub: t('vehicleSettings.totalSunroofs', 'Roof options'),
      value: stats?.totalSunroofTypes ?? 0,
      icon: Sun,
      tint: 'text-amber-600 dark:text-amber-400 bg-amber-500/12',
    },
    {
      label: t('vehicleSettings.colors', 'Colors'),
      sub: t('vehicleSettings.totalColors', 'Palette'),
      value: stats?.totalColors ?? 0,
      icon: Palette,
      tint: 'text-rose-600 dark:text-rose-400 bg-rose-500/12',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} variant="interactive" className="p-3.5">
            <div className="flex items-center justify-between text-ink-mute mb-2">
              <span className="text-[11px] font-mono tracking-wider uppercase truncate">
                {item.label}
              </span>
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${item.tint}`}>
                <Icon className="size-3.5" weight="duotone" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              {isLoading ? '—' : <NumberTicker value={item.value} />}
            </p>
            <span className="text-[10px] text-ink-mute mt-0.5 block truncate">
              {item.sub}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
