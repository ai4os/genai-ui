import { useCallback } from "react"
import { useAuth } from "react-oidc-context"
import { ApiError, apiFetch } from "@/lib/api"

export function useGetToken() {
  const auth = useAuth()
  const user = auth.user
  return useCallback(async () => {
    if (!user || user.expired) throw new ApiError(401, "Sesión caducada")
    return user.access_token
  }, [user])
}

export function useApi() {
  const getToken = useGetToken()
  return useCallback(
    async <T>(path: string, init?: RequestInit) =>
      apiFetch<T>(path, await getToken(), init),
    [getToken]
  )
}

export type Api = ReturnType<typeof useApi>