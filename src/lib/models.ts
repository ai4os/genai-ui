// TODO: replace static list with call to LiteLLM models endpoint
export const AVAILABLE_MODELS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
] as const;