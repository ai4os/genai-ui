"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  MessageOut,
  DeltaEvent,
  DoneEvent,
  ErrorEvent,
  ModelInfo,
} from "@/lib/api/types";
import { parseSSEStream } from "@/lib/sse";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { consumePendingMessage } from "@/lib/pending-message";

function tempId() {
  return `temp-${crypto.randomUUID()}`;
}

import Image from "next/image";
import { getModelIcon, FallbackModelIcon } from "@/lib/model-icons";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function ModelAvatar({ model }: { model?: string | null }) {
  const icon = getModelIcon(model);

  if (icon) {
    return (
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
        <Image src={icon.src} alt={icon.alt} width={28} height={28} />
      </div>
    );
  }

  return (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-700">
      <FallbackModelIcon className="size-4" />
    </div>
  );
}

function MessageBubble({
  role,
  content,
  model,
  createdAt,
  isStreaming,
}: {
  role: string;
  content: string;
  model?: string | null;
  createdAt: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={cn("group flex", isUser ? "justify-end" : "flex-col justify-center")}>
      {!isUser && (
        <div className="flex items-center">
          <ModelAvatar model={model} />
          <span className="pl-4 text-xs text-muted-foreground">{model}</span>
        </div>
      )}
      <div
        className={cn(
          "relative max-w-[100%] rounded-md px-4 py-2.5 text-sm",
          isUser
            ? "rounded-br-sm bg-primary-600 text-primary-foreground shadow-1"
            : "text-foreground",
        )}
      >
        <div
          className={cn(
            "prose prose-sm max-w-none",
            "prose-p:my-1.5 prose-pre:my-2 prose-headings:my-2",
            isUser ? "prose-invert" : "dark:prose-invert",
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {isStreaming && (
          <span className="ml-0.5 inline-block animate-pulse text-secondary-600">▍</span>
        )}
        <span
          className={cn(
            "pointer-events-none absolute -bottom-5 whitespace-nowrap text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
            isUser ? "right-0" : "left-0",
          )}
        >
          {formatTime(createdAt)}
        </span>
      </div>
    </div>
  );
}

export function ChatView({
  chatId,
  initialMessages,
  models,
}: {
  chatId: string;
  initialMessages: MessageOut[];
  models: ModelInfo[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    initialMessages.findLast((m) => m.role === "assistant")?.model ??
      models[0]?.id,
  );
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasCheckedPending = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, model: string) => {
      setSending(true);

      const userMsgId = tempId();
      const assistantMsgId = tempId();
      const now = new Date().toISOString();
      setStreamingId(assistantMsgId);

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content, model: null, created_at: now },
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          model,
          created_at: now,
        },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, model }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(
            await res
              .text()
              .catch(() => "An error occurred while processing the response"),
          );
        }

        for await (const { event, data } of parseSSEStream<
          DeltaEvent | DoneEvent | ErrorEvent
        >(res.body)) {
          if (event === "delta") {
            const { content: chunk } = data as DeltaEvent;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + chunk }
                  : m,
              ),
            );
          }
          if (event === "done") {
            const { message_id, created_at } = data as DoneEvent;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, id: message_id, created_at }
                  : m,
              ),
            );
          }
          if (event === "error") {
            const { detail } = data as ErrorEvent;
            console.error("Stream error:", detail);
            setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
        }
      } finally {
        setSending(false);
        setStreamingId(null);
        abortRef.current = null;
      }
    },
    [chatId],
  );

  // On mount: if coming from StartChatForm, there is a pending first message
  // saved in sessionStorage. We consume it and trigger the streaming.
  useEffect(() => {
    if (hasCheckedPending.current) return;
    hasCheckedPending.current = true;
    const pending = consumePendingMessage(chatId);
    if (pending) sendMessage(pending, selectedModel);
  }, [chatId]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    await sendMessage(content, selectedModel);
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-8"
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            model={m.model}
            createdAt={m.created_at}  
            isStreaming={m.id === streamingId}         />
        ))}
      </div>

      <div className="border-t bg-background px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border bg-background px-2 py-1.5 shadow-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={sending}
            className="h-7 w-fit rounded-md border bg-transparent px-2 text-xs text-muted-foreground"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 rounded-full border bg-background px-2 py-1.5 shadow-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="border-none shadow-none focus-visible:ring-0"
            />
            {sending ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleStop}
                className="rounded-full"
              >
                ■
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                className="rounded-full bg-primary-600 hover:bg-primary-700"
              >
                ↑
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
