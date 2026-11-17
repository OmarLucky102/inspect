import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
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

type VehicleSettingsSection =
  | 'makes'
  | 'trims'
  | 'categories'
  | 'sunroofs'
  | 'colors';

const VALID_SECTIONS: ReadonlySet<string> = new Set<VehicleSettingsSection>([
  'makes',
  'trims',
  'categories',
  'sunroofs',
  'colors',
]);

export function VehicleSettingsPage() {
  const { t } = useTranslation();
  const { user } = useWorkspace();
  const { tab } = useParams<{ tab?: string }>();

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

  const activeSection: VehicleSettingsSection =
    tab && VALID_SECTIONS.has(tab)
      ? (tab as VehicleSettingsSection)
      : 'makes';

  const sectionMeta: Record<
    VehicleSettingsSection,
    { label: string; icon: typeof Car }
  > = {
    makes: {
      label: t('vehicleSettings.makesAndModels', 'Makes & Models'),
      icon: Car,
    },
    trims: {
      label: t('vehicleSettings.trims', 'Vehicle Trims'),
      icon: SlidersHorizontal,
    },
    categories: {
      label: t('vehicleSettings.categories', 'Categories'),
      icon: Shapes,
    },
    sunroofs: {
      label: t('vehicleSettings.sunroofs', 'Sunroof Specs'),
      icon: Sun,
    },
    colors: {
      label: t('vehicleSettings.colorPalette', 'Color Palette'),
      icon: Palette,
    },
  };

  const CurrentIcon = sectionMeta[activeSection].icon;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t('vehicleSettings.superadminBadge', 'Superadmin Settings')}
        kickerIcon={ShieldCheck}
        badges={
          <>
            <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent">
              SUPER_ADMIN
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-paper border border-hairline px-2 py-0.5 text-[10px] font-mono font-medium text-ink-soft">
              <CurrentIcon className="size-3 text-accent" aria-hidden />
              {sectionMeta[activeSection].label}
            </span>
          </>
        }
        title={sectionMeta[activeSection].label}
        subtitle={t(
          'vehicleSettings.subtitle',
          'Manage car makes (brands), models, trims (الفئات), categories (فئات الهيكل), sunroof specifications (فتحة السقف), and colors.',
        )}
      />

      {/* Overview Stats */}
      <VehicleSettingsOverview />

      {/* Active Section Content */}
      <div>
        {activeSection === 'makes' && <BrandManagementTab />}
        {activeSection === 'trims' && <TrimManagementTab />}
        {activeSection === 'categories' && <CategoryManagementTab />}
        {activeSection === 'sunroofs' && <SunroofManagementTab />}
        {activeSection === 'colors' && <ColorManagementTab />}
      </div>
    </div>
  );
}
