import "server-only";
import { auth } from "@/auth";
import { ApiError } from "./errors";
import type { ChatSummary, ChatDetail, MessageOut } from "./types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new ApiError(401, "There is no active session");
  }

  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Error calling ${path}: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function getChats(): Promise<ChatSummary[]> {
  return apiFetch<ChatSummary[]>("/chats");
}

export function getChat(chatId: string): Promise<ChatDetail> {
  return apiFetch<ChatDetail>(`/chats/${chatId}`);
}

export function createChat(data: {
  model: string;
  title?: string;
}): Promise<ChatSummary> {
  return apiFetch<ChatSummary>("/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function addMessage(
  chatId: string,
  content: string,
): Promise<MessageOut> {
  return apiFetch<MessageOut>(`/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}