import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "react-oidc-context"

export function RequireAuth() {
  const auth = useAuth()
  if (auth.isLoading) return <p className="p-4">Cargando…</p>
  if (!auth.isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}