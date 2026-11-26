import { useState, type ReactNode } from "react";
import type { MessageTarget } from "@/lib/types";
import { ChatContext } from "./chat-context";

export function ChatProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [target, setTarget] = useState<MessageTarget | null>(null);

  return (
    <ChatContext.Provider value={{ target, setTarget }}>
      {children}
    </ChatContext.Provider>
  );
}
