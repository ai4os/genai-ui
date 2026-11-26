import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { Button } from "@/components/ui/button";
import { profileContent } from "@/content/profile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function UserMenu() {
  const auth = useAuth();
  const p = auth.user?.profile;
  const name = p?.name ?? p?.email ?? p?.preferred_username ?? "Usuario";
  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              to="/profile"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-[10px] p-1 -m-1 transition-colors hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-white"
            >
              <div
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/22 text-[15px] font-semibold text-white"
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                {name}
              </p>
            </Link>
          }
        />
        <TooltipContent>{profileContent.title}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={profileContent.logout}
              onClick={() => auth.signoutRedirect()}
              className="text-white hover:bg-white/12 focus-visible:outline-white"
            >
              <LogOut className="size-[18px]" strokeWidth={1.75} />
            </Button>
          }
        />
        <TooltipContent>{profileContent.logout}</TooltipContent>
      </Tooltip>
    </div>
  );
}
