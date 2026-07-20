import { getChats } from "@/lib/api/chats";
import { AppSidebar } from "./app-sidebar";

export async function ChatList() {
  const chats = await getChats();
  return <AppSidebar chats={chats} />;
}