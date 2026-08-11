export const apiContent = {
  chat: {
    createError: "You should specify either a model_id or an agent_id",
    processError: "An error occurred while processing the response",
    responseError: "The response could not be completed",
    modelError: "An error occurred when trying to connect to the model",
    connectionError: "Couldn't connect",
    checkConnection: "Check your internet connection and try again"
  },
} as const;
