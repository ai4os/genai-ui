import { useEffect, useRef } from "react";

interface UserBannerProps {
  eyebrow?: string;
  fullName: string;
  email: string;
  userId: string;
  userIdLabel?: string;
  circleGlowColor?: string;
}

const CIRCLES = [
  { widthPercent: 40, pulseScale: 1.1, delayMs: 0 },
  { widthPercent: 54, pulseScale: 1.08, delayMs: 900 },
  { widthPercent: 70, pulseScale: 1.06, delayMs: 1800 },
] as const;

function BannerDecorationLayer({
  circleGlowColor,
}: Readonly<{ circleGlowColor: string }>) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2]"
      aria-hidden="true"
    >
      {CIRCLES.map((circle, index) => (
        <span
          key={index}
          data-circle={index}
          data-pulse-scale={circle.pulseScale}
          data-delay={circle.delayMs}
          className="pointer-events-none absolute bottom-0 right-0 aspect-square rounded-full bg-transparent"
          style={{
            width: `${circle.widthPercent}%`,
            transform: "translate(35%, 45%)",
            boxShadow: `
              0 0 0 1px rgba(255, 255, 255, 0.45),
              0 0 40px color-mix(in srgb, ${circleGlowColor} 42%, transparent),
              0 0 90px color-mix(in srgb, ${circleGlowColor} 22%, transparent),
              inset 0 0 18px rgba(255, 255, 255, 0.16)
            `,
          }}
        />
      ))}
    </div>
  );
}

export function UserBanner({
  eyebrow = "ACCOUNT",
  fullName,
  email,
  userId,
  userIdLabel = "USER ID",
  circleGlowColor = "var(--brand-end, #ffffff)",
}: Readonly<UserBannerProps>) {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const animations: Animation[] = [];

    banner.querySelectorAll<HTMLElement>("[data-circle]").forEach((element) => {
      const pulseScale = Number(element.dataset.pulseScale ?? 1.08);
      const delay = Number(element.dataset.delay ?? 0);

      animations.push(
        element.animate(
          [
            { transform: "translate(35%, 45%) scale(1)" },
            { transform: `translate(35%, 45%) scale(${pulseScale})` },
            { transform: "translate(35%, 45%) scale(1)" },
          ],
          {
            duration: 7000,
            iterations: Infinity,
            delay,
            easing: "ease-in-out",
          },
        ),
      );
    });

    return () => {
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  return (
    <div
      ref={bannerRef}
      className="relative isolate overflow-hidden rounded-[var(--radius-lg)] px-7 py-6 text-white"
      style={{
        background: `
          radial-gradient(
            ellipse 60% 80% at 8% 15%,
            rgba(255,255,255,0.14) 0%,
            transparent 55%
          ),
          radial-gradient(
            ellipse 55% 70% at 92% 90%,
            rgba(214,222,234,0.4) 0%,
            transparent 58%
          ),
          linear-gradient(
            135deg,
            var(--brand-start) 0%,
            var(--brand-mid) 50%,
            var(--brand-end) 100%
          )
        `,
      }}
    >
      {/* Profile content */}
      <div className="relative z-[3] flex w-full min-w-0 flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* User information */}
        <div className="min-w-0">
          <h1 className="mb-1 truncate font-heading text-xl font-medium leading-tight tracking-tight text-white sm:text-2xl">
            {fullName}
          </h1>

          <p className="text-sm text-white/75">{email}</p>
        </div>

        {/* User ID */}
        <div className="shrink-0 text-left sm:text-right">
          <span className="mb-1 block text-[11px] text-white/60">
            {userIdLabel}
          </span>

          <span className="inline-block rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
            {userId}
          </span>
        </div>
      </div>

      {/* Decorative circles */}
      <BannerDecorationLayer circleGlowColor={circleGlowColor} />
    </div>
  );
}