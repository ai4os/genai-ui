import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Search, Trash2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button, buttonVariants } from "../../components/ui/button";
import { chatsContent } from "@/content/chats";
import { cn } from "@/lib/utils";
import { sharedContent } from "@/content/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type { ChatSummary } from "@/lib/types";
import { useDeleteChat } from "./api/queries";

type AppSidebarProps = {
  chats: ChatSummary[];
  userMenu: React.ReactNode;
};

const GROUP_ORDER = [
  chatsContent.sidebar.today,
  chatsContent.sidebar.yesterday,
  chatsContent.sidebar.lastWeek,
  chatsContent.sidebar.previous,
] as const;

function groupLabel(dateIso: string): (typeof GROUP_ORDER)[number] {
  const date = new Date(dateIso);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86_400_000,
  );

  if (diffDays <= 0) return chatsContent.sidebar.today;
  if (diffDays === 1) return chatsContent.sidebar.yesterday;
  if (diffDays <= 7) return chatsContent.sidebar.lastWeek;
  return chatsContent.sidebar.previous;
}

function groupChats(chats: ChatSummary[]) {
  const groups = new Map<string, ChatSummary[]>();
  for (const chat of chats) {
    const label = groupLabel(chat.updated_at);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(chat);
  }
  return GROUP_ORDER.filter((label) => groups.has(label)).map((label) => ({
    label,
    chats: groups.get(label)!,
  }));
}

function Highlighted({
  text,
  query,
}: Readonly<{ text: string; query: string }>) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx === -1) return <>{text}</>;
  const end = idx + query.trim().length;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-xs bg-white/40 text-inherit">
        {text.slice(idx, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

export function ChatSidebar({ chats, userMenu }: Readonly<AppSidebarProps>) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const deleteChat = useDeleteChat();

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    const q = query.trim().toLowerCase();
    return chats.filter((c) =>
      (c.title ?? chatsContent.sidebar.noTitle).toLowerCase().includes(q),
    );
  }, [chats, query]);

  const grouped = useMemo(() => groupChats(filtered), [filtered]);

  const [chatToDelete, setChatToDelete] = useState<ChatSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;
    const chatId = chatToDelete.id;

    setIsDeleting(true);
    try {
      if (pathname === `/chat/${chatId}`) navigate("/chat", { replace: true });

      await deleteChat.mutateAsync(chatId);
      toast.success(chatsContent.chat.toasts.deleteSuccess);
      setChatToDelete(null);
    } catch {
      toast.error(chatsContent.chat.toasts.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sidebar className="border-none bg-[linear-gradient(160deg,var(--brand-start)_0%,var(--brand-mid)_100%)] text-white">
      <SidebarHeader className="gap-3 p-4">
        <Link
          to="/chat"
          className={cn(
            buttonVariants({ variant: "brandGhost", size: "pill" }),
            "justify-center",
          )}
        >
          + {chatsContent.sidebar.newBtn}
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2">
          <Search className="size-4 shrink-0 text-white/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={chatsContent.sidebar.searchPlaceholder}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/55"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {grouped.map(({ label, chats: groupItems }) => (
          <div key={label} className="mb-1">
            <p className="px-3 pt-3 pb-1 text-[11px] font-medium tracking-wide text-white/55 uppercase">
              {label}
            </p>
            <SidebarMenu>
              {groupItems.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    render={<Link to={`/chat/${chat.id}`} />}
                    isActive={pathname === `/chat/${chat.id}`}
                    className="text-white/85 hover:bg-white/10 hover:text-white data-active:bg-white/20 data-active:text-white group-hover/menu-item:pr-9 group-focus-within/menu-item:pr-9"
                  >
                    <span className="block min-w-0 flex-1 truncate">
                      <Highlighted
                        text={chat.title ?? chatsContent.sidebar.noTitle}
                        query={query}
                      />
                    </span>
                  </SidebarMenuButton>

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={sharedContent.delete}
                          className="absolute inset-y-0 right-1 my-auto size-7 cursor-pointer text-white/60 opacity-0 transition-[opacity,color] hover:bg-transparent hover:text-white dark:hover:bg-transparent focus-visible:opacity-100 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100 [@media(hover:none)]:opacity-100"
                          onClick={() => setChatToDelete(chat)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                    <TooltipContent>{sharedContent.delete}</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-white/20 p-4">
        {userMenu}
      </SidebarFooter>

      <Dialog
        open={chatToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setChatToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{chatsContent.chat.deleteDialog.title}</DialogTitle>
            <DialogDescription>
              {chatsContent.chat.deleteDialog.description}
            </DialogDescription>
          </DialogHeader>

          {/* TODO: uncomment it when the option to name and rename a chat is ready */}
          {/* <p className="truncate rounded-md border bg-muted px-3 py-2 text-sm">
            {chatToDelete?.title ?? chatsContent.sidebar.noTitle}
          </p> */}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setChatToDelete(null)}
              className="cursor-pointer"
            >
              {sharedContent.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {sharedContent.deleting}
                </>
              ) : (
                sharedContent.delete
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
