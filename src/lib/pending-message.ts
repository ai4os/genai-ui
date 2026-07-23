const PREFIX = "pending-message:";

export function setPendingMessage(chatId: string, content: string) {
  sessionStorage.setItem(`${PREFIX}${chatId}`, content);
}

export function consumePendingMessage(chatId: string): string | null {
  const key = `${PREFIX}${chatId}`;
  const value = sessionStorage.getItem(key);
  if (value !== null) {
    sessionStorage.removeItem(key);
  }
  return value;
}