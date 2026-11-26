export const feedbackContent = {
  loading: "Loading…",
  retry: "Retry",
  newChat: "Go to new chat",
  errors: {
    default: {
      title: "Something went wrong",
      message: "An unexpected error occurred. Please try again.",
    },
    network: {
      title: "No connection",
      message: "Could not reach the server. Check your connection.",
    },
    badRequest: { title: "Bad request", message: "The request is invalid." },
    unauthorized: {
      title: "Session expired",
      message: "Your session has expired. Please sign in again.",
    },
    forbidden: {
      title: "Permission denied",
      message: "You don't have permission to do this.",
    },
    notFound: {
      title: "Not found",
      message: "This resource doesn't exist or you don't have access to it.",
    },
    validation: {
      title: "Invalid data",
      message: "Check the data and try again.",
    },
    tooMany: {
      title: "Too many requests",
      message: "Wait a moment and try again.",
    },
    server: {
      title: "Server error",
      message: "The server couldn't complete the operation.",
    },
  },
  toasts: {
    chatDeleted: "The chat has been deleted successfully",
    chatDeletedError: "The chat could not be deleted",
    chatsDeleted: "All chats have been deleted successfully",
    chatsDeletedError: "Chats could not be deleted",
    documentAdded: "The document has been added successfully",
    documentAddedError: "The document could not be added successfully",
    documentDeleted: "The document has been deleted successfully",
    documentDeletedError: "The document could not be deleted successfully",
    loadFilesError: "The files could not be loaded",
    collectionCreated: "The collection has been created successfully",
    collectionCreatedError: "The collection could not be created",
    collectionDeleted: "The collection has been deleted successfully",
    collectionDeletedError: "The collection could not be deleted",
  },
};
