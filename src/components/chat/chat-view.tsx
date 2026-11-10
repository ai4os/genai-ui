import {
  startTransition,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { parseSSEStream } from "@/lib/sse";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { normalizeLatexDelimiters } from "@/lib/latex";
import { ModelAgentSelector, type Mode } from "./model-agent-selector";
import { Bookmark, Bot, ChevronDown, Loader2, Paperclip } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ChatContainer } from "./chat-container";
import { apiContent } from "@/content/api";
import { chatsContent } from "@/content/chats";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atelierSeasideLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { v4 as uuidv4 } from "uuid";
import { useKnowledgeSelection } from "./knowledge-selection";
import { toast } from "sonner";
import { useChatAttachments } from "./use-chat-attatchments";
import { splitSources } from "@/lib/chat-sources";
import { toolsContent } from "@/content/tools";
import type {
  ChatImageAttachment,
  MessageImage,
  MessageFileView,
  MessageOut,
  ModelInfo,
  AgentInfo,
  ChatError,
  MessageTarget,
  MessageFile,
  DeltaEvent,
  DoneEvent,
  ErrorEvent,
} from "@/lib/types";
import { ApiError, apiRequest } from "@/lib/api";
import { useApi, useGetToken } from "@/lib/use-api";
import { FallbackModelIcon, getModelIcon } from "@/lib/model-icons";
import { formatFileSize, uploadChatFiles } from "@/lib/chat-files";
import { consumePendingMessage } from "@/lib/pending-message";

const markdownComponents = {
  a({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
        className="underline text-primary"
      >
        {children}
      </a>
    );
  },
};
const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

function tempId() {
  return `temp-${uuidv4()}`;
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function toImagePayload(images: ChatImageAttachment[]): MessageImage[] {
  return images.map((img) => ({
    mime_type: img.mimeType,
    data: img.dataUrl.split(",")[1] ?? img.dataUrl,
  }));
}

function ModelAvatar({ model }: Readonly<{ model?: string | null }>) {
  const icon = getModelIcon(model);

  if (icon) {
    return (
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
        <img src={icon.src} alt={icon.alt} width={28} height={28} />
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

function MessageImages({
  images,
}: Readonly<{ images?: MessageImage[] | null }>) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images?.length) return null;

  return (
    <>
      <div className="mb-2 flex flex-wrap gap-2 justify-end">
        {images.map((img, i) => {
          const src = `data:${img.mime_type};base64,${img.data}`;
          return (
            <img
              key={i}
              src={src}
              className="h-40 w-40 rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(src)}
            />
          );
        })}
      </div>

      {/* Modal to view image */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

function toUploadingFile(file: File): MessageFileView {
  return {
    filename: file.name,
    mime_type: file.type || "application/octet-stream",
    size: file.size,
    uploading: true,
  };
}

function MessageFiles({
  files,
}: Readonly<{ files?: MessageFileView[] | null }>) {
  if (!files?.length) return null;
  return (
    <div className="mb-2 flex flex-wrap justify-end gap-2">
      {files.map((f, i) => (
        <div
          key={`${f.filename}-${i}`}
          className="flex items-center gap-2.5 rounded-lg border bg-muted/40 px-3 py-2 text-xs"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
            {f.uploading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Paperclip className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex min-w-0 max-w-[160px] flex-col">
            <span className="truncate font-medium text-foreground">
              {f.filename}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {[
                f.uploading ? toolsContent.milvus.files.uploading : null,
                f.size != null ? formatFileSize(f.size) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageSources({
  label,
  text,
}: Readonly<{ label: string; text: string }>) {
  // Function to transform links [text](url): if the URL is not http/https, keep only the text
  const processedText = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, linkText, url) => {
      const isWebUrl = url.startsWith("http://") || url.startsWith("https://");
      return isWebUrl ? match : linkText;
    },
  );

  return (
    <div className="relative my-4 overflow-hidden rounded-md border border-border">
      {/* Header */}
      <div className="flex items-center justify-start gap-[0.5em] border-b border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
        <Bookmark className="size-3 shrink-0 text-primary" />
        <span className="font-semibold text-xs uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 bg-[color-mix(in_oklab,var(--primary-950)_4%,transparent)]">
        <div
          className={cn(
            "prose prose-sm max-w-none break-words text-xs dark:prose-invert",
            "prose-p:my-0 prose-p:leading-relaxed prose-li:my-0",
            "prose-a:font-medium prose-a:text-primary prose-a:underline-offset-2 hover:prose-a:text-primary/80",
          )}
        >
          <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={markdownComponents}
          >
            {normalizeLatexDelimiters(processedText)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  thinking,
  images,
  files,
  model,
  agentName,
  createdAt,
  isStreaming,
}: Readonly<{
  role: string;
  content: string;
  thinking?: string | null;
  images?: MessageImage[] | null;
  files?: MessageFileView[] | null;
  model?: string | null;
  agentName?: string | null;
  createdAt: string;
  isStreaming?: boolean;
}>) {
  const isUser = role === "user";
  const isAgent = !!agentName;

  const displayThinking = thinking || null;
  const { body: displayContent, sources } = isUser
    ? { body: content, sources: null }
    : splitSources(content);

  const isTyping = isStreaming && !displayContent && !sources;

  const hasTextContent = !!(
    displayContent ||
    sources ||
    displayThinking ||
    isTyping
  );

  return (
    <div
      className={cn(
        "group flex flex-col",
        isUser ? "items-end" : "justify-center",
      )}
    >
      {/* Images */}
      {isUser && <MessageImages images={images} />}

      {/* Files */}
      {isUser && <MessageFiles files={files} />}

      <div className={cn("flex", isUser ? "justify-end" : "flex-col")}>
        {/* Model/Agent avatar */}
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

        {/* Content */}
        <div
          className={cn(
            "relative max-w-[100%] rounded-md text-sm",
            hasTextContent ? "px-4 py-2.5" : "",
            isUser
              ? hasTextContent
                ? "rounded-br-sm bg-primary-600 text-primary-foreground shadow-1 mt-1"
                : ""
              : "text-foreground",
          )}
        >
          {/* Text */}
          {hasTextContent && (
            <div className="flex flex-col gap-2">
              {/* Thinking expansion panel */}
              {displayThinking && (
                <details className="group/details border-l-2 border-muted-foreground/30 pl-3 my-1">
                  <summary className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors list-none [&::-webkit-details-marker]:hidden">
                    {chatsContent.chat.thinking}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open/details:rotate-180" />
                  </summary>
                  <div className="mt-2 text-muted-foreground/80 prose prose-sm max-w-none prose-p:my-1 text-xs">
                    <ReactMarkdown
                      remarkPlugins={remarkPlugins}
                      rehypePlugins={rehypePlugins}
                      components={markdownComponents}
                    >
                      {normalizeLatexDelimiters(displayThinking)}
                    </ReactMarkdown>
                  </div>
                </details>
              )}

              {/* Typing indicator */}
              {isTyping && <TypingDots />}

              {/* Response */}
              {displayContent && (
                <div
                  className={cn(
                    "prose prose-sm max-w-none break-words",
                    "prose-p:leading-relaxed prose-p:my-3",
                    "prose-code:before:hidden prose-code:after:hidden",
                    "prose-a:text-primary prose-a:underline-offset-2 hover:prose-a:text-primary/80",
                    "prose-li:my-0.5",
                    "prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted",
                    "prose-td:border prose-td:border-border prose-td:p-2",
                    isUser ? "prose-invert" : "dark:prose-invert",
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={remarkPlugins}
                    rehypePlugins={rehypePlugins}
                    components={{
                      a: markdownComponents.a,
                      code({
                        className,
                        children,
                      }) {
                        const match = /language-(\w+)/.exec(className || "");
                        // code block
                        if (match) {
                          return (
                            <div className="relative mt-4 mb-4 rounded-md overflow-hidden border border-border">
                              <div className="flex items-center justify-between px-4 py-1.5 bg-muted/50 text-xs text-muted-foreground border-b border-border">
                                <span>{match[1]}</span>
                              </div>
                              <SyntaxHighlighter
                                style={atelierSeasideLight}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  margin: 0,
                                  padding: "1rem",
                                  background: "transparent",
                                }}
                                className="text-[13px]"
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        // code line
                        return (
                          <code
                            className={cn(
                              "bg-muted/60 text-foreground px-1.5 py-0.5 rounded-md font-mono text-[0.85em] border border-border/50",
                              className,
                            )}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {normalizeLatexDelimiters(displayContent)}
                  </ReactMarkdown>
                </div>
              )}

              {/* Sources */}
              {sources && (
                <MessageSources label={sources.label} text={sources.text} />
              )}
            </div>
          )}

          {/* Timestamp */}
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
    </div>
  );
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
  const getToken = useGetToken();
  const api = useApi();

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

  // Images + files
  const selectedModel =
    mode === "model" ? models.find((m) => m.id === model) : undefined;
  const {
    images,
    files,
    clear: clearAttachments,
    containerProps: attachmentProps,
  } = useChatAttachments(mode, selectedModel);
  const [uploading, setUploading] = useState(false);
  const { setMilvusDisabled } = useKnowledgeSelection();
  const milvusUnsupported =
    selectedModel?.supports_function_calling !== true || mode === "agent";

  useEffect(() => {
    setMilvusDisabled(milvusUnsupported);
    return () => setMilvusDisabled(false);
  }, [milvusUnsupported, setMilvusDisabled]);

  // Knowledge bases
  const { selectedIds } = useKnowledgeSelection();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, error]);

  const runStream = useCallback(
    async (
      content: string,
      target: MessageTarget,
      assistantMsgId: string,
      images?: MessageImage[],
      messageFiles?: MessageFile[],
    ) => {
      setSending(true);
      setStreamingId(assistantMsgId);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const targetModel =
        "model_id" in target
          ? models.find((m) => m.id === target.model_id)
          : undefined;
      const skipKnowledge = targetModel?.supports_function_calling === false;

      try {
        const token = await getToken();
        const res = await apiRequest(`/chats/${chatId}/messages`, token, {
          method: "POST",
          body: JSON.stringify({
            content,
            ...target,
            ...(images?.length ? { images } : {}),
            ...(messageFiles?.length ? { files: messageFiles } : {}),
            ...(selectedIds.size && !skipKnowledge
              ? { collection_ids: Array.from(selectedIds) }
              : {}),
          }),
          signal: controller.signal,
        });
        if (!res.body) throw new Error(apiContent.chat.processError);

        for await (const { event, data } of parseSSEStream<
          DeltaEvent | DoneEvent | ErrorEvent
        >(res.body)) {
          if (event === "delta") {
            // Get content and thinking blocks
            const { content: chunk, thinking: thinkingChunk } =
              data as DeltaEvent;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: chunk ? m.content + chunk : m.content,
                      thinking: thinkingChunk
                        ? (m.thinking || "") + thinkingChunk
                        : m.thinking,
                    }
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
            const errData = data as ErrorEvent;
            setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
            setError({
              title: apiContent.chat.responseError,
              message: errData.detail || apiContent.chat.modelError,
              content,
              target,
              images,
              files: messageFiles,
            });
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // when user stops the conversation manually
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));

          const status = err instanceof ApiError ? err.status : undefined;
          const serverMessage = err instanceof Error ? err.message : undefined;

          let title: string = apiContent.chat.connectionError;
          let message: string = apiContent.chat.checkConnection;

          if (status) {
            switch (status) {
              case 400:
                title = apiContent.general.incorrect.title;
                message = serverMessage || apiContent.general.incorrect.desc;
                break;
              case 401:
                title = apiContent.general.unauthorized.title;
                message = apiContent.general.unauthorized.desc;
                break;
              case 403:
                title = apiContent.general.forbidden.title;
                message = apiContent.general.forbidden.desc;
                break;
              case 404:
                title = apiContent.general.unfound.title;
                message = serverMessage || apiContent.general.unfound.desc;
                break;
              case 429:
                title = apiContent.general.requests.title;
                message = apiContent.general.requests.desc;
                break;
              case 500:
              case 502:
              case 503:
                title = apiContent.general.server.title + ` (${status})`;
                message = serverMessage || apiContent.general.server.desc;
                break;
              default:
                title = apiContent.general.default.title + ` (${status})`;
                message = serverMessage || apiContent.chat.checkConnection;
                break;
            }
          } else if (serverMessage) {
            // Si no hay status HTTP pero el error tiene un mensaje propio
            message = serverMessage;
          }

          setError({
            title,
            message,
            content,
            target,
            images,
            files: messageFiles,
          });
        }
      } finally {
        setSending(false);
        setStreamingId(null);
        abortRef.current = null;
      }
    },
    [chatId, getToken, selectedIds, models],
  );

  const sendMessage = useCallback(
    async (
      content: string,
      target: MessageTarget,
      images: ChatImageAttachment[] = [],
      filesToUpload: File[] = [],
    ): Promise<boolean> => {
      const userMsgId = tempId();
      const now = new Date().toISOString();
      const imagePayload = images.length ? toImagePayload(images) : undefined;

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
          created_at: now,
        },
      ]);

      // Create the conversation collection (if it does not exist) and upload the files
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

      const assistantMsgId = tempId();
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

      await runStream(content, target, assistantMsgId, imagePayload, uploaded);
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
    const { content, target, images, files } = error;
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

    runStream(content, target, assistantMsgId, images, files);
  }

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

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
            thinking={m.thinking}
            images={m.images}
            files={m.files}
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
        {...attachmentProps}
        disabled={uploading}
        maxTotalBytes={15_000_000} // 15 MB - if this variable changes, update the corresponding API variable
      />
    </div>
  );
}
