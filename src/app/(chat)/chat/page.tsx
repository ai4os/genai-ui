import { StartChatForm } from "@/components/chat/start-chat-form";

type SearchParams = { model?: string; agent?: string };

export default async function ChatIndexPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const { model, agent } = await searchParams;

  return <StartChatForm initialModelId={model} initialAgentId={agent} />;
}