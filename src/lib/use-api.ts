import { useCallback } from "react"
import { useAuth } from "react-oidc-context"
import { ApiError, apiFetch } from "@/lib/api"

export function useGetToken() {
  const auth = useAuth()

  return useCallback(async () => {
    let user = auth.user

    if (!user || user.expired) {
      try {
        user = await auth.signinSilent()
      } catch {
        await auth.signoutRedirect()
        throw new ApiError(401, "Expired session")
      }
    }

    if (!user || user.expired) {
      await auth.signoutRedirect()
      throw new ApiError(401, "Expired session")
    }

    return user.access_token
  }, [auth.user, auth.signinSilent, auth.signoutRedirect])
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