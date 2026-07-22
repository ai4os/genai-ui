import { auth, signOut } from "@/auth";
import { Button } from "../ui/button";

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
        <Button
          type="submit"
          className="text-sm underline"
        >
          Log out
        </Button>
      </form>
    </div>
  );
}