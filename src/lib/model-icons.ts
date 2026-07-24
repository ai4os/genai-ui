import { Sparkles } from "lucide-react";

type ModelIconEntry = {
  match: RegExp;
  src: string;
  alt: string;
};

const MODEL_ICONS: ModelIconEntry[] = [
  { match: /qwen/i, src: "/models/qwen.svg", alt: "Qwen" },
  { match: /mistralai/i, src: "/models/mistral.svg", alt: "Mistral" },
  { match: /google/i, src: "/models/gemma.svg", alt: "Gemma" },
];

export function getModelIcon(modelId?: string | null) {
  if (!modelId) return null;
  return MODEL_ICONS.find((entry) => entry.match.test(modelId)) ?? null;
}

export { Sparkles as FallbackModelIcon };