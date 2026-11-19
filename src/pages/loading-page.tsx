import { feedbackContent } from "@/content/feedback"
import { Loader2 } from "lucide-react"

export function LoadingPage() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-svh w-full items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          GenAI Chat
        </h1>

        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />

        <p className="text-sm text-muted-foreground">{feedbackContent.loading}…</p>
      </div>
    </main>
  )
}