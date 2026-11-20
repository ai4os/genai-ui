import type { ComponentPropsWithoutRef } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks/copy-to-clipboard";
import { sharedContent } from "@/content/shared";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atelierSeasideLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

function CodeBlock({ language, code }: Readonly<{ language: string; code: string }>) {
  const copyToClipboard = useCopyToClipboard();

  return (
    <div className="relative my-4 overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 py-1 pl-4 pr-1 text-xs text-muted-foreground">
        <span>{language}</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={sharedContent.copy}
                onClick={() => copyToClipboard(code)}
                className="text-muted-foreground"
              >
                <Copy strokeWidth={1.75} />
              </Button>
            }
          />
          <TooltipContent>{sharedContent.copy}</TooltipContent>
        </Tooltip>
      </div>
      <SyntaxHighlighter
        style={atelierSeasideLight}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: "1rem", background: "transparent" }}
        className="text-[13px]"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function MarkdownCode({
  className,
  children,
}: Readonly<ComponentPropsWithoutRef<"code">>) {
  const match = /language-(\w+)/.exec(className || "");

  // Code block
  if (match) {
    return (
      <CodeBlock
        language={match[1]}
        code={String(children).replace(/\n$/, "")}
      />
    );
  }

  // Code line
  return (
    <code
      className={cn(
        "rounded-md border border-border/50 bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground",
        className,
      )}
    >
      {children}
    </code>
  );
}