import { useState } from 'react';
import {
  Car,
  Palette,
  SlidersHorizontal,
  Shapes,
  Sun,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { VehicleSettingsOverview } from '@/features/vehicle-settings/components/VehicleSettingsOverview';
import { BrandManagementTab } from '@/features/vehicle-settings/components/BrandManagementTab';
import { ColorManagementTab } from '@/features/vehicle-settings/components/ColorManagementTab';
import { TrimManagementTab } from '@/features/vehicle-settings/components/TrimManagementTab';
import { CategoryManagementTab } from '@/features/vehicle-settings/components/CategoryManagementTab';
import { SunroofManagementTab } from '@/features/vehicle-settings/components/SunroofManagementTab';

export function VehicleSettingsPage() {
  const { user } = useWorkspace();
  const [activeTab, setActiveTab] = useState<
    'makes' | 'trims' | 'categories' | 'sunroofs' | 'colors'
  >('makes');

  // Strict role check: Superadmin only
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
        <div className="size-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <WarningCircle className="size-8" />
        </div>
        <h2 className="text-lg font-semibold text-ink">Access Restricted</h2>
        <p className="text-sm text-ink-mute mt-1 max-w-sm text-center">
          Vehicle and lookup management is restricted to Superadmin accounts only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent font-semibold">
              Superadmin Settings
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent">
              <ShieldCheck className="size-3" />
              SUPER_ADMIN
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Vehicle & Lookup Settings
          </h1>
          <p className="text-sm text-ink-mute mt-0.5">
            Manage car makes (brands), models, trims (الفئات), categories (فئات الهيكل), sunroof specifications (فتحة السقف), and colors.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap p-1 bg-paper rounded-xl border border-hairline shrink-0 gap-0.5">
          <button
            onClick={() => setActiveTab('makes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'makes'
                ? 'bg-white text-ink shadow-xs font-semibold'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Car className="size-4" />
            Makes & Models
          </button>
          <button
            onClick={() => setActiveTab('trims')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'trims'
                ? 'bg-white text-ink shadow-xs font-semibold'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            <SlidersHorizontal className="size-4" />
            Trims
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-white text-ink shadow-xs font-semibold'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Shapes className="size-4" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('sunroofs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'sunroofs'
                ? 'bg-white text-ink shadow-xs font-semibold'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Sun className="size-4" />
            Sunroof Specs
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'colors'
                ? 'bg-white text-ink shadow-xs font-semibold'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Palette className="size-4" />
            Color Palette
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <VehicleSettingsOverview />

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'makes' && <BrandManagementTab />}
        {activeTab === 'trims' && <TrimManagementTab />}
        {activeTab === 'categories' && <CategoryManagementTab />}
        {activeTab === 'sunroofs' && <SunroofManagementTab />}
        {activeTab === 'colors' && <ColorManagementTab />}
      </div>
    </div>
  );
}
