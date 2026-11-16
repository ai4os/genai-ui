import { useCallback, useState } from "react";
import { chatsContent } from "@/content/chats";
import type { Mode } from "../model-agent-selector";
import type { ModelInfo, ChatImageAttachment } from "@/lib/types";

/**
 * State and rules for attachments (images and files) shared between
 * the new chat form and the chat view.
 */
export function useChatAttachments(mode: Mode, selectedModel?: ModelInfo) {
  const imagesEnabled = mode === "model" && !!selectedModel?.supports_vision;
  const filesEnabled =
    mode === "model" && !!selectedModel?.supports_function_calling;
  const [images, setImages] = useState<ChatImageAttachment[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previousImagesEnabled, setPreviousImagesEnabled] =
    useState(imagesEnabled);
  const [previousFilesEnabled, setPreviousFilesEnabled] =
    useState(filesEnabled);

  // If the model/agent changes and stops supporting a type of attachment, it is cleared
  if (previousImagesEnabled !== imagesEnabled) {
    setPreviousImagesEnabled(imagesEnabled);
    if (!imagesEnabled) setImages([]);
  }
  if (previousFilesEnabled !== filesEnabled) {
    setPreviousFilesEnabled(filesEnabled);
    if (!filesEnabled) setFiles([]);
  }

  const clear = useCallback(() => {
    setImages([]);
    setFiles([]);
  }, []);

  return {
    images,
    files,
    clear,
    containerProps: {
      images,
      onImagesChange: setImages,
      imagesEnabled,
      imagesDisabledReason:
        mode === "agent"
          ? chatsContent.chat.imagesUnsupportedAgent
          : chatsContent.chat.imagesUnsupportedModel,
      files,
      onFilesChange: setFiles,
      filesEnabled,
      filesDisabledReason:
        mode === "agent"
          ? chatsContent.chat.filesUnsupportedAgent
          : chatsContent.chat.filesUnsupportedModel,
    },
  };
}