import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Cpu,
  Bot,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
  Brain,
  Wrench,
  CircleDashed,
  Rocket,
  CircleCheck,
  CircleDashedCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatsContent } from "@/content/chats";
import { FallbackModelIcon, getModelIcon } from "@/lib/model-icons";
import type { ModelInfo, AgentInfo } from "@/lib/types";

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

function formatContextLength(tokens?: number) {
  if (!tokens) return chatsContent.selector.unknown;
  if (tokens >= 1000) {
    return `${(tokens / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}K`;
  }
  return tokens.toLocaleString();
}

function formatCost(costPerMillion?: number) {
  if (costPerMillion === undefined || costPerMillion === null) {
    return chatsContent.selector.unknown;
  }
  return `$${costPerMillion.toFixed(2)}`;
}

const MODEL_CAPABILITIES = [
  { key: "supports_vision" as const, icon: Eye },
  { key: "supports_reasoning" as const, icon: Brain },
  { key: "supports_function_calling" as const, icon: Wrench },
];

type DevStatus = "alpha" | "beta" | "prod" | "unknown";

const AGENT_DEV_STATUS: Record<
  DevStatus,
  { icon: typeof Rocket; color: string }
> = {
  alpha: { icon: CircleDashed, color: "text-purple-500" },
  beta: { icon: CircleDashedCheck, color: "text-orange-500" },
  prod: { icon: CircleCheck, color: "text-green-500" },
  unknown: { icon: HelpCircle, color: "text-gray-400" },
};

