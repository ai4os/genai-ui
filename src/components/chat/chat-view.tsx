"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  MessageOut,
  DeltaEvent,
  DoneEvent,
  ErrorEvent,
  ModelInfo,
  AgentInfo,
  MessageTarget,
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
import { ModelAgentSelector, type Mode } from "./model-agent-selector";
import { Bot } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ChatContainer } from "./chat-container";
import { apiContent } from "@/content/api";
import { chatsContent } from "@/content/chats";

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

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s`, animationDuration: "1.2s" }}
        />
      ))}
    </span>
  );
}

function MessageBubble({
  role,
  content,
  model,
  agentName,
  createdAt,
  isStreaming,
}: {
  role: string;
  content: string;
  model?: string | null;
  agentName?: string | null;
  createdAt: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";
  const isAgent = !!agentName;
  const isTyping = isStreaming && content.length === 0;

  return (
    <div
      className={cn(
        "group flex",
        isUser ? "justify-end" : "flex-col justify-center",
      )}
    >
      {!isUser && (
        <div className="flex items-center">
          {isAgent ? (
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-700">
              <Bot className="size-4" />
            </div>
          ) : (
            <ModelAvatar model={model} />
          )}
          <span className="pl-4 text-xs text-muted-foreground">
            {isAgent ? agentName : model}
          </span>
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
        {isTyping ? (
          <TypingDots />
        ) : (
          <>
            <div
              className={cn(
                "prose prose-sm max-w-none",
                "prose-p:my-1.5 prose-pre:my-2 prose-headings:my-2",
                isUser ? "prose-invert" : "dark:prose-invert",
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </>
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

type ChatError = {
  title: string;
  message: string;
  content: string;
  target: MessageTarget;
};

export function ChatView({
  chatId,
  initialMessages,
  models,
  agents,
}: {
  chatId: string;
  initialMessages: MessageOut[];
  models: ModelInfo[];
  agents: AgentInfo[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const lastAssistantMsg = initialMessages.findLast(
    (m) => m.role === "assistant",
  );
  const [model, setModel] = useState(
    lastAssistantMsg?.model_id ?? models[0]?.id,
  );
  const [agent, setAgent] = useState(
    lastAssistantMsg?.agent_id ?? agents[0]?.id,
  );
  const [mode, setMode] = useState<Mode>(
    lastAssistantMsg?.agent_id ? "agent" : "model",
  );
  const agentsById = new Map(agents.map((a) => [a.id, a.name]));
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasCheckedPending = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, error]);

  const runStream = useCallback(
    async (content: string, target: MessageTarget, assistantMsgId: string) => {
      setSending(true);
      setStreamingId(assistantMsgId);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, ...target }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(
            await res.text().catch(() => apiContent.chat.processError),
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
            const { message_id, created_at, model_id, agent_id } =
              data as DoneEvent;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      id: message_id,
                      created_at,
                      model_id: model_id ?? m.model_id,
                      agent_id: agent_id ?? m.agent_id,
                    }
                  : m,
              ),
            );
          }
          if (event === "error") {
            const errData = data as ErrorEvent & { message?: string };
            setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
            setError({
              title: apiContent.chat.responseError,
              message: errData?.message ?? apiContent.chat.modelError,
              content,
              target,
            });
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // when user stops the conversation manually
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
          setError({
            title: apiContent.chat.connectionError,
            message: apiContent.chat.checkConnection,
            content,
            target,
          });
        }
      } finally {
        setSending(false);
        setStreamingId(null);
        abortRef.current = null;
      }
    },
    [chatId],
  );

  const sendMessage = useCallback(
    async (content: string, target: MessageTarget) => {
      const userMsgId = tempId();
      const assistantMsgId = tempId();
      const now = new Date().toISOString();

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          content,
          model_id: null,
          agent_id: null,
          created_at: now,
        },
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          model_id: "model_id" in target ? (target.model_id ?? null) : null,
          agent_id: "agent_id" in target ? (target.agent_id ?? null) : null,
          created_at: now,
        },
      ]);

      await runStream(content, target, assistantMsgId);
    },
    [runStream],
  );

  function handleRetry() {
    if (!error) return;
    const { content, target } = error;
    setError(null);

    const assistantMsgId = tempId();
    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        model_id: "model_id" in target ? (target.model_id ?? null) : null,
        agent_id: "agent_id" in target ? (target.agent_id ?? null) : null,
        created_at: now,
      },
    ]);

    runStream(content, target, assistantMsgId);
  }

  useEffect(() => {
    if (hasCheckedPending.current) return;
    hasCheckedPending.current = true;
    const pending = consumePendingMessage(chatId);
    if (!pending) return;

    if (pending.target.model_id) {
      setMode("model");
      setModel(pending.target.model_id);
    } else if (pending.target.agent_id) {
      setMode("agent");
      setAgent(pending.target.agent_id);
    }

    sendMessage(pending.content, pending.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending || error) return;
    setInput("");
    const target: MessageTarget =
      mode === "agent" ? { agent_id: agent } : { model_id: model };
    await sendMessage(content, target);
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3 md:px-8 gap-2">
        <div className="flex items-center gap-2 pr-[0.5em]">
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
          disabled={sending || !!error}
        />
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-8"
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            model={m.model_id}
            agentName={m.agent_id ? agentsById.get(m.agent_id) : null}
            createdAt={m.created_at}
            isStreaming={m.id === streamingId}
          />
        ))}

        {error && (
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
                onClick={handleRetry}
                className="shrink-0 border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white"
              >
                {chatsContent.chat.retry}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ChatContainer
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onStop={handleStop}
        sending={sending}
        blocked={!!error}
        hint={error ? chatsContent.errors.fixConnection : null}
        hintTone="error"
      />
    </div>
  );
}
