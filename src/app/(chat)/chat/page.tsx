import { StartChatForm } from "@/components/chat/start-chat-form";
import { chatsContent } from "@/content/chats";

export default function ChatIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
      <p className="text-muted-foreground">{chatsContent.chat.newDescription}</p>
      <StartChatForm />
    </div>
  );
}