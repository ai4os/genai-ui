import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/use-api";
import { feedbackContent } from "@/content/feedback";
import { notify } from "@/lib/notify";

export interface CreditUsage {
  spend: number;
  budget: number | null;
  remaining: number | null;
  usage_percentage: number | null;
  budget_reset_at: string | null;
}

export function useCreditUsage() {
  const api = useApi();
  return useQuery({
    queryKey: ["credit-usage"],
    queryFn: () => api<CreditUsage>("/user/credit_info"),
    staleTime: 60_000,
  });
}

export function useDeleteAllChats() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/chats", { method: "DELETE" }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["chat"] });
      qc.invalidateQueries({ queryKey: ["chats"] });
      qc.invalidateQueries({ queryKey: ["collections"] });
      notify.success(feedbackContent.toasts.chatsDeleted);
    },
    onError: () => notify.error(feedbackContent.toasts.chatsDeletedError),
  });
}