function normalizeDevStatus(status?: string): DevStatus {
  const value = status?.toLowerCase();
  return value === "alpha" || value === "beta" || value === "prod"
    ? value
    : "unknown";
}

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
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>();

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const margin = 12;
      const rect = trigger.getBoundingClientRect();
      const viewportW = document.documentElement.clientWidth;
      const viewportH = window.innerHeight;

      const width = Math.min(560, viewportW - margin * 2);

      const left = Math.min(
        Math.max(rect.right - width, margin),
        viewportW - width - margin,
      );

      const top = rect.bottom + 8;
      const available = viewportH - top - margin;

      setPopoverStyle({
        top,
        left,
        width,
        maxHeight: Math.max(160, Math.min(440, available)),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

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
  const selectedModelIcon = selectedModel
    ? getModelIcon(selectedModel.id)
    : null;

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

  const renderDevStatusIcon = (status?: string) => {
    const { icon: Icon, color } = AGENT_DEV_STATUS[normalizeDevStatus(status)];
    return <Icon className={cn("size-3.5 shrink-0", color)} />;
  };

  // Hovered item for detail view: if there's not a hoveredId, use the selected value
  const detailItem =
    mode === "model"
      ? models.find((m) => m.id === (hoveredId || modelValue)) || selectedModel
      : agents.find((a) => a.id === (hoveredId || agentValue)) || selectedAgent;

  const detailMeta = detailItem ? parseModel(detailItem.id) : null;

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      {/* Toggle model | agent */}
      <div
        role="group"
        aria-label={`${chatsContent.chat.model} / ${chatsContent.chat.agent}`}
        className="inline-flex gap-0.5 rounded-full bg-muted p-1"
      >
        <button
          type="button"
          aria-pressed={mode === "model"}
          onClick={() => onModeChange("model")}
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            mode === "model" && "bg-primary text-primary-foreground",
          )}
        >
          <Cpu className="size-4" strokeWidth={1.75} />
          {chatsContent.chat.model}
        </button>

        <button
          type="button"
          aria-pressed={mode === "agent"}
          onClick={() => onModeChange("agent")}
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            mode === "agent" && "bg-primary text-primary-foreground",
          )}
        >
          <Bot className="size-4" strokeWidth={1.75} />
          {chatsContent.chat.agent}
        </button>
      </div>

      {/* Model / Agent selector */}
      <div className="relative min-w-0" ref={ref}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
            setHoveredId(null);
          }}
          className="flex h-11 max-w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-full border border-control bg-background px-4 text-sm font-medium text-foreground outline-none transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled disabled:text-disabled-foreground sm:min-w-[300px]"
        >
          {mode === "model" ? (
            <>
              {selectedModelIcon ? (
                <img
                  src={selectedModelIcon.src}
                  alt={selectedModelIcon.alt}
                  width={18}
                  height={18}
                />
              ) : (
                <FallbackModelIcon className="size-[18px] text-primary" />
              )}

              <span className="flex-1 truncate text-left">
                {selectedModelMeta?.name}
              </span>
              {selectedModelMeta?.provider && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {selectedModelMeta.provider}
                </span>
              )}
            </>
          ) : (
            <>
              <Bot className="size-[18px]" strokeWidth={1.75} />

              <span className="flex-1 truncate text-left">
                {selectedAgent?.name}
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {chatsContent.chat.agent}
              </span>
            </>
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        </button>

        {open && (
          <div
            style={popoverStyle}
            className="fixed z-50 flex flex-col overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-menu sm:flex-row sm:overflow-hidden"
          >
            {/* Left column: models list */}
            <div className="max-h-52 overflow-y-auto border-b border-border p-2 sm:max-h-none sm:w-1/2 sm:border-r sm:border-b-0">
              {mode === "model" ? (
                <>
                  {Object.entries(groups).map(([provider, items]) => (
                    <div key={provider} className="mb-2">
                      <p className="px-2 pt-2 pb-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
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
                            aria-disabled={isUnhealthy}
                            onMouseEnter={() => setHoveredId(m.id)}
                            onClick={(e) => {
                              if (isUnhealthy) {
                                e.preventDefault();
                                return;
                              }
                              onModelChange(m.id);
                              setOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-sm transition-colors cursor-pointer",
                              !isUnhealthy && "hover:bg-soft",
                              isSelected && !isUnhealthy && "bg-primary-50",
                              isUnhealthy &&
                                "cursor-not-allowed opacity-50 grayscale",
                            )}
                          >
                            {icon ? (
                              <img
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
                              {isSelected && (
                                <Check className="size-3.5 text-primary-600" />
                              )}
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
                        type="button"
                        key={agent.id}
                        onMouseEnter={() => setHoveredId(agent.id)}
                        onClick={() => {
                          onAgentChange(agent.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-sm transition-colors cursor-pointer hover:bg-soft",

                          isSelected && "bg-primary-50 hover:bg-primary-50",
                        )}
                      >
                        <div className="flex size-5 shrink-0 items-center justify-center rounded bg-muted">
                          <Bot className="size-3.5 text-primary-700" />
                        </div>

                        <span className="flex-1 truncate font-medium">
                          {agent.name}
                        </span>

                        {renderDevStatusIcon(agent.dev_status)}

                        <div className="w-4 shrink-0 flex justify-end">
                          {isSelected && (
                            <Check className="size-3.5 text-primary-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column: Details */}
            <div className="flex flex-col rounded-[10px] bg-popover p-5 sm:w-1/2 sm:overflow-y-auto">
              {detailItem ? (
                <>
                  <h4 className="text-sm font-semibold text-foreground mb-0.5">
                    {mode === "model"
                      ? detailMeta?.name
                      : (detailItem as AgentInfo).name}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3 uppercase">
                    {/* TODO: cambiar chatsContent.chat.agent cuando estén los providers  */}
                    {mode === "model"
                      ? detailMeta?.provider
                      : chatsContent.chat.agent}
                  </p>

                  {mode === "model" ? (
                    <>
                      {/* Capability badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {MODEL_CAPABILITIES.filter(
                          (c) => (detailItem as ModelInfo)[c.key],
                        ).map((c) => (
                          <span
                            key={c.key}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium"
                          >
                            <c.icon className="size-3" />
                            {chatsContent.selector.capabilities[c.key]}
                          </span>
                        ))}
                        {MODEL_CAPABILITIES.every(
                          (c) => !(detailItem as ModelInfo)[c.key],
                        ) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {chatsContent.selector.textOnly}
                          </span>
                        )}
                      </div>

                      {/* Bottom info */}
                      <div className="mt-auto border-t border-border pt-3 flex flex-col gap-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {chatsContent.selector.maxInputTokens}
                          </span>
                          <span className="font-medium">
                            {formatContextLength(
                              (detailItem as ModelInfo).max_input_tokens,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {chatsContent.selector.inputCost}
                          </span>
                          <span className="font-medium">
                            {formatCost(
                              (detailItem as ModelInfo).input_cost_per_million,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {chatsContent.selector.outputCost}
                          </span>
                          <span className="font-medium">
                            {formatCost(
                              (detailItem as ModelInfo).output_cost_per_million,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {chatsContent.selector.status}
                          </span>
                          <span className="font-medium capitalize">
                            {(detailItem as ModelInfo).status ||
                              chatsContent.selector.unknown}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Skill badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(detailItem as AgentInfo).skills?.length ? (
                          (detailItem as AgentInfo).skills!.map((skill) => (
                            <span
                              key={skill.name}
                              className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium"
                            >
                              {skill.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                            {chatsContent.chat.agent}
                          </span>
                        )}
                      </div>

                      <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                        {(detailItem as AgentInfo).description ||
                          chatsContent.selector.noDesc}
                      </p>

                      {/* Bottom info */}
                      <div className="mt-auto border-t border-border pt-3 flex flex-col gap-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {chatsContent.selector.inputCost}
                          </span>
                          <span className="font-medium">
                            {formatCost(
                              (detailItem as AgentInfo).input_cost_per_million,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {chatsContent.selector.outputCost}
                          </span>
                          <span className="font-medium">
                            {formatCost(
                              (detailItem as AgentInfo).output_cost_per_million,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            {chatsContent.selector.devStatus}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium capitalize">
                            {(detailItem as AgentInfo).dev_status}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
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
