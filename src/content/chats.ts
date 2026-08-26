export const chatsContent = {
  sidebar: {
    newBtn: "New chat",
    noTitle: "Untitled chat",
    searchPlaceholder: "Search chat",
    today: "Today",
    yesterday: "Yesterday",
    lastWeek: "Last 7 days",
    previous: "Previous",
  },
  chat: {
    send: "Send",
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
    attachImage: "Attach image",
    removeImage: "Remove image",
    imagesUnsupportedModel: "This model doesn't support image input",
    imagesUnsupportedAgent: "Agents don't support image input yet",
    imagesTooLarge: "Total image size can't exceed {max}",
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
