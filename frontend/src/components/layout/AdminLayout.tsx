import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminHeader } from './AdminHeader';
import { Sidebar } from './Sidebar';

/** Protected shell: sidebar + sticky header + routed content. */
export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

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
        return {
          title: t('titles.vehicleSettings', 'Vehicle Settings'),
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
    <div className="min-h-[100dvh] bg-bone lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-col">
        <AdminHeader
          onMenu={() => setMobileOpen(true)}
          title={active.title}
          meta={active.meta}
        />
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
