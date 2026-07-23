import { getChat } from "@/lib/api/chats";
import { getModels } from "@/lib/api/models";
import { ChatView } from "@/components/chat/chat-view";

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const [chat, models] = await Promise.all([getChat(chatId), getModels()]);

  return <ChatView chatId={chatId} initialMessages={chat.messages} models={models} />;
}