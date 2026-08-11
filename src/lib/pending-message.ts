import type { MessageTarget } from "./api/types";

const PREFIX = "pending-message:";

export type PendingMessage = {
  content: string;
  target: MessageTarget;
};

export function setPendingMessage(
  chatId: string,
  content: string,
  target: MessageTarget,
) {
  sessionStorage.setItem(
    `${PREFIX}${chatId}`,
    JSON.stringify({ content, target }),
  );
}

export function consumePendingMessage(chatId: string): PendingMessage | null {
  const key = `${PREFIX}${chatId}`;
  const value = sessionStorage.getItem(key);
  if (value === null) return null;
  sessionStorage.removeItem(key);
  try {
    return JSON.parse(value) as PendingMessage;
  } catch {
    return null;
  }
}