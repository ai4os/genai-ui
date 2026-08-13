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
    thinking: "Thinking"
  },
  selector: {
    context: "Context",
    status: "Status",
    unknown: "Unknown",
    choose: "Choose an option",
    noDesc: "No description available",
  },
  errors: {
    emptyMessage: "Message can't be empty",
    fixConnection:
      "Ensure your connection is working properly before you continue writing",
    createChat: "Error creating the chat",
  },
} as const;
