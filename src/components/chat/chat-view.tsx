"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  MessageOut,
  DeltaEvent,
  DoneEvent,
  ErrorEvent,
} from "@/lib/api/types";
import { parseSSEStream } from "@/lib/sse";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function tempId() {
  return `temp-${crypto.randomUUID()}`;
}

function MessageBubble({
  role,
  content,
  isStreaming,
}: {
  role: string;
  content: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
          AI
        </div>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-md px-4 py-2.5 text-sm shadow-1",
          isUser
            ? "rounded-br-sm bg-primary-600 text-primary-foreground"
            : "rounded-bl-sm bg-primary-50 text-foreground",
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
      </div>
    </div>
  );
}

export function ChatView({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: MessageOut[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    const userMsgId = tempId();
    const assistantMsgId = tempId();
    const now = new Date().toISOString();
    setStreamingId(assistantMsgId);

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content, created_at: now },
      { id: assistantMsgId, role: "assistant", content: "", created_at: now },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(await res.text().catch(() => "An error occurred while processing the response"));
      }

      for await (const { event, data } of parseSSEStream<
        DeltaEvent | DoneEvent | ErrorEvent
      >(res.body)) {
        if (event === "delta") {
          const { content: chunk } = data as DeltaEvent;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        }

        if (event === "done") {
          const { message_id, created_at } = data as DoneEvent;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, id: message_id, created_at } : m,
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
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-8">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            isStreaming={m.id === streamingId}
          />
        ))}
      </div>

      <div className="sticky bottom-0 border-t bg-background px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border bg-background px-2 py-1.5 shadow-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="border-none shadow-none focus-visible:ring-0"
          />
          {sending ? (
            <Button variant="outline" size="icon" onClick={handleStop} className="rounded-full">
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
  );
}