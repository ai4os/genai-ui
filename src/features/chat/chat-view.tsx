import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { chatsContent } from "@/content/chats";
import { toolsContent } from "@/content/tools";
import { MAX_ATTACHMENTS_BYTES } from "@/lib/constants";
import type {
  AgentInfo,
  ChatImageAttachment,
  MessageFile,
  MessageFileView,
  MessageImage,
  MessageOut,
  MessageTarget,
  ModelInfo,
} from "@/lib/types";
import { useApi } from "@/lib/use-api";

import { uploadChatFiles } from "./api/chat-files";
import { ChatComposer } from "./composer/chat-composer";
import { useChatAttachments } from "./composer/use-chat-attachments";
import { ChatErrorBanner } from "./messages/chat-error-banner";
import { MessageBubble } from "./messages/message-bubble";
import { ModelAgentSelector, type Mode } from "./model-agent-selector";
import { consumePendingMessage } from "./sending/pending-message";
import {
  modelSupportsKnowledge,
  useChatStream,
} from "./sending/use-chat-stream";
import { useKnowledgeSelection } from "../knowledge/use-knowledge-selection";

function tempId() {
  return `temp-${uuidv4()}`;
}

function toImagePayload(images: ChatImageAttachment[]): MessageImage[] {
  return images.map((img) => ({
    mime_type: img.mimeType,
    data: img.dataUrl.split(",")[1] ?? img.dataUrl,
  }));
}

function toUploadingFile(file: File): MessageFileView {
  return {
    filename: file.name,
    mime_type: file.type || "application/octet-stream",
    size: file.size,
    uploading: true,
  };
}

function assistantPlaceholder(target: MessageTarget): MessageOut {
  return {
    id: tempId(),
    role: "assistant",
    content: "",
    model_id: "model_id" in target ? (target.model_id ?? null) : null,
    agent_id: "agent_id" in target ? (target.agent_id ?? null) : null,
    created_at: new Date().toISOString(),
  };
}

export function ChatView({
  chatId,
  initialMessages,
  models,
  agents,
}: Readonly<{
  chatId: string;
  initialMessages: MessageOut[];
  models: ModelInfo[];
  agents: AgentInfo[];
}>) {
  const api = useApi();
  const { selectedIds, setMilvusDisabled } = useKnowledgeSelection();

  // --- Messages and model/agent selection ---
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

  // --- Attatchments ---
  const selectedModel =
    mode === "model" ? models.find((m) => m.id === model) : undefined;
  const {
    images,
    files,
    clear: clearAttachments,
    containerProps: attachmentProps,
  } = useChatAttachments(mode, selectedModel);
  const [uploading, setUploading] = useState(false);

  // --- Knowledge ---
  const milvusUnsupported = !modelSupportsKnowledge(selectedModel);
  useEffect(() => {
    setMilvusDisabled(milvusUnsupported);
    return () => setMilvusDisabled(false);
  }, [milvusUnsupported, setMilvusDisabled]);

  // --- Streaming ---
  const { sending, streamingId, error, clearError, runStream, stop } =
    useChatStream({ chatId, models, selectedIds, setMessages });

  // --- Automatic scroll ---
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, error]);

  /**
   * Adds the user message, uploads the files (if any), and starts streaming.
   * Returns false if the upload fails so the caller can restore the draft.
   */
  const sendMessage = useCallback(
    async (
      content: string,
      target: MessageTarget,
      imageAttachments: ChatImageAttachment[] = [],
      filesToUpload: File[] = [],
    ): Promise<boolean> => {
      const userMsgId = tempId();
      const imagePayload = imageAttachments.length
        ? toImagePayload(imageAttachments)
        : undefined;

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          content,
          model_id: null,
          agent_id: null,
          images: imagePayload ?? null,
          files: filesToUpload.length
            ? filesToUpload.map(toUploadingFile)
            : null,
          created_at: new Date().toISOString(),
        },
      ]);

      // Create the conversation collection (if it doesn't exist) and upload the files
      let uploaded: MessageFile[] = [];
      if (filesToUpload.length) {
        setUploading(true);
        try {
          uploaded = await uploadChatFiles(api, chatId, filesToUpload);
        } catch (err) {
          setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
          toast.error(
            err instanceof Error
              ? err.message
              : toolsContent.milvus.toasts.uploadError,
          );
          return false;
        } finally {
          setUploading(false);
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, files: uploaded } : m)),
        );
      }

      const placeholder = assistantPlaceholder(target);
      setMessages((prev) => [...prev, placeholder]);
      await runStream(content, target, placeholder.id, imagePayload, uploaded);
      return true;
    },
    [chatId, runStream, api],
  );

  function restoreDraft(
    content: string,
    draftImages: ChatImageAttachment[],
    draftFiles: File[],
  ) {
    setInput(content);
    attachmentProps.onImagesChange(draftImages);
    attachmentProps.onFilesChange(draftFiles);
  }

  function handleRetry() {
    if (!error) return;
    const { content, target, images: errorImages, files: errorFiles } = error;
    clearError();

    const placeholder = assistantPlaceholder(target);
    setMessages((prev) => [...prev, placeholder]);
    void runStream(content, target, placeholder.id, errorImages, errorFiles);
  }

  // First message coming from /chat (see pending-message.ts)
  const hasCheckedPending = useRef(false);
  useEffect(() => {
    if (hasCheckedPending.current) return;
    hasCheckedPending.current = true;
    const pending = consumePendingMessage(chatId);
    if (!pending) return;

    startTransition(() => {
      if (pending.target.model_id) {
        setMode("model");
        setModel(pending.target.model_id);
      } else if (pending.target.agent_id) {
        setMode("agent");
        setAgent(pending.target.agent_id);
      }
    });

    const pendingImages = pending.images ?? [];
    const pendingFiles = pending.files ?? [];
    startTransition(() => {
      void sendMessage(
        pending.content,
        pending.target,
        pendingImages,
        pendingFiles,
      ).then((ok) => {
        if (!ok) restoreDraft(pending.content, pendingImages, pendingFiles);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  async function handleSend() {
    const content = input.trim();
    if (
      (!content && !images.length && !files.length) ||
      sending ||
      uploading ||
      error
    )
      return;

    const target: MessageTarget =
      mode === "agent" ? { agent_id: agent } : { model_id: model };
    const attachedImages = images;
    const attachedFiles = files;

    setInput("");
    clearAttachments();
    const ok = await sendMessage(
      content,
      target,
      attachedImages,
      attachedFiles,
    );
    if (!ok) restoreDraft(content, attachedImages, attachedFiles);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
          disabled={sending || !!error}
        />
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-8"
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            thinking={m.thinking}
            images={m.images}
            files={m.files}
            model={m.model_id}
            agentName={m.agent_id ? agentsById.get(m.agent_id) : null}
            createdAt={m.created_at}
            isStreaming={m.id === streamingId}
          />
        ))}
        {error && <ChatErrorBanner error={error} onRetry={handleRetry} />}
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onStop={stop}
        sending={sending}
        blocked={!!error}
        hint={error ? chatsContent.errors.fixConnection : null}
        hintTone="error"
        {...attachmentProps}
        disabled={uploading}
        maxTotalBytes={MAX_ATTACHMENTS_BYTES}
      />
    </div>
  );
}