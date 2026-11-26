import { useEffect, useRef, useState } from "react";
import { chatsContent } from "@/content/chats";
import { ModelAgentSelector, type Mode } from "./model-agent-selector";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChatComposer } from "./composer/chat-composer";
import { useChatAttachments } from "./composer/use-chat-attachments";
import { Button } from "../../components/ui/button";
import type { ModelInfo, AgentInfo, MessageTarget } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { setPendingMessage } from "@/features/chat/sending/pending-message";
import { useCreateChat } from "./api/queries";
import { MAX_ATTACHMENTS_BYTES } from "@/lib/constants";
import { useKnowledgeSelection } from "../knowledge/use-knowledge-selection";
import { useChatTarget } from "./chat-context";

export function NewChatView({
  models,
  agents,
  initialModelId,
  initialAgentId,
}: Readonly<{
  models: ModelInfo[];
  agents: AgentInfo[];
  initialModelId?: string;
  initialAgentId?: string;
}>) {
  const navigate = useNavigate();
  const createChat = useCreateChat();
  const { target: preferredTarget, setTarget } = useChatTarget();
  const isPending = createChat.isPending;

  const [content, setContent] = useState("");

  const requestedModel = initialModelId
    ? models.find((m) => m.id === initialModelId && m.status !== "unhealthy")
    : undefined;
  const requestedAgent = initialAgentId
    ? agents.find((a) => a.id === initialAgentId)
    : undefined;
  const hasRequestedTarget = Boolean(initialModelId || initialAgentId);
  const preferredModel =
    !hasRequestedTarget &&
    preferredTarget &&
    "model_id" in preferredTarget
      ? models.find(
          (m) => m.id === preferredTarget.model_id && m.status === "healthy",
        )
      : undefined;
  const preferredAgent =
    !hasRequestedTarget &&
    preferredTarget &&
    "agent_id" in preferredTarget
      ? agents.find((a) => a.id === preferredTarget.agent_id)
      : undefined;
  const [error, setError] = useState<string | null>(() =>
    (initialModelId && !requestedModel) ||
    (initialAgentId && !requestedAgent)
      ? chatsContent.errors.requestedTargetUnavailable
      : null,
  );

  const [mode, setMode] = useState<Mode>(
    requestedAgent || preferredAgent ? "agent" : "model",
  );
  const [model, setModel] = useState(
    requestedModel?.status === "healthy"
      ? requestedModel.id
      : (preferredModel?.id ??
          models.find((m) => m.id === "AI4EOSC/default")?.id ??
          models.find((m) => m.status === "healthy")?.id ??
          models[0]?.id),
  );

  const [agent, setAgent] = useState(
    requestedAgent?.id ??
      preferredAgent?.id ??
      agents.find((a) => a.name === "default")?.id ??
      agents[0]?.id,
  );
  const createdChatId = useRef<string | null>(null);

  const selectedModel =
    mode === "model" ? models.find((m) => m.id === model) : undefined;
  const selectedAgent =
    mode === "agent" ? agents.find((a) => a.id === agent) : undefined;

  // Suggestions of the selected agent; fall back to the default ones
  const customSuggestions = selectedAgent?.suggestions;
  const suggestions = customSuggestions?.length
    ? customSuggestions
    : chatsContent.chat.suggestions;

  const { setMilvusDisabled } = useKnowledgeSelection();
  const milvusUnsupported =
    selectedModel?.supports_function_calling !== true || mode === "agent";

  useEffect(() => {
    setTarget(
      mode === "agent" ? { agent_id: agent } : { model_id: model },
    );
  }, [mode, model, agent, setTarget]);

  useEffect(() => {
    setMilvusDisabled(milvusUnsupported);
    return () => setMilvusDisabled(false);
  }, [milvusUnsupported, setMilvusDisabled]);

  // Images + files
  const { images, files, clear, containerProps } = useChatAttachments(
    mode,
    selectedModel,
  );

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(chatsContent.errors.emptyMessage);
      return;
    }
    setError(null);

    const target: MessageTarget =
      mode === "agent" ? { agent_id: agent } : { model_id: model };

    try {
      if (!createdChatId.current) {
        const title =
          trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
        createdChatId.current = (await createChat.mutateAsync({ title })).id;
      }
      const chatId = createdChatId.current;
      setPendingMessage(chatId, trimmed, target, images, files);
      clear();
      navigate(`/chat/${chatId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : chatsContent.errors.createChat,
      );
    }
  }

  function handleSuggestion(text: string) {
    setContent(text);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex min-h-[72px] items-center gap-3 border-b border-border px-6 py-3">
        <SidebarTrigger />
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
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-6 py-8 text-center">
        <div
          aria-hidden="true"
          className="flex size-40 items-center justify-center rounded-full"
        >
          <img
            src="/logos/genai.svg"
            alt=""
            className="size-35 drop-shadow-xl"
          />
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">
          {chatsContent.chat.emptyStateTitle}
        </h1>
        <p className="max-w-[460px] text-[15px] leading-normal text-muted-foreground">
          {chatsContent.chat.emptyStateSubtitle}
        </p>
        <div className="mt-1.5 flex w-full max-w-[680px] flex-wrap justify-center gap-2.5">
          {suggestions.map((s) => (
            <Button
              variant="chip"
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => handleSuggestion(s)}
              className="h-auto min-h-10 max-w-full py-2 text-center leading-snug whitespace-normal"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <ChatComposer
        value={content}
        onChange={setContent}
        onSend={() => submit(content)}
        disabled={isPending}
        placeholder={chatsContent.chat.inputPlaceholder}
        hint={error}
        hintTone="destructive"
        {...containerProps}
        maxTotalBytes={MAX_ATTACHMENTS_BYTES}
      />
    </div>
  );
}
