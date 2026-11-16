import { normalizeLatexDelimiters } from "@/lib/latex";
import { cn } from "cn";
import { Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins, markdownComponents } from "./markdown-content";


export function MessageSources({
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