export type ChatSummary = {
  id: string;
  title: string | null;
  model: string;
  created_at: string;
  updated_at: string;
};

export type ChatDetail = ChatSummary & {
  config: Record<string, unknown>;
  messages: MessageOut[];
};

export type MessageRole = "system" | "user" | "assistant" | "tool";

export type MessageOut = {
  id: string;
  role: MessageRole; 
  content: string;
  created_at: string;
};