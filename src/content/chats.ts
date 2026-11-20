export const chatsContent = {
  sidebar: {
    newBtn: "New chat",
    noTitle: "Untitled chat",
    searchPlaceholder: "Search chat",
    today: "Today",
    yesterday: "Yesterday",
    lastWeek: "Last 7 days",
    previous: "Previous",
    clear: "Clear"
  },
  chat: {
    send: "Send",
    stop: "Stop",
    attach: "Attach file",
    model: "Model",
    agent: "Agent",
    general: "General",
    emptyStateTitle: "What can I help you with today?",
    emptyStateSubtitle:
      "Pick a model or agent above and send your first message, or try one of these suggestions.",
    inputPlaceholder: "Write a message…",
    suggestions: [
      "Summarize this document",
      "Help me write a scientific article",
      "Suggest research questions",
    ],
    retry: "Retry",
    blocked: "Messaging blocked",
    thinking: "Thinking",
    attachImage: "Add image",
    removeImage: "Remove image",
    imagesUnsupportedModel: "Model does not support images",
    imagesUnsupportedAgent: "Images are not supported by agents",
    imagesTooLarge: "Total image size can't exceed {max}",
    attachFile: "Add file",
    removeFile: "Remove file",
    filesUnsupportedModel: "Model does not support file attachments",
    filesUnsupportedAgent: "Files are not supported by agents",
    fileTooLarge: "Total file size can't exceed {max}",
    deleteDialog: {
      title: "Delete conversation",
      description:
        "The conversation will be deleted along with the attached documents. This action cannot be undone.",
    },
  },
  selector: {
    maxInputTokens: "Max input tokens",
    status: "Status",
    unknown: "Unknown",
    choose: "Choose an option",
    noDesc: "No description available",
    inputCost: "Input cost",
    outputCost: "Output cost",
    textOnly: "Text only",
    url: "URL",
    devStatus: "Status",
    devStatuses: {
      alpha: "Alpha",
      beta: "Beta",
      prod: "Production",
      unknown: "Unknown",
    },
    capabilities: {
      supports_vision: "Vision",
      supports_reasoning: "Reasoning",
      supports_function_calling: "Tools",
    },
  },
  errors: {
    emptyMessage: "Message can't be empty",
    fixConnection:
      "Ensure your connection is working properly before you continue writing",
    createChat: "Error creating the chat",
    requestedTargetUnavailable:
      "The model or agent that you are trying to use either doesn't exist or is currently unavailable",
  },
} as const;
