import { Bot, ChevronDown, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { chatsContent } from "@/content/chats";
import { sharedContent } from "@/content/shared";
import { normalizeLatexDelimiters } from "@/lib/latex";
import type { MessageFileView, MessageImage } from "@/lib/types";
import { cn } from "@/lib/utils";

import { splitSources } from "./chat-sources";
import {
  markdownComponents,
  remarkPlugins,
  rehypePlugins,
} from "./markdown-content";
import { MarkdownCode } from "./markdown-code";
import { MessageSources } from "./message-sources";
import { MessageFiles, MessageImages } from "./message-attatchments";
import { useCopyToClipboard } from "@/hooks/copy-to-clipboard";
import { FallbackModelIcon, getModelIcon } from "@/lib/model-icons";

const responseComponents = {
  a: markdownComponents.a,
  code: MarkdownCode,
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
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

export function MessageBubble({
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
  const copyToClipboard = useCopyToClipboard();

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

  const canCopy =  !isStreaming && !!displayContent;
  const handleCopy = () => copyToClipboard(displayContent.trim());

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
                    components={responseComponents}
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

          {/* Actions + timestamp */}
          <div
            className={cn(
              "absolute -bottom-8 flex items-center gap-1",
              "opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100",
              isUser ? "right-0" : "left-0",
            )}
          >
            {canCopy && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={sharedContent.copy}
                      onClick={handleCopy}
                      className="text-muted-foreground"
                    >
                      <Copy strokeWidth={1.75} />
                    </Button>
                  }
                />
                <TooltipContent>{sharedContent.copy}</TooltipContent>
              </Tooltip>
            )}
            <span className="pointer-events-none whitespace-nowrap text-[11px] text-muted-foreground">
              {formatTime(createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}