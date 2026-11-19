import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "react-oidc-context"
import { LoadingPage } from "@/pages/loading-page"

export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()

if (auth.isLoading) return <LoadingPage />

  if (!auth.isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location,
        }}
      />
    )
  }

  return <Outlet />
}