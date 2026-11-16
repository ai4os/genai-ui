import { Button } from "@/components/ui/button";
import { chatsContent } from "@/content/chats";
import type { ChatError } from "@/lib/types";

export function ChatErrorBanner({
  error,
  onRetry,
}: Readonly<{ error: ChatError; onRetry: () => void }>) {
  return (
    <div className="flex justify-center pt-1">
      <div className="flex max-w-lg items-center gap-3 rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-surface)] px-4 py-3 text-sm text-[var(--color-error)]">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-error-border)] text-xs font-semibold">
          !
        </div>
        <div className="flex-1">
          <p className="font-semibold">{error.title}</p>
          <p className="text-[var(--color-error)]/90">{error.message}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white"
        >
          {chatsContent.chat.retry}
        </Button>
      </div>
    </div>
  );
}