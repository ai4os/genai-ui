import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { ChatListSkeleton } from "@/components/chat/chat-list-skeleton";
import { KnowledgeSelectionProvider } from "@/components/chat/knowledge-selection-context";
import { useChats } from "@/lib/queries";
import { UserMenu } from "@/components/top-menu/user-menu";
import { RightSidebar } from "@/components/extra-menu/right-sidebar";

export function ChatLayout() {
  const { data: chats, isPending } = useChats();
  return (
    <KnowledgeSelectionProvider>
      <SidebarProvider
        style={{ "--sidebar-width": "250px" } as React.CSSProperties}
        className="h-svh overflow-hidden gap-[18px] bg-app-shell p-[18px] pl-0"
      >
        {isPending ? (
          <ChatListSkeleton />
        ) : (
          <AppSidebar chats={chats ?? []} userMenu={<UserMenu />} />
        )}
        <SidebarInset className="m-0! min-h-0 overflow-hidden rounded-shell bg-card shadow-shell">
          {" "}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </SidebarInset>
        <RightSidebar />
      </SidebarProvider>
    </KnowledgeSelectionProvider>
  );
}
