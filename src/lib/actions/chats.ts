"use server";

import { revalidatePath } from "next/cache";
import { createChat } from "@/lib/api/chats";
import { chatsContent } from "@/content/chats";
import type { ChatSummary } from "@/lib/api/types";

export async function startChatAction(formData: FormData): Promise<ChatSummary> {
  const content = (formData.get("content") as string)?.trim();
  if (!content) {
    throw new Error(chatsContent.errors.emptyMessage);
  }

  const trimmed = content.length > 60 ? `${content.slice(0, 60)}…` : content;
  const chat = await createChat({ title: trimmed });

  revalidatePath("/chat");

  return chat;
}