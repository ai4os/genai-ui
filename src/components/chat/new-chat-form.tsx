import { createChatAction } from "@/lib/actions/chats";
import { AVAILABLE_MODELS } from "@/lib/models";
import { SidebarHeader } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewChatForm() {
  return (
    <SidebarHeader className="gap-2 p-2">
      <form action={createChatAction} className="flex flex-col gap-2">
        <select
          name="model"
          defaultValue={AVAILABLE_MODELS[0].id}
          className="h-9 rounded-md border bg-transparent px-2 text-sm"
        >
          {AVAILABLE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" className="gap-2">
          <Plus className="size-4" />
          New chat
        </Button>
      </form>
    </SidebarHeader>
  );
}