"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createChat, addMessage } from "@/lib/api/chats";
import { chatsContent } from "@/content/chats";

function deriveTitle(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

export async function startChatAction(formData: FormData) {
  const model = formData.get("model") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!content) {
    throw new Error(chatsContent.errors.emptyMessage);
  }

  const chat = await createChat({ model, title: deriveTitle(content) });
  await addMessage(chat.id, content);

  revalidatePath("/chat");
  redirect(`/chat/${chat.id}`);
}