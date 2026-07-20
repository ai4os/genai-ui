import { Suspense } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatListSkeleton } from "@/components/chat/chat-list-skeleton";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/top-menu/user-menu";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<ChatListSkeleton />}>
        <ChatList />
      </Suspense>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground">Chat</span>
          </div>
          <UserMenu />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
