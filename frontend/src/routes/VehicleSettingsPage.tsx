import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Car,
  Palette,
  SlidersHorizontal,
  Shapes,
  Sun,
} from '@phosphor-icons/react';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { ErrorView } from '@/components/errors/ErrorView';
import { PageHeader } from '@/components/layout/PageHeader';
import { VehicleSettingsOverview } from '@/features/vehicle-settings/components/VehicleSettingsOverview';
import { BrandManagementTab } from '@/features/vehicle-settings/components/BrandManagementTab';
import { ColorManagementTab } from '@/features/vehicle-settings/components/ColorManagementTab';
import { TrimManagementTab } from '@/features/vehicle-settings/components/TrimManagementTab';
import { CategoryManagementTab } from '@/features/vehicle-settings/components/CategoryManagementTab';
import { SunroofManagementTab } from '@/features/vehicle-settings/components/SunroofManagementTab';

export function VehicleSettingsPage() {
  const { t } = useTranslation();
  const { user } = useWorkspace();
  const [activeTab, setActiveTab] = useState<
    'makes' | 'trims' | 'categories' | 'sunroofs' | 'colors'
  >('makes');

  // Strict role check: Superadmin only
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="py-12">
        <ErrorView
          status={403}
          title={t('errors.forbiddenTitle', 'Access Restricted')}
          message={
            t(
              'vehicleSettings.restricted',
              'Vehicle and lookup management is restricted to Superadmin accounts only.',
            )
          }
          backUrl="/"
          backLabel={t('errors.backToDashboard', 'Back to Dashboard')}
        />
      </div>
    );
  }

  const tabs: Array<{
    key: 'makes' | 'trims' | 'categories' | 'sunroofs' | 'colors';
    label: string;
    icon: typeof Car;
  }> = [
    { key: 'makes', label: t('vehicleSettings.makesAndModels', 'Makes & Models'), icon: Car },
    { key: 'trims', label: t('vehicleSettings.trims', 'Trims'), icon: SlidersHorizontal },
    { key: 'categories', label: t('vehicleSettings.categories', 'Categories'), icon: Shapes },
    { key: 'sunroofs', label: t('vehicleSettings.sunroofs', 'Sunroof Specs'), icon: Sun },
    { key: 'colors', label: t('vehicleSettings.colorPalette', 'Color Palette'), icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t('vehicleSettings.superadminBadge', 'Superadmin Settings')}
        kickerIcon={ShieldCheck}
        badges={
          <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent">
            SUPER_ADMIN
          </span>
        }
        title={t('vehicleSettings.title', 'Vehicle & Lookup Settings')}
        subtitle={t(
          'vehicleSettings.subtitle',
          'Manage car makes (brands), models, trims (الفئات), categories (فئات الهيكل), sunroof specifications (فتحة السقف), and colors.',
        )}
        actions={
          <div className="flex flex-wrap p-1 bg-paper rounded-xl border border-hairline gap-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-white text-ink shadow-xs font-semibold'
                      : 'text-ink-mute hover:text-ink'
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        }
      />

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
