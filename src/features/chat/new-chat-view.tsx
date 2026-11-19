import { useEffect, useRef, useState } from "react";
import { chatsContent } from "@/content/chats";
import { ModelAgentSelector, type Mode } from "./model-agent-selector";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ChatComposer } from "./composer/chat-composer";
import { useChatAttachments } from "./composer/use-chat-attachments";
import { Button } from "../../components/ui/button";
import type { ModelInfo, AgentInfo, MessageTarget } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { setPendingMessage } from "@/features/chat/sending/pending-message";
import { useCreateChat } from "./api/queries";
import { MAX_ATTACHMENTS_BYTES } from "@/lib/constants";
import { useKnowledgeSelection } from "../knowledge/use-knowledge-selection";

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
  const isPending = createChat.isPending;

  const [content, setContent] = useState("");

  const requestedModel = initialModelId
    ? models.find((m) => m.id === initialModelId && m.status !== "unhealthy")
    : undefined;
  const requestedAgent = initialAgentId
    ? agents.find((a) => a.id === initialAgentId)
    : undefined;
  const [error, setError] = useState<string | null>(() =>
    (initialModelId && !requestedModel) ||
    (initialAgentId && !requestedAgent)
      ? chatsContent.errors.requestedTargetUnavailable
      : null,
  );

  const [mode, setMode] = useState<Mode>(requestedAgent ? "agent" : "model");
  const [model, setModel] = useState(
    requestedModel?.status === "healthy"
      ? requestedModel.id
      : (models.find((m) => m.id === "AI4EOSC/default")?.id ??
          models.find((m) => m.status === "healthy")?.id ??
          models[0]?.id),
  );

  const [agent, setAgent] = useState(
    requestedAgent?.id ??
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
        <div className="flex size-40 items-center justify-center rounded-2xl ">
          <img
            src="/logos/genai.svg"
            alt=""
            className="size-35 drop-shadow-xl"
          />
        </div>
        <h2 className="text-lg font-semibold">
          {chatsContent.chat.emptyStateTitle}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {chatsContent.chat.emptyStateSubtitle}
        </p>
        <div className="flex w-full max-w-lg flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <Button
              variant="brandLight"
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => handleSuggestion(s)}
              className="h-auto max-w-full whitespace-normal break-words rounded-md border px-3.5 py-2 text-center text-xs leading-snug hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50"
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
