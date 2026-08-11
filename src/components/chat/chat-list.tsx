import { getChats } from "@/lib/api/chats";
import { AppSidebar } from "./app-sidebar";
import { UserMenu } from "../top-menu/user-menu";

export async function ChatList() {
  const chats = await getChats();
  return <AppSidebar chats={chats} userMenu={<UserMenu />} />;
}