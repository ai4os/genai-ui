import type { MessageTarget, ChatImageAttachment } from "../../../lib/types";


const PREFIX = "pending-message:";

export type PendingMessage = {
  content: string;
  target: MessageTarget;
  images?: ChatImageAttachment[];
  files?: File[];
};

const pendingFiles = new Map<string, File[]>();

export function setPendingMessage(
  chatId: string,
  content: string,
  target: MessageTarget,
  images?: ChatImageAttachment[],
  files?: File[],
) {
  sessionStorage.setItem(
    `${PREFIX}${chatId}`,
    JSON.stringify({ content, target, images }),
  );
  if (files?.length) pendingFiles.set(chatId, files);
  else pendingFiles.delete(chatId);
}

export function consumePendingMessage(chatId: string): PendingMessage | null {
  const key = `${PREFIX}${chatId}`;
  const value = sessionStorage.getItem(key);
  const files = pendingFiles.get(chatId);
  pendingFiles.delete(chatId);
  if (value === null) return null;
  sessionStorage.removeItem(key);
  try {
    const parsed = JSON.parse(value) as Omit<PendingMessage, "files">;
    return { ...parsed, files };
  } catch {
    return null;
  }
}