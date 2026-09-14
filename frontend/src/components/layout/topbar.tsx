import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/common/badges";
import { roleLabel } from "@/lib/format";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/users": "Users",
  "/banks": "Banks",
  "/roles": "Roles",
  "/activity": "Activity",
  "/settings": "Settings",
};

function topbarTitle(pathname: string): string {
  if (pathname.startsWith("/users/")) return "Person record";
  if (pathname.startsWith("/banks/")) return "Bank record";
  return TITLES[pathname] ?? "Inspect";
}

interface TopbarProps {
  onToggleMobile: () => void;
}

export function Topbar({ onToggleMobile }: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleMobile}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="registry-code text-muted-foreground">
          {topbarTitle(location.pathname)}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user && (
          <div className="hidden sm:block">
            <RoleBadge role={user.role} />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-verdigris text-primary-foreground">
                  {(user?.email ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="truncate font-medium">{user?.email}</span>
                <span className="registry-code text-xs text-muted-foreground">
                  {user ? roleLabel(user.role) : ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/profile">
                <UserRound /> Profile
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/settings">
                <Settings /> Settings
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}