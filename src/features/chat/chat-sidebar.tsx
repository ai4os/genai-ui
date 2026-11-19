import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Plus, Search, Trash2, X } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip";
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
      setChatToDelete(null);
    } catch {
      // The mutation query owns the error toast.
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sidebar className="border-none bg-sidebar-gradient text-white">
      <SidebarHeader className="gap-3 px-4 pt-5 pb-2">
        <Link
          to="/chat"
          className={cn(
            buttonVariants({ variant: "inverse", size: "lg" }),
            "w-full",
          )}
        >
          <Plus className="size-[18px]" strokeWidth={2} />
          {chatsContent.sidebar.newBtn}
        </Link>

        <label className="flex h-10 items-center gap-2.5 rounded-full bg-white/14 px-3.5 text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white">
          <Search className="size-[18px] shrink-0" strokeWidth={1.75} />

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={chatsContent.sidebar.searchPlaceholder}
            aria-label={chatsContent.sidebar.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/85 [&::-webkit-search-cancel-button]:hidden"
          />

          {query && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="shrink-0 text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <X className="size-4" strokeWidth={2} />
                  </button>
                }
              />
              <TooltipContent>{chatsContent.sidebar.clear}</TooltipContent>
            </Tooltip>
          )}
        </label>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-2">
        {grouped.map(({ label, chats: groupItems }) => (
          <div key={label}>
            <p className="mx-3 mt-[18px] mb-1.5 text-xs font-semibold tracking-[0.06em] text-white/85 uppercase">
              {label}
            </p>
            <SidebarMenu>
              {groupItems.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    render={<Link to={`/chat/${chat.id}`} />}
                    isActive={pathname === `/chat/${chat.id}`}
                    className="h-[38px] rounded-[10px] px-3 font-normal text-white outline-none hover:bg-white/12 hover:text-white focus-visible:ring-2 focus-visible:ring-white data-active:bg-white/20 data-active:font-normal data-active:text-white group-hover/menu-item:pr-9 group-focus-within/menu-item:pr-9"
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
                          size="icon-sm"
                          aria-label={sharedContent.delete}
                          className="absolute inset-y-0 right-1 my-auto text-white opacity-0 transition-opacity hover:bg-white/12 focus-visible:opacity-100 focus-visible:outline-white group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100 [@media(hover:none)]:opacity-100"
                          onClick={() => setChatToDelete(chat)}
                        >
                          <Trash2 className="size-4" strokeWidth={1.75} />
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
      <SidebarFooter className="border-t border-white/22 px-4 py-3.5">
        {userMenu}
      </SidebarFooter>

      <Dialog
        open={chatToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setChatToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
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
              variant="secondary"
              disabled={isDeleting}
              onClick={() => setChatToDelete(null)}
            >
              {sharedContent.cancel}
            </Button>
            <Button
              type="button"
              variant="destructiveSolid"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
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
