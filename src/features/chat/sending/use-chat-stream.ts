import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { apiContent } from "@/content/api";
import { apiRequest } from "@/lib/api";
import { parseSSEStream } from "@/lib/sse";
import type {
  ChatError,
  DeltaEvent,
  DoneEvent,
  ErrorEvent,
  MessageFile,
  MessageImage,
  MessageOut,
  MessageTarget,
  ModelInfo,
} from "@/lib/types";
import { useGetToken } from "@/lib/use-api";
import { describeStreamError } from "./stream-errors";

/**
 * Determines whether knowledge collections can be used:
 * only models with function calling. Agents never can (selectedModel is
 * undefined in agent mode) - WIP.
 */
export function modelSupportsKnowledge(model?: ModelInfo): boolean {
  return model?.supports_function_calling === true;
}

type UseChatStreamParams = {
  chatId: string;
  models: ModelInfo[];
  selectedIds: ReadonlySet<string>;
  setMessages: Dispatch<SetStateAction<MessageOut[]>>;
};

/**
 * Sends a message to POST /chats/{id}/messages and streams the SSE response
 * into the parent’s message list. Owns the "sending" state, the error, and
 * the AbortController.
 */
export function useChatStream({
  chatId,
  models,
  selectedIds,
  setMessages,
}: UseChatStreamParams) {
  const getToken = useGetToken();
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const patchMessage = useCallback(
    (id: string, patch: (m: MessageOut) => MessageOut) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? patch(m) : m)));
    },
    [setMessages],
  );

  const runStream = useCallback(
    async (
      content: string,
      target: MessageTarget,
      assistantMsgId: string,
      images?: MessageImage[],
      messageFiles?: MessageFile[],
    ) => {
      setSending(true);
      setStreamingId(assistantMsgId);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const targetModel =
        "model_id" in target
          ? models.find((m) => m.id === target.model_id)
          : undefined;
      const sendCollections =
        modelSupportsKnowledge(targetModel) && selectedIds.size > 0;

      const fail = (title: string, message: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
        setError({
          title,
          message,
          content,
          target,
          images,
          files: messageFiles,
        });
      };

      try {
        const token = await getToken();
        const res = await apiRequest(`/chats/${chatId}/messages`, token, {
          method: "POST",
          body: JSON.stringify({
            content,
            ...target,
            ...(images?.length ? { images } : {}),
            ...(messageFiles?.length ? { files: messageFiles } : {}),
            ...(sendCollections
              ? { collection_ids: Array.from(selectedIds) }
              : {}),
          }),
          signal: controller.signal,
        });
        if (!res.body) throw new Error(apiContent.chat.processError);

        for await (const { event, data } of parseSSEStream<
          DeltaEvent | DoneEvent | ErrorEvent
        >(res.body)) {
          if (event === "delta") {
            const { content: chunk, thinking: thinkingChunk } =
              data as DeltaEvent;
            patchMessage(assistantMsgId, (m) => ({
              ...m,
              content: chunk ? m.content + chunk : m.content,
              thinking: thinkingChunk
                ? (m.thinking || "") + thinkingChunk
                : m.thinking,
            }));
          } else if (event === "done") {
            const { message_id, created_at, model_id, agent_id } =
              data as DoneEvent;
            patchMessage(assistantMsgId, (m) => ({
              ...m,
              id: message_id,
              created_at,
              model_id: model_id ?? m.model_id,
              agent_id: agent_id ?? m.agent_id,
            }));
          } else if (event === "error") {
            const { detail } = data as ErrorEvent;
            fail(
              apiContent.chat.responseError,
              detail || apiContent.chat.modelError,
            );
            return;
          }
        }
      } catch (err: unknown) {
        // User-triggered stop
        if (err instanceof Error && err.name === "AbortError") return;
        const { title, message } = describeStreamError(err);
        fail(title, message);
      } finally {
        setSending(false);
        setStreamingId(null);
        abortRef.current = null;
      }
    },
    [chatId, getToken, models, selectedIds, setMessages, patchMessage],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const clearError = useCallback(() => setError(null), []);

  return { sending, streamingId, error, clearError, runStream, stop };
}