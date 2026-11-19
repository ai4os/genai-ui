import { Button } from "@/components/ui/button";
import { chatsContent } from "@/content/chats";
import type { ChatError } from "@/lib/types";

export function ChatErrorBanner({
  error,
  onRetry,
}: Readonly<{ error: ChatError; onRetry: () => void }>) {
  return (
    <div className="flex justify-center pt-1">
      <div
        role="alert"
        className="flex max-w-lg items-center gap-3 rounded-md border border-error-border bg-error-surface px-4 py-3 text-sm text-error"
      >
        <div
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-error-border text-xs font-semibold"
        >
          !
        </div>
        <div className="flex-1">
          <p className="font-semibold">{error.title}</p>
          <p>{error.message}</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onRetry}
          className="shrink-0"
        >
          {chatsContent.chat.retry}
        </Button>
      </div>
    </div>
  );
}
