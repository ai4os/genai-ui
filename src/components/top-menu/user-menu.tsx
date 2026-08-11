import { auth, signOut } from "@/auth";
import { profileContent } from "@/content/profile";

export async function UserMenu() {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email ?? "Usuario";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{name}</p>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button
            type="submit"
            className="text-[11px] text-white/55 hover:text-white/80 hover:underline"
          >
            {profileContent.logout}
          </button>
        </form>
      </div>
    </div>
  );
}