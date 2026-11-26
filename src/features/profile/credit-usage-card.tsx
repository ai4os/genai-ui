import { profileContent } from "@/content/profile";
import { useCreditUsage } from "./api/queries";
import { CircleAlert } from "lucide-react";
import { feedbackContent } from "@/content/feedback";
import { Skeleton } from "@/components/ui/skeleton";

const c = profileContent.credits;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const money = (n: number) => n.toFixed(2);

export function CreditUsageCard() {
  const { data, isPending, error } = useCreditUsage();

  if (isPending) {
    return (
      <Skeleton className="h-44 animate-pulse rounded-2xl border bg-muted/40" />
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="h-44 rounded-2xl border flex flex-col items-center gap-4 border-error-border bg-error-surface p-8 text-center shadow-1"
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-error/10 text-error">
          <CircleAlert className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            {feedbackContent.errors.default.title}
          </h2>
          <p className="text-sm text-muted-foreground">{c.loadError}</p>
        </div>
      </div>
    );
  }

  const { spend, budget, remaining, usage_percentage, budget_reset_at } = data;
  const hasLimit = budget !== null && budget > 0;

  return (
    <div className="rounded-2xl border bg-card p-6">
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight">
          {money(spend)}
        </span>
        <span className="text-sm text-muted-foreground">
          {hasLimit ? `${c.of} ${money(budget)}$` : c.unlimited}
        </span>
      </p>

      {hasLimit && (
        <div
          role="progressbar"
          aria-valuenow={
            usage_percentage === null ? undefined : usage_percentage
          }
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${usage_percentage ?? 0}%`,
            }}
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {hasLimit
            ? `${usage_percentage}% ${c.usedPercent} · ${money(remaining!)}$ ${c.remaining}`
            : ""}
        </span>
        <span>
          {c.resetsOn} {formatDate(budget_reset_at)}
        </span>
      </div>
    </div>
  );
}
