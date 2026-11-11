import { chatsContent } from "@/content/chats";
import { splitSources } from "@/features/chat/messages/chat-sources";
import { normalizeLatexDelimiters } from "@/lib/latex";
import type { MessageImage, MessageFileView } from "@/lib/types";
import { cn } from "cn";
import { Bot, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atelierSeasideLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { MessageSources } from "./message-sources";
import {
  markdownComponents,
  rehypePlugins,
  remarkPlugins,
} from "./markdown-content";
import { MessageImages, MessageFiles } from "./message-attatchments";
import { FallbackModelIcon, getModelIcon } from "@/lib/model-icons";

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
                      code({ className, children }) {
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
