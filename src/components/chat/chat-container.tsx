"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatsContent } from "@/content/chats";
import { cn } from "@/lib/utils";

type ChatContainerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** If passed together with sending=true, shows the stop button instead of send. */
  onStop?: () => void;
  /** Streaming in progress: swaps the send button for the stop button (only if onStop is provided). */
  sending?: boolean;
  /** Disables the input and button without changing style (e.g. isPending in the new chat form). */
  disabled?: boolean;
  /** Connection error blocked variant */
  blocked?: boolean;
  placeholder?: string;
  /** Optional text below the composer. */
  hint?: string | null;
  /**
   * "error": red using --color-error* tokens (connection block).
   * "destructive": normal text-destructive (validation, e.g. empty message).
   */
  hintTone?: "error" | "destructive";
};

export function ChatContainer({
  value,
  onChange,
  onSend,
  onStop,
  sending = false,
  disabled = false,
  blocked = false,
  placeholder,
  hint,
  hintTone = "destructive",
}: Readonly<ChatContainerProps>) {
  const isInputDisabled = disabled || blocked;
  const showStop = sending && !!onStop;

  return (
    <div className="border-t bg-background px-4 py-3 md:px-8">
      <div
        className={cn(
          "mx-auto flex max-w-3xl items-center gap-2 rounded-full border bg-background px-2 py-1.5 shadow-2",
          blocked &&
            "border-[var(--color-error-border)] bg-[var(--color-error-surface)]",
        )}
      >
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isInputDisabled}
          placeholder={blocked ? chatsContent.chat.blocked : placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isInputDisabled) onSend();
          }}
          className="border-none shadow-none focus-visible:ring-0 disabled:text-muted-foreground"
        />
        {showStop ? (
          <Button
            variant="outline"
            size="icon"
            onClick={onStop}
            className="rounded-full"
          >
            ■
          </Button>
        ) : (
          <Button
            size="icon"
            disabled={isInputDisabled}
            onClick={onSend}
            className="rounded-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            ↑
          </Button>
        )}
      </div>
      {hint && (
        <p
          className={cn(
            "mx-auto mt-2 max-w-3xl text-[11px]",
            hintTone === "error"
              ? "text-[var(--color-error)]"
              : "text-sm text-destructive",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}