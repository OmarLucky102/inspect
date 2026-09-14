import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/routes/protected-route";
import { LoginPage } from "@/pages/auth/login-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { UsersPage } from "@/pages/users/users-page";
import { UserDetailPage } from "@/pages/users/user-detail-page";
import { BanksPage } from "@/pages/banks/banks-page";
import { BankDetailPage } from "@/pages/banks/bank-detail-page";
import { RolesPage } from "@/pages/roles/roles-page";
import { ActivityPage } from "@/pages/activity/activity-page";
import { SettingsPage } from "@/pages/settings/settings-page";
import { ProfilePage } from "@/pages/settings/profile-page";
import { NotFoundPage } from "@/pages/not-found-page";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/users", element: <UsersPage /> },
          { path: "/users/:userId", element: <UserDetailPage /> },
          { path: "/banks", element: <BanksPage /> },
          { path: "/banks/:bankId", element: <BankDetailPage /> },
          { path: "/roles", element: <RolesPage /> },
          { path: "/activity", element: <ActivityPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);