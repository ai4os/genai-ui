import { useAuth } from "react-oidc-context"
import { profileContent } from "@/content/profile"

export function UserMenu() {
  const auth = useAuth()
  const p = auth.user?.profile
  const name = p?.name ?? p?.email ?? p?.preferred_username ?? "Usuario"
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{name}</p>
        <button
          type="button"
          onClick={() => auth.signoutRedirect()}
          className="text-[11px] text-white/55 hover:text-white/80 hover:underline cursor-pointer"
        >
          {profileContent.logout}
        </button>
      </div>
    </div>
  )
}