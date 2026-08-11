import { Suspense } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatListSkeleton } from "@/components/chat/chat-list-skeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { RightSidebar } from "@/components/extra-menu/right-sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "250px" } as React.CSSProperties}      className="min-h-svh gap-[18px] bg-app-shell p-[18px] pl-0"
    >
      <Suspense fallback={<ChatListSkeleton />}>
        <ChatList />
      </Suspense>

      <SidebarInset className="m-0! overflow-hidden rounded-shell bg-card shadow-shell">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>

      <RightSidebar />
    </SidebarProvider>
  );
}
