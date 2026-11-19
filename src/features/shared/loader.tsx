import { cn } from "@/lib/utils"
import { feedbackContent } from "@/content/feedback"

export function PageLoader({
  label = feedbackContent.loading,
  className,
}: Readonly<{
  label?: string
  className?: string
}>) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-full flex-1 flex-col items-center justify-center gap-4 animate-in fade-in duration-500",
        className
      )}
    >
      <div className="relative size-12">
        <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}