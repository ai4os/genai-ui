"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startChatAction } from "@/lib/actions/chats";
import { setPendingMessage } from "@/lib/pending-message";
import { Button } from "@/components/ui/button";
import { chatsContent } from "@/content/chats";
import type { ModelInfo } from "@/lib/api/types";

export function StartChatFormClient({ models }: { models: ModelInfo[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    const content = (formData.get("content") as string)?.trim();
    if (!content) {
      setError(chatsContent.errors.emptyMessage);
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const chat = await startChatAction(formData);
        setPendingMessage(chat.id, content);
        router.push(`/chat/${chat.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error creating the chat");
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex w-full max-w-lg flex-col gap-3">
      <select
        name="model"
        defaultValue={models[0]?.id}
        disabled={isPending}
        className="h-9 rounded-md border bg-transparent px-2 text-sm"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id}
          </option>
        ))}
      </select>
      <textarea
        name="content"
        required
        rows={3}
        disabled={isPending}
        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "..." : chatsContent.chat.send}
      </Button>
    </form>
  );
}