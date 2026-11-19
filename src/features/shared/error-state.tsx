import { CircleAlert, RefreshCw } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { describeApiError } from "@/lib/api-errors"
import { feedbackContent } from "@/content/feedback"

export function ErrorState({
  error,
  onRetry,
  children,
}: Readonly<{
  error: unknown
  onRetry?: () => void
  children?: ReactNode
}>) {
  const { title, message } = describeApiError(error)

  return (
    <div role="alert" className="flex h-full flex-1 items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-md border border-error-border bg-error-surface p-8 text-center shadow-1">
        <div className="flex size-11 items-center justify-center rounded-full bg-error/10 text-error">
          <CircleAlert className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {(onRetry || children) && (
          <div className="flex flex-wrap justify-center gap-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="size-4" />
                {feedbackContent.retry}
              </Button>
            )}
            {children}
          </div>
        )}
      </div>
    </div>
  )
}