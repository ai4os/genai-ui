"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { startChatAction } from "@/lib/actions/chats";
import { setPendingMessage } from "@/lib/pending-message";
import { chatsContent } from "@/content/chats";
import type { AgentInfo, ModelInfo, MessageTarget } from "@/lib/api/types";
import { ModelAgentSelector, type Mode } from "./model-agent-selector";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ChatContainer } from "./chat-container";

export function StartChatFormClient({
  models,
  agents,
}: {
  models: ModelInfo[];
  agents: AgentInfo[];
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("model");
  const [model, setModel] = useState(models[0]?.id);
  const [agent, setAgent] = useState(agents[0]?.id);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(chatsContent.errors.emptyMessage);
      return;
    }
    setError(null);

    const target: MessageTarget =
      mode === "agent" ? { agent_id: agent } : { model_id: model };

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("content", trimmed);
        const chat = await startChatAction(formData);
        setPendingMessage(chat.id, trimmed, target);
        router.push(`/chat/${chat.id}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : chatsContent.errors.createChat,
        );
      }
    });
  }

  function handleSuggestion(text: string) {
    setContent(text);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3 md:pr-8 md:pl-3">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
        </div>
        <ModelAgentSelector
          models={models}
          agents={agents}
          modelValue={model}
          agentValue={agent}
          onModelChange={setModel}
          onAgentChange={setAgent}
          mode={mode}
          onModeChange={setMode}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-30 items-center justify-center rounded-2xl ">
            <img src="/logos/genai.svg" alt="" className="size-25 drop-shadow-xl" />
        </div>
        <h2 className="text-lg font-semibold">
          {chatsContent.chat.emptyStateTitle}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {chatsContent.chat.emptyStateSubtitle}
        </p>
        <div className="flex max-w-lg flex-wrap justify-center gap-2">
          {chatsContent.chat.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => handleSuggestion(s)}
              className="rounded-md border px-3.5 py-2 text-xs hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <ChatContainer
        value={content}
        onChange={setContent}
        onSend={() => submit(content)}
        disabled={isPending}
        placeholder={chatsContent.chat.inputPlaceholder}
        hint={error}
        hintTone="destructive"
      />
    </div>
  );
}