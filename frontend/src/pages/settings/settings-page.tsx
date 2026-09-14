import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { truncateId } from "@/lib/format";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export function SettingsPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Console configuration"
        title="Settings"
        description="Preferences for this console instance and its API connection."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Interface theme is persisted on this device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="theme">Dark theme</Label>
                <p className="text-xs text-muted-foreground">
                  Indigo-ink rendering for evening inspection.
                </p>
              </div>
              <Switch
                id="theme"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="sidebar">Compact sidebar</Label>
                <p className="text-xs text-muted-foreground">
                  Collapse navigation to icons only.
                </p>
              </div>
              <Switch
                id="sidebar"
                checked={sidebarCollapsed}
                onCheckedChange={toggleSidebar}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection</CardTitle>
            <CardDescription>
              The API base the console is bound to.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="registry-code text-xs text-muted-foreground">API BASE URL</p>
              <p className="registry-code mt-0.5">{API_BASE}</p>
            </div>
            <div>
              <p className="registry-code text-xs text-muted-foreground">CURRENT SESSION</p>
              <p className="registry-code mt-0.5">
                {user ? truncateId(user.sub) : "none"}
              </p>
            </div>
            <p className="registry-code text-xs text-muted-foreground">
              REVIEW &#183; AUTH HEADER &#183; BEARER JWT
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}