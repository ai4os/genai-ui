import { startChatAction } from "@/lib/actions/chats";
import { AVAILABLE_MODELS } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { chatsContent } from "@/content/chats";

export function StartChatForm() {
  return (
    <form action={startChatAction} className="flex w-full max-w-lg flex-col gap-3">
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
      <textarea
        name="content"
        required
        rows={3}
        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
      />
      <Button type="submit">{chatsContent.chat.send}</Button>
    </form>
  );
}