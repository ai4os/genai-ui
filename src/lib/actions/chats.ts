"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createChat } from "@/lib/api/chats";

export async function createChatAction(formData: FormData) {
  const model = formData.get("model") as string;
  const title = formData.get("title") as string;

  const chat = await createChat({
    model,
    title: title || undefined,
  });

  revalidatePath("/chat");
  redirect(`/chat/${chat.id}`);
}