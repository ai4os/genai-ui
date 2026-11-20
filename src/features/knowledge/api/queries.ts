import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/use-api";
import type { Collection, CollectionCreate } from "@/lib/types";
import { notify } from "@/lib/notify";
import { feedbackContent } from "@/content/feedback";
import { addDocument, deleteDocument } from "./documents";

const FIVE_MIN = 5 * 60 * 1000;

export function useCollections() {
  const api = useApi();
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => api<Collection[]>("/knowledge/collections"),
    // only show collections that do now belong to a specific conversation
    select: (cols) => cols.filter((c) => !c.name?.startsWith("conversation_")),
    staleTime: FIVE_MIN,
  });
}

export function useCreateCollection() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CollectionCreate) =>
      api<Collection>("/knowledge/collections", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      notify.success(feedbackContent.toasts.collectionCreated);
    },
    onError: () => notify.error(feedbackContent.toasts.collectionCreatedError),
    meta: { silent: true },
  });
}

export function useDeleteCollection() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/knowledge/collections/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      notify.success(feedbackContent.toasts.collectionDeleted);
    },
    onError: () => {
      notify.error(feedbackContent.toasts.collectionDeletedError);
    },
    meta: { silent: true },
  });
}

export function useAddDocument() {
  const api = useApi();
  return useMutation({
    mutationFn: ({
      collectionId,
      file,
    }: {
      collectionId: string;
      file: File;
    }) => addDocument(api, collectionId, file),
    onSuccess: () => notify.success(feedbackContent.toasts.documentAdded),
    onError: () => notify.error(feedbackContent.toasts.documentAddedError),
    meta: { silent: true },
  });
}

export function useDeleteDocument() {
  const api = useApi();
  return useMutation({
    mutationFn: ({
      collectionId,
      fileName,
    }: {
      collectionId: string;
      fileName: string;
    }) => deleteDocument(api, collectionId, fileName),
    onSuccess: () => notify.success(feedbackContent.toasts.documentDeleted),
    onError: () => notify.error(feedbackContent.toasts.documentDeletedError),
    meta: { silent: true },
  });
}
