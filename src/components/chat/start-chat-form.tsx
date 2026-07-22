import { startChatAction } from "@/lib/actions/chats";
import { getModels } from "@/lib/api/models";
import { Button } from "@/components/ui/button";

import { chatsContent } from "@/content/chats";

export async function StartChatForm() {
  const models = await getModels();

  return (
    <form action={startChatAction} className="flex w-full max-w-lg flex-col gap-3">
      <select
        name="model"
        defaultValue={models[0]?.id}
        className="h-9 rounded-md border bg-transparent px-2 text-sm"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id}
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