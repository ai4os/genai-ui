import { getChat } from "@/lib/api/chats";
import { getModels } from "@/lib/api/models";
import { ChatView } from "@/components/chat/chat-view";
import { getAgents } from "@/lib/api/agents";

export default async function ChatPage({
  params,
}: Readonly<{
  params: Promise<{ chatId: string }>;
}>) {
  const { chatId } = await params;
  const [chat, models, agents] = await Promise.all([
    getChat(chatId),
    getModels(),
    getAgents(),
  ]);

  return (
    <ChatView
      chatId={chatId}
      initialMessages={chat.messages}
      models={models}
      agents={agents}
    />
  );
}