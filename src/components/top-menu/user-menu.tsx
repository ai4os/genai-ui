import { auth, signOut } from "@/auth";

export async function UserMenu() {
  const session = await auth();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">
        {session?.user?.name ?? session?.user?.email}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="text-sm text-muted-foreground underline"
        >
          Log out
        </button>
      </form>
    </div>
  );
}