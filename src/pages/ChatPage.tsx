import { useParams } from "react-router-dom"
import { ChatView } from "@/components/chat/chat-view"
import { useAgents, useChat, useModels } from "@/lib/queries"

export function ChatPage() {
  const { chatId } = useParams()
  const chat = useChat(chatId)
  const models = useModels()
  const agents = useAgents()

  if (chat.isPending || models.isPending || agents.isPending) {
    return <p className="p-4">Cargando…</p>
  }
  if (chat.isError || models.isError || agents.isError) {
    const error = chat.error ?? models.error ?? agents.error
    return <p className="p-4">Error: {error?.message}</p>
  }

  return (
    <ChatView
      key={chatId}
      chatId={chatId!}
      initialMessages={chat.data.messages}
      models={models.data}
      agents={agents.data}
    />
  )
}