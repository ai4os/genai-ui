import { getModels } from "@/lib/api/models";
import { StartChatFormClient } from "./start-chat-form-client";

export async function StartChatForm() {
  const models = await getModels();
  return <StartChatFormClient models={models} />;
}