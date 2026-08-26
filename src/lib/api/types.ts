export type ChatSummary = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatDetail = ChatSummary & {
  config: Record<string, unknown>;
  messages: MessageOut[];
};

export type MessageRole = "system" | "user" | "assistant" | "tool";

export type MessageImage = {
  mime_type: string;
  data: string; // base64 sin prefijo "data:...;base64,"
};

export type MessageOut = {
  id: string;
  role: MessageRole;
  content: string;
  thinking?: string;
  created_at: string;
  model_id: string | null;
  agent_id: string | null;
  images?: MessageImage[] | null;
};

export type ChatImageAttachment = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string; // base64 data URL
  sizeBytes: number;
};

export type ChatError = {
  title: string;
  message: string;
  content: string;
  target: MessageTarget;
  images?: MessageImage[];
};

export type ModelInfo = {
  id: string;
  status: string;
  max_input_tokens?: number;
  supports_vision?: boolean;
  supports_reasoning?: boolean;
  supports_function_calling?: boolean;
  input_cost_per_million?: number;
  output_cost_per_million?: number;
};

export type AgentInfo = {
  id: string;
  name: string;
  description: string;
  url: string;
  provider: string;
  skills?: SkillInfo[];
};

export type SkillInfo = {
  id: string;
  name: string;
  description?: string;
};

export type MessageTarget =
  | { model_id: string; agent_id?: never }
  | { agent_id: string; model_id?: never };

export type DeltaEvent = { content: string; thinking?: string };
export type DoneEvent = {
  message_id: string;
  created_at: string;
  model_id?: string | null;
  agent_id?: string | null;
};
export type ErrorEvent = { detail: string };
