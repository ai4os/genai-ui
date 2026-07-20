import { getChat } from "@/lib/api/chats";
import { ChatView } from "@/components/chat/chat-view";

type ChatPageProps = {
  params: Promise<{ chatId: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  const chat = await getChat(chatId);

  return <ChatView chatId={chatId} initialMessages={chat.messages} />;
}