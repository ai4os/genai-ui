import { useNavigate, useParams } from "react-router-dom"
import { ChatView } from "@/features/chat/chat-view"
import { useChat, useModels, useAgents } from "@/features/chat/api/queries"

import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { feedbackContent } from "@/content/feedback"
import { ErrorState } from "@/features/shared/error-state"
import { PageLoader } from "@/features/shared/loader"

export function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const chat = useChat(chatId)
  const models = useModels()
  const agents = useAgents()

  if (chat.isPending || models.isPending || agents.isPending) {
    return <PageLoader />
  }

  if (chat.isError || models.isError || agents.isError) {
    const error = chat.error ?? models.error ?? agents.error
    const notFound = error instanceof ApiError && error.status === 404

    return (
      <ErrorState
        error={error}
        onRetry={
          notFound
            ? undefined
            : () => [chat, models, agents].forEach((q) => q.isError && void q.refetch())
        }
      >
        {notFound && (
          <Button size="sm" onClick={() => navigate("/chat")}>
            {feedbackContent.newChat}
          </Button>
        )}
      </ErrorState>
    )
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