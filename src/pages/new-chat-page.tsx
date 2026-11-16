import { useSearchParams } from "react-router-dom"
import { NewChatView } from "@/features/chat/new-chat-view"
import { useModels, useAgents } from "@/features/chat/api/queries"

export function NewChatPage() {
  const [params] = useSearchParams()
  const models = useModels()
  const agents = useAgents()

  if (models.isPending || agents.isPending) return <p className="p-4">Cargando…</p>
  if (models.error || agents.error) {
    return <p className="p-4">Error: {(models.error ?? agents.error)?.message}</p>
  }
  return (
    <NewChatView
      models={models.data}
      agents={agents.data}
      initialModelId={params.get("model") ?? undefined}
      initialAgentId={params.get("agent") ?? undefined}
    />
  )
}