"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChatSummary } from "@/lib/api/types";
import { buttonVariants } from "../ui/button";
import { chatsContent } from "@/content/chats";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

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

function Highlighted({ text, query }: Readonly<{ text: string; query: string }>) {
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

export function AppSidebar({ chats, userMenu }: Readonly<AppSidebarProps>) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    const q = query.trim().toLowerCase();
    return chats.filter((c) =>
      (c.title ?? chatsContent.sidebar.noTitle).toLowerCase().includes(q),
    );
  }, [chats, query]);

  const grouped = useMemo(() => groupChats(filtered), [filtered]);

  return (
    <Sidebar className="border-none bg-[linear-gradient(160deg,var(--brand-start)_0%,var(--brand-mid)_100%)] text-white">
      <SidebarHeader className="gap-3 p-4">
        <Link
          href="/chat"
          className={cn(
            buttonVariants({ variant: "brandGhost", size: "pill" }),
            "justify-start",
          )}
        >
          <Plus className="size-4" />
          {chatsContent.sidebar.newBtn}
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
                    render={<Link href={`/chat/${chat.id}`} />}
                    isActive={pathname === `/chat/${chat.id}`}
                    className="text-white/85 hover:bg-white/10 hover:text-white data-active:bg-white/20 data-active:text-white"
                  >
                    <Highlighted
                      text={chat.title ?? chatsContent.sidebar.noTitle}
                      query={query}
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-white/20 p-4">
        {userMenu}
      </SidebarFooter>
    </Sidebar>
  );
}
