import { getModels } from "@/lib/api/models";
import { getAgents } from "@/lib/api/agents";
import { StartChatFormClient } from "./start-chat-form-client";

export async function StartChatForm({
  initialModelId,
  initialAgentId,
}: Readonly<{
  initialModelId?: string;
  initialAgentId?: string;
}>) {
  const [models, agents] = await Promise.all([getModels(), getAgents()]);

  return (
    <StartChatFormClient
      models={models}
      agents={agents}
      initialModelId={initialModelId}
      initialAgentId={initialAgentId}
    />
  );
}