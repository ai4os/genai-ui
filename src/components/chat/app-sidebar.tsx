import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NewChatForm } from "./new-chat-form";
import { ChatSummary } from "@/lib/api/types";

type AppSidebarProps = {
  chats: ChatSummary[];
};

export function AppSidebar({ chats }: AppSidebarProps) {
  return (
    <Sidebar>
      <NewChatForm />
      <SidebarContent>
        <SidebarMenu>
          {chats.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton render={<Link href={`/chat/${chat.id}`} />}>
                {chat.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
