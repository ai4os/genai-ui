import type { Api } from "@/lib/use-api"
import type {
  Collection,
  CollectionCreate,
  CreateDocumentResponse,
  DeleteDocumentResponse,
  ListDocumentResponse,
} from "@/lib/types"

export function listDocuments(api: Api, collectionId: string, page = 1, pageSize = 50) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  return api<ListDocumentResponse>(`/knowledge/collections/${collectionId}/documents?${params}`)
}

export function addDocument(api: Api, collectionId: string, file: File) {
  const formData = new FormData()
  formData.append("file", file)
  return api<CreateDocumentResponse>(`/knowledge/collections/${collectionId}/documents`, {
    method: "POST",
    body: formData,
  })
}

export function deleteDocument(api: Api, collectionId: string, fileName: string) {
  return api<DeleteDocumentResponse>(
    `/knowledge/collections/${collectionId}/documents/${encodeURIComponent(fileName)}`,
    { method: "DELETE" }
  )
}

export async function ensureConversationCollection(api: Api, chatId: string): Promise<Collection> {
  const all = await api<Collection[]>("/knowledge/collections")
  const existing = all.find((c) => c.type === "conversation" && c.conversation_id === chatId)
  if (existing) return existing

  const body: CollectionCreate = {
    name: `conversation_${chatId.replaceAll("-", "_")}`,
    type: "conversation",
    conversation_id: chatId,
  }
  return api<Collection>("/knowledge/collections", { method: "POST", body: JSON.stringify(body) })
}