import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AuthProvider } from "react-oidc-context"
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "katex/dist/katex.min.css"
import "./index.css"
import App from "./App.tsx"

import { WebStorageStateStore } from "oidc-client-ts"
import { ApiError } from "./lib/api.ts"
import { notify } from "./lib/notify.ts"
import { Toaster } from "sonner"

const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: window.location.origin + "/",
  post_logout_redirect_uri: window.location.origin + "/",
  scope: "openid profile email",
  userStore: new WebStorageStateStore({
    store: window.localStorage,
  }),

  automaticSilentRenew: true,

  onSigninCallback: (user : any) => {
    const returnTo = user?.state?.returnTo ?? "/chat"

    const safeReturnTo =
      typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/chat"

    window.history.replaceState({}, document.title, "/")
    window.location.replace(safeReturnTo)
  },
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return
      notify.error(error)
    },
  }),
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
         <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
)