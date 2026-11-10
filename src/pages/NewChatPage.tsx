import { useSearchParams } from "react-router-dom"
import { StartChatFormClient } from "@/components/chat/start-chat-form-client"
import { useAgents, useModels } from "@/lib/queries"

export function NewChatPage() {
  const [params] = useSearchParams()
  const models = useModels()
  const agents = useAgents()

  if (models.isPending || agents.isPending) return <p className="p-4">Cargando…</p>
  if (models.error || agents.error) {
    return <p className="p-4">Error: {(models.error ?? agents.error)?.message}</p>
  }
  return (
    <StartChatFormClient
      models={models.data}
      agents={agents.data}
      initialModelId={params.get("model") ?? undefined}
      initialAgentId={params.get("agent") ?? undefined}
    />
  )
}