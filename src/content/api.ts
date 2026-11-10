export const apiContent = {
  chat: {
    createError: "You should specify either a model_id or an agent_id",
    processError: "An error occurred while processing the response",
    responseError: "The response could not be completed",
    modelError: "An error occurred when trying to connect to the model",
    connectionError: "Couldn't connect",
    checkConnection: "Check your internet connection and try again",
  },
  general: {
    incorrect: {
      title: "Bad request",
      desc: "The submitted data is invalid.",
    },
    unauthorized: {
      title: "Unauthorized",
      desc: "Your session has expired or you do not have permission.",
    },
    forbidden: {
      title: "Forbidden",
      desc: "You do not have permission to perform this action.",
    },
    unfound: {
      title: "Not found",
      desc: "The requested resource does not exist.",
    },
    requests: {
      title: "Too many requests",
      desc: "You have exceeded the request limit. Please wait a moment.",
    },
    server: {
      title: "Server error ",
      desc: "An error occurred on the server. Please try again later.",
    },
    default: {
      title: "Unexpected error ",
    },
  },
} as const;
