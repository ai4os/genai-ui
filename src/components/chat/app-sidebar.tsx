import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChatSummary } from "@/lib/api/types";
import { Plus } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { chatsContent } from "@/content/chats";

type AppSidebarProps = {
  chats: ChatSummary[];
};

export function AppSidebar({ chats }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-2">
        <Link
          href="/chat"
          className={buttonVariants({ variant: "brandLight", size: "pill" })}
        >
          <Plus className="size-4" />
          {chatsContent.sidebar.newBtn}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {chats.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton render={<Link href={`/chat/${chat.id}`} />}>
                {chat.title ?? chatsContent.sidebar.noTitle}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
