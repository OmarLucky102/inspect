import { NavLink } from "react-router-dom";
import {
  Activity,
  Landmark,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GuillocheRosette } from "@/components/brand/guilloche";
import { Wordmark } from "@/components/brand/wordmark";
import { useAuthStore } from "@/stores/auth.store";
import { roleLabel } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/users", label: "Users", icon: Users },
  { to: "/banks", label: "Banks", icon: Landmark },
  { to: "/roles", label: "Roles", icon: Shield },
  { to: "/activity", label: "Activity", icon: Activity },
];

interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
          collapsed && "lg:justify-center lg:px-0",
          isActive
            ? "bg-chrome-active text-white"
            : "text-chrome-foreground hover:bg-chrome-active/50 hover:text-white",
        )
      }
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="hidden lg:block">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarContent({
  collapsed,
  onNavigate,
}: SidebarContentProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-20 items-center gap-3 border-b border-chrome-border px-4", collapsed && "lg:justify-center lg:px-0")}>
        {collapsed ? (
          <GuillocheRosette size={40} className="text-brass" />
        ) : (
          <>
            <GuillocheRosette size={40} className="shrink-0 text-brass" />
            <Wordmark tone="chrome" className="min-w-0" />
          </>
        )}
      </div>

      <nav className={cn("flex flex-1 flex-col gap-1 overflow-y-auto p-4", collapsed && "lg:p-3")}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        <div className="my-3 h-px bg-chrome-border" />

        <SidebarLink
          item={{ to: "/settings", label: "Settings", icon: Settings }}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="border-t border-chrome-border p-4">
        <div className={cn("flex items-center gap-3", collapsed && "lg:justify-center")}>
          <Avatar className="h-9 w-9 border-chrome-border">
            <AvatarFallback className="bg-chrome-active text-white">
              {(user?.email ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.email}
              </p>
              <p className="eyebrow text-[0.55rem] text-chrome-muted">
                {user ? roleLabel(user.role) : ""}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="rounded-md p-2 text-chrome-muted transition-colors hover:bg-chrome-active hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}