import { addDocument, ensureConversationCollection } from "@/lib/knowledge"
import type { Api } from "@/lib/use-api"
import type { MessageFile } from "@/lib/types"

export async function uploadChatFiles(api: Api, chatId: string, files: File[]): Promise<MessageFile[]> {
  const collection = await ensureConversationCollection(api, chatId)
  const uploaded: MessageFile[] = []
  for (const file of files) {
    const res = await addDocument(api, collection.id, file)
    uploaded.push({
      filename: res.filename ?? file.name,
      mime_type: file.type || "application/octet-stream", // el backend espera `mimetype`
      size: file.size,
    })
  }
  return uploaded
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`
  return `${bytes} bytes`
}