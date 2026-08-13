"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { 
  Cpu, 
  Bot, 
  ChevronDown, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle 
} from "lucide-react";
import { getModelIcon, FallbackModelIcon } from "@/lib/model-icons";
import { cn } from "@/lib/utils";
import type { AgentInfo, ModelInfo } from "@/lib/api/types";
import { chatsContent } from "@/content/chats";

export type Mode = "model" | "agent";

type Props = {
  models: ModelInfo[];
  agents: AgentInfo[];

  modelValue: string;
  agentValue: string;

  onModelChange: (id: string) => void;
  onAgentChange: (id: string) => void;

  mode: Mode;
  onModeChange: (mode: Mode) => void;

  disabled?: boolean;
};

function parseModel(id: string) {
  const idx = id.indexOf("/");
  if (idx === -1) return { provider: chatsContent.chat.general, name: id };
  return { provider: id.slice(0, idx), name: id.slice(idx + 1) };
}

export function ModelAgentSelector({
  models,
  agents,
  modelValue,
  agentValue,
  onModelChange,
  onAgentChange,
  mode,
  onModeChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const groups = models.reduce<Record<string, ModelInfo[]>>((acc, m) => {
    const { provider } = parseModel(m.id);
    (acc[provider] ??= []).push(m);
    return acc;
  }, {});

  const selectedModel = models.find((m) => m.id === modelValue);
  const selectedAgent = agents.find((a) => a.id === agentValue);

  const selectedModelMeta = selectedModel ? parseModel(selectedModel.id) : null;
  const selectedModelIcon = selectedModel ? getModelIcon(selectedModel.id) : null;

  const renderStatusIcon = (status?: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />;
      case "unhealthy":
        return <AlertTriangle className="size-3.5 text-red-500 shrink-0" />;
      case "unknown":
      default:
        return <HelpCircle className="size-3.5 text-gray-400 shrink-0" />;
    }
  };

  // Hovered item for detail view: if there's not a hoveredId, use the selected value
  const detailItem = mode === "model" 
    ? models.find((m) => m.id === (hoveredId || modelValue)) || selectedModel 
    : agents.find((a) => a.id === (hoveredId || agentValue)) || selectedAgent;

  const detailMeta = detailItem ? parseModel(detailItem.id) : null;

  return (
    <div className="flex items-center justify-between w-full gap-3 pl-3">
      {/* Toggle model | agent */}
      <div className="flex items-center gap-1 rounded-full bg-muted p-1">
        <button
          onClick={() => onModeChange("model")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
            mode === "model" && "bg-primary text-primary-foreground",
          )}
        >
          <Cpu className="size-4" />
          {chatsContent.chat.model}
        </button>

        <button
          onClick={() => onModeChange("agent")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
            mode === "agent" && "bg-primary text-primary-foreground",
          )}
        >
          <Bot className="size-3.5" />
          {chatsContent.chat.agent}
        </button>
      </div>

      {/* Model selector */}
      <div className="relative" ref={ref}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((o) => !o);
            setHoveredId(null);
          }}
          className="flex min-w-[260px] items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:border-primary-400 disabled:opacity-50 transition-colors"
        >
          {mode === "model" ? (
            <>
              {selectedModelIcon ? (
                <Image
                  src={selectedModelIcon.src}
                  alt={selectedModelIcon.alt}
                  width={16}
                  height={16}
                />
              ) : (
                <FallbackModelIcon className="size-4 text-primary-700" />
              )}

              <span className="flex-1 truncate text-left">
                <span className="block truncate font-medium">
                  {selectedModelMeta?.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {selectedModelMeta?.provider}
                </span>
              </span>
            </>
          ) : (
            <>
              <Bot className="size-4" />

              <span className="flex-1 truncate">{selectedAgent?.name}</span>
            </>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <div className="absolute top-[calc(100%+8px)] right-0 z-20 flex w-[560px] overflow-hidden rounded-md border bg-popover p-2 shadow-2">
            
            {/* Left column: models list */}
            <div className="w-[280px] border-r border-border max-h-[400px] overflow-y-auto p-2">
              {mode === "model" ? (
                <>
                  {Object.entries(groups).map(([provider, items]) => (
                    <div key={provider} className="mb-2">
                      <p className="px-2 pt-2 pb-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                        {provider}
                      </p>
                      {items.map((m) => {
                        const meta = parseModel(m.id);
                        const icon = getModelIcon(m.id);
                        const isSelected = m.id === modelValue;
                        const isUnhealthy = m.status === "unhealthy";

                        return (
                          <button
                            key={m.id}
                            type="button"
                            disabled={isUnhealthy}
                            onMouseEnter={() => setHoveredId(m.id)}
                            onClick={() => {
                              onModelChange(m.id);
                              setOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors",
                              !isUnhealthy && "hover:bg-slate-50",
                              isSelected && !isUnhealthy && "bg-primary-50",
                              isUnhealthy && "cursor-not-allowed opacity-50 grayscale"
                            )}
                          >
                            {icon ? (
                            <Image
                              src={icon.src}
                              alt={icon.alt}
                              width={16}
                              height={16}
                            />
                          ) : (
                            <FallbackModelIcon className="size-4 text-primary-700" />
                          )}

                          <span className="flex-1 truncate">{meta.name}</span>

                            {renderStatusIcon(m.status)}

                            {/* Checkmark (selected model) */}
                            <div className="w-4 shrink-0 flex justify-end">
                              {isSelected && <Check className="size-3.5 text-primary-600" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              ) : (
                <div>
                  {agents.map((agent) => {
                    const isSelected = agent.id === agentValue;

                    return (
                      <button
                        key={agent.id}
                        onMouseEnter={() => setHoveredId(agent.id)}
                        onClick={() => {
                          onAgentChange(agent.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors",
                         
                          isSelected && "bg-primary-50",
    
                        )}
                      >
                        <div className="flex size-5 shrink-0 items-center justify-center rounded bg-slate-100">
                          <Bot className="size-3.5 text-primary-700" />
                        </div>

                        <span className="flex-1 truncate font-medium">{agent.name}</span>


                        <div className="w-4 shrink-0 flex justify-end">
                          {isSelected && <Check className="size-3.5 text-primary-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column: Details */}
            <div className="w-[280px] p-5 flex flex-col bg-white">
              {detailItem ? (
                <>
                  <h4 className="text-sm font-semibold text-foreground mb-0.5">
                    {mode === "model" ? detailMeta?.name : "Placeholder"}
                  </h4>
                  <p className="text-[11.5px] text-muted-foreground mb-3">
                    {mode === "model" ? detailMeta?.provider : chatsContent.chat.agent}
                  </p>
                  
                  {/* TODO: replace placeholders with real data */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                      {(detailItem as any).capabilities?.[0] || (mode === "model" ? "Text" : "Tools")}
                    </span>
                  </div>

                  <p className="text-[12.5px] text-muted-foreground leading-relaxed mb-4">
                    {(detailItem as any).description || chatsContent.selector.noDesc}
                  </p>

                  <div className="mt-auto border-t border-border pt-3 flex flex-col gap-2">
                    {mode === "model" && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{chatsContent.selector.context}</span>
                        <span className="font-medium">{(detailItem as any).context_length || chatsContent.selector.unknown}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{chatsContent.selector.status}</span>
                      <span className="font-medium capitalize">{(detailItem as any).status || chatsContent.selector.unknown}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {chatsContent.selector.choose}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
