import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { useAuth } from './features/auth/auth-context'
import { BanksPage } from './routes/BanksPage'
import { ChecklistsPage } from './routes/ChecklistsPage'
import { DashboardPage } from './routes/DashboardPage'
import { LoginPage } from './routes/LoginPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { RequestsPage } from './routes/RequestsPage'
import { UsersPage } from './routes/UsersPage'

function LoginRoute() {
  const { status } = useAuth()
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="checklists" element={<ChecklistsPage />} />
        <Route path="banks" element={<BanksPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
