import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { AlertTriangle, ArrowLeft, BarChart3 } from "lucide-react";
import { CreditUsageCard } from "@/features/profile/credit-usage-card";
import { DangerZoneCard } from "@/features/profile/danger-zone-card";
import { profileContent as c, profileContent } from "@/content/profile";
import { cn } from "@/lib/utils";
import { UserBanner } from "@/features/profile/user-banner";
import type { UserInfo } from "@/lib/types";

const SECTIONS = [
  { id: "credits", label: c.nav.credits, icon: BarChart3, danger: false },
  { id: "danger", label: c.nav.danger, icon: AlertTriangle, danger: true },
] as const;

export default function ProfilePage() {
  const auth = useAuth();
  const [active, setActive] = useState<string>("credits");

  const profile = auth.user?.profile;
  const user: UserInfo = {
    name: profile?.name ?? profile?.preferred_username ?? "—",
    email: profile?.email ?? "—",
    uuid: profile?.sub ?? "—",
  };

  function goTo(id: string) {
    setActive(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-background">
      <header className="flex items-center gap-6 border-b px-8 py-5">
        <Link
          to="/chat"
          className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {c.backToChat}
        </Link>
        <h1 className="text-lg font-semibold">{c.title}</h1>
      </header>

      <div className="flex min-h-0 flex-1 gap-8 overflow-y-auto px-8 py-8">
        <nav className="sticky top-0 hidden h-fit w-48 shrink-0 flex-col gap-1 md:flex">
          {SECTIONS.map(({ id, label, icon: Icon, danger }) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              className={cn(
                "flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer",
                danger ? "text-destructive" : "text-foreground/80",
                active === id
                  ? danger
                    ? "bg-destructive/10"
                    : "bg-accent"
                  : "hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-3xl space-y-10">
          <UserBanner
            fullName={user.name}
            email={user.email}
            userId={user.uuid}
            userIdLabel={profileContent.userId}
          />

          <section id="credits" className="scroll-mt-4 space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{c.credits.title}</h2>
              <p className="text-sm text-muted-foreground">
                {c.credits.subtitle}
              </p>
            </div>
            <CreditUsageCard />
          </section>

          <section id="danger" className="scroll-mt-4 space-y-3 pb-8">
            <div>
              <h2 className="text-lg font-semibold text-destructive">
                {c.danger.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {c.danger.subtitle}
              </p>
            </div>
            <DangerZoneCard />
          </section>
        </main>
      </div>
    </div>
  );
}
