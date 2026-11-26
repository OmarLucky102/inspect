import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCdnAsset } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { AdminHeader } from './AdminHeader';
import { Sidebar } from './Sidebar';

/** Protected shell: sidebar + sticky header + routed content. */
export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('inspect_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const { t } = useTranslation();

  const updateSidebarCollapsed = (next: boolean) => {
    setSidebarCollapsed(next);
    try {
      localStorage.setItem('inspect_sidebar_collapsed', String(next));
    } catch {
      // Ignore storage errors in restricted browsing contexts
    }
  };

  const getRouteInfo = (path: string): { title: string; meta: string } => {
    switch (path) {
      case '/':
        return {
          title: t('titles.dashboard', 'Dashboard'),
          meta: t('titles.dashboardMeta'),
        };
      case '/requests':
        return {
          title: t('titles.requests', 'Requests'),
          meta: t('titles.requestsMeta', 'INSPECTION · PIPELINE'),
        };
      case '/requests/new':
        return {
          title: t('titles.newRequest', 'New Request'),
          meta: t('titles.newRequestMeta', 'INSPECTION · INTAKE'),
        };
      case '/representatives':
        return {
          title: t('titles.representatives', 'Representatives'),
          meta: t('titles.representativesMeta', 'FIELD OPERATIONS · AGENTS'),
        };
      case '/checklists':
        return {
          title: t('titles.checklists', 'Checklists'),
          meta: t('titles.checklistsMeta', 'INSPECTION · EVIDENCE'),
        };
      case '/banks':
        return {
          title: t('titles.banks', 'Banks'),
          meta: t('titles.banksMeta', 'ORGANIZATION · WORKSPACES'),
        };
      case '/vehicle-settings':
      case '/vehicle-settings/makes':
        return {
          title: t('vehicleSettings.makesAndModels', 'Makes & Models'),
          meta: t('titles.vehicleSettingsMeta', 'SYSTEM · VEHICLE LOOKUPS'),
        };
      case '/vehicle-settings/trims':
        return {
          title: t('vehicleSettings.trims', 'Vehicle Trims'),
          meta: t('titles.vehicleSettingsMeta', 'SYSTEM · VEHICLE LOOKUPS'),
        };
      case '/vehicle-settings/categories':
        return {
          title: t('vehicleSettings.categories', 'Categories'),
          meta: t('titles.vehicleSettingsMeta', 'SYSTEM · VEHICLE LOOKUPS'),
        };
      case '/vehicle-settings/sunroofs':
        return {
          title: t('vehicleSettings.sunroofs', 'Sunroof Specs'),
          meta: t('titles.vehicleSettingsMeta', 'SYSTEM · VEHICLE LOOKUPS'),
        };
      case '/vehicle-settings/colors':
        return {
          title: t('vehicleSettings.colorPalette', 'Color Palette'),
          meta: t('titles.vehicleSettingsMeta', 'SYSTEM · VEHICLE LOOKUPS'),
        };
      case '/users':
        return {
          title: t('titles.users', 'Users'),
          meta: t('titles.usersMeta', 'IDENTITY · ACCESS'),
        };
      case '/profile':
        return {
          title: t('titles.profile', 'My Profile'),
          meta: t('titles.profileMeta', 'IDENTITY · ACCOUNT'),
        };
      default:
        if (path.startsWith('/requests/')) {
          return {
            title: t('titles.requestDetails', 'Inspection Request'),
            meta: t(
              'titles.requestDetailsMeta',
              'INSPECTION · DETAILS & WORKFLOW',
            ),
          };
        }
        return {
          title: t('titles.admin', 'Admin'),
          meta: t('titles.adminMeta', 'INSPECT'),
        };
    }
  };

  const active = getRouteInfo(location.pathname);

  // Close the drawer on Escape. Route-change closing is handled by
  // SidebarBody onNavigate (link click) + overlay click.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className="glass-canvas relative min-h-[100dvh] lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[200] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg"
      >
        {t('common.skipToContent', 'Skip to main content')}
      </a>

      {/* R2 dashboard backdrop + ambient luminous mesh orbs for optical glass refraction */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <img
          src={getCdnAsset('dashboardBackground.jpg')}
          alt=""
          loading="eager"
          decoding="async"
          onLoad={() => setBgLoaded(true)}
          onError={(e) => {
            setBgLoaded(false);
            e.currentTarget.style.display = 'none';
          }}
          className={cn(
            'h-full w-full scale-[1.02] object-cover object-center transition-opacity duration-700',
            bgLoaded ? 'opacity-100' : 'opacity-0',
          )}
        />
        {/* Balanced atmospheric veil: preserves image depth for liquid-glass blur while keeping text legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#e8eef5]/35 via-[#e8eef5]/25 to-[#e8eef5]/45 dark:from-[#060a13]/48 dark:via-[#060a13]/38 dark:to-[#060a13]/58" />
        <div className="absolute -top-32 start-[12%] size-[420px] rounded-full bg-emerald-400/18 dark:bg-emerald-500/18 blur-[110px]" />
        <div className="absolute top-[22%] end-[6%] size-[380px] rounded-full bg-sky-400/18 dark:bg-sky-500/18 blur-[110px]" />
        <div className="absolute -bottom-32 start-[42%] size-[420px] rounded-full bg-indigo-400/14 dark:bg-indigo-500/16 blur-[120px]" />
        <div className="tech-grid-light absolute inset-0 opacity-25 dark:opacity-20" />
      </div>

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => updateSidebarCollapsed(!sidebarCollapsed)}
        onExpand={() => updateSidebarCollapsed(false)}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <AdminHeader
          onMenu={() => setMobileOpen(true)}
          title={active.title}
          meta={active.meta}
        />
        <main
          id="main-content"
          className="w-full flex-1 px-3 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:py-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
