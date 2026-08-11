import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { landingContent } from "@/content/landing";

export default async function LandingPage() {
  const session = await auth();

  if (session && !session.error) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-screen">
      {/* Left side panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-start via-brand-mid to-brand-end px-14 py-14 text-white lg:flex">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor="var(--brand-end)"
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor="var(--brand-end)"
                stopOpacity="0"
              />
            </radialGradient>
          </defs>

          {/* glow behind the circles */}
          <circle cx="600" cy="130" r="380" fill="url(#ringGlow)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -24,18; 0,0"
              dur="18s"
              repeatCount="indefinite"
            />
          </circle>

          <g fill="none" stroke="#FFFFFF">
            {/* circle--lg */}
            <circle cx="600" cy="130" r="330" strokeWidth="1" opacity="0.16">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; -18,24; 0,0"
                dur="16s"
                repeatCount="indefinite"
              />
            </circle>
            {/* circle--md */}
            <circle cx="600" cy="130" r="235" strokeWidth="1" opacity="0.26">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 16,-18; 0,0"
                dur="13s"
                repeatCount="indefinite"
              />
            </circle>
            {/* circle--sm */}
            <circle cx="600" cy="130" r="145" strokeWidth="1.2" opacity="0.4">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; -10,-14; 0,0"
                dur="10s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </svg>

        <div className="relative z-10">
          <h2 className="mb-4 max-w-md text-hero font-semibold leading-tight">
            {landingContent.hero.title}
          </h2>
          <p className="max-w-md text-body leading-relaxed opacity-90">
            {landingContent.hero.description}
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-3.5 border-t border-white/25 pt-5">
          <p className="max-w-lg text-caption leading-relaxed opacity-85">
            {landingContent.footer.disclaimer}{" "}
            {landingContent.footer.partners.map((partner, i) => (
              <span key={partner.href}>
                <a href={partner.href} className="underline" target="_blank">
                  {partner.label}
                </a>
                {i < landingContent.footer.partners.length - 1 ? " and " : " "}
              </span>
            ))}
          </p>
          <div className="flex flex-wrap items-center gap-5">
            {/* TODO: review missing logos */}
            <img src="/logos/eosc-arena.png" className="w-50" /> 
          </div>
        </div>
      </div>

      {/* Right side panel */}
      <div className="flex w-full items-center justify-center bg-brand-surface px-8 py-16 lg:w-[45%]">
        <form
          action={async () => {
            "use server";
            await signIn("keycloak", { redirectTo: "/chat" });
          }}
        >
          <Button type="submit" variant="brandPrimary" size="pill" className="w-full">
            {landingContent.auth.loginButton}
          </Button>
        </form>
      </div>
    </main>
  );
}
