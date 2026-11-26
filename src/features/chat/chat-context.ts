import { createContext, useContext } from "react";
import type { MessageTarget } from "@/lib/types";

export type ChatContextValue = {
  target: MessageTarget | null;
  setTarget: (target: MessageTarget) => void;
};

export const ChatContext =
  createContext<ChatContextValue | null>(null);

export function useChatTarget() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatTarget must be used within provider");
  }
  return context;
}
