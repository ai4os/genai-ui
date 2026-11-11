import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/lib/use-api"
import type {  Collection, CollectionCreate } from "@/lib/types"

const FIVE_MIN = 5 * 60 * 1000

export function useCollections() {
  const api = useApi()
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => api<Collection[]>("/knowledge/collections"),
    // only show collections that do now belong to a specific conversation
    select: (cols) => cols.filter((c) => !c.name?.startsWith("conversation_")),
    staleTime: FIVE_MIN,
  })
}

export function useCreateCollection() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CollectionCreate) =>
      api<Collection>("/knowledge/collections", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  })
}

export function useDeleteCollection() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/knowledge/collections/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  })
}