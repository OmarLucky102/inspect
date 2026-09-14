import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarContent } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full transform transition-transform duration-200 lg:translate-x-0 lg:transition-[width] duration-200",
          collapsed && "lg:w-[4.5rem]",
          mobileOpen && "translate-x-0",
        )}
      >
        <div className="flex h-full w-full flex-col border-r border-chrome-border bg-chrome shadow-2xl shadow-black/20">
          <SidebarContent
            collapsed={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64",
        )}
      >
        <Topbar onToggleMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-border px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
            <p className="registry-code text-xs text-muted-foreground">
              Inspect &mdash; control of the institution
            </p>
            <p className="registry-code text-xs text-muted-foreground">
              Reg. entry {String(Date.now() & 0xffff).padStart(4, "0")}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}