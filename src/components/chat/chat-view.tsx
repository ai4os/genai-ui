"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MessageOut } from "@/lib/api/types";

export function ChatView({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: MessageOut[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;
    setSending(true);

    const res = await fetch(`/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input }),
    });

    if (res.ok) {
      const message: MessageOut = await res.json();
      setMessages((prev) => [...prev, message]);
      setInput("");
    }
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold">{m.role}:</span> {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={sending}>
          Send
        </Button>
      </div>
    </div>
  );
}