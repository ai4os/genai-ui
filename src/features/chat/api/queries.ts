import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/lib/use-api"
import type { AgentInfo, ChatDetail, ChatSummary, ModelInfo } from "@/lib/types"

const FIVE_MIN = 5 * 60 * 1000

export function useModels() {
  const api = useApi()
  return useQuery({
    queryKey: ["models"],
    queryFn: () => api<ModelInfo[]>("/models"),
    staleTime: FIVE_MIN,
  })
}

export function useAgents() {
  const api = useApi()
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => api<AgentInfo[]>("/agents"),
    staleTime: FIVE_MIN,
  })
}

export function useChats() {
  const api = useApi()
  return useQuery({
    queryKey: ["chats"],
    queryFn: () => api<ChatSummary[]>("/chats"),
  })
}

export function useChat(chatId: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => api<ChatDetail>(`/chats/${chatId}`),
    enabled: !!chatId,
    gcTime: 0, // siempre fresco al entrar: ChatView solo lee los mensajes al montarse
  })
}

export function useCreateChat() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { model_id?: string; title?: string }) =>
      api<ChatSummary>("/chats", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  })
}

export function useDeleteChat() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (chatId: string) => api<void>(`/chats/${chatId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  })
}