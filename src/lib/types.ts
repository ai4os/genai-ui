export type ChatSummary = {
  id: string;
  title: string | null;
  model_id: string | null;
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
  data: string; // base64 sin prefijo
};

export type MessageFile = {
  filename: string;
  mime_type: string;
  size?: number; // bytes
};

export type MessageFileView = MessageFile & { uploading?: boolean };

export type MessageOut = {
  id: string;
  role: MessageRole;
  content: string;
thinking?: string | null;
  created_at: string;
  model_id: string | null;
  agent_id: string | null;
  images?: MessageImage[] | null;
  files?: MessageFileView[] | null;
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
  files?: MessageFile[];
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
  provider: string; // TODO: revisar
  skills?: SkillInfo[];
  input_cost_per_million: number;
  output_cost_per_million: number;
  dev_status: string;
  suggestions: string[];
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

/* Knowledge */
export type CollectionType = "none" | "conversation" | "knowledge_base";

export type Collection = {
  id: string;
  name?: string;
  description?: string;
  scope: string;
  type?: CollectionType;
  conversation_id?: string;
  owner?: string;
};

export type CollectionCreate = {
  name: string;
  description?: string;
  type: CollectionType;
  conversation_id?: string;
};

export interface ListDocumentResponse {
  items: string[];
  total: number;
  page: number;
  page_size: number;
}

export type CreateDocumentResponse = {
  filename: string;
  collection_id: string;
  chunks_count: string;
  status: string;
};

export type DeleteDocumentResponse = {
  filename: string;
  collection_id: string;
  message: string;
};


/* User */
export type UserInfo = {
  name: string;
  email: string;
  uuid: string;
};