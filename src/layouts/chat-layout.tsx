import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/features/chat/chat-sidebar";
import { KnowledgeSelectionProvider } from "@/features/knowledge/knowledge-selection-context";
import { UserMenu } from "@/features/auth/user-menu";
import { KnowledgeSidebar } from "@/features/knowledge/knowledge-sidebar";
import { useChats } from "@/features/chat/api/queries";
import { Skeleton } from "@/components/ui/skeleton";

function ChatListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

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
          <ChatSidebar chats={chats ?? []} userMenu={<UserMenu />} />
        )}
        <SidebarInset className="m-0! min-h-0 overflow-hidden rounded-shell bg-card shadow-shell">
          {" "}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </SidebarInset>
        <KnowledgeSidebar />
      </SidebarProvider>
    </KnowledgeSelectionProvider>
  );
}
