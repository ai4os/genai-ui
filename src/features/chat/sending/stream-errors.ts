import { apiContent } from "@/content/api";
import { ApiError } from "@/lib/api";

export type StreamErrorText = { title: string; message: string };

/**
 * Translates any error that occurs while sending a message into a title and
 * message to display in the error card (see section 8.4 of the documentation).
 */
export function describeStreamError(err: unknown): StreamErrorText {
  if (!(err instanceof ApiError)) {
    const hasOwnMessage =
      err instanceof Error && !(err instanceof TypeError) && err.message;
    return {
      title: apiContent.chat.connectionError,
      message: hasOwnMessage ? err.message : apiContent.chat.checkConnection,
    };
  }

  const { status } = err;
  const detail = err.message; // {"detail": "..."} from genai-api

  switch (status) {
    case 400:
      return {
        title: apiContent.general.incorrect.title,
        message: detail || apiContent.general.incorrect.desc,
      };
    case 401:
      return {
        title: apiContent.general.unauthorized.title,
        message: apiContent.general.unauthorized.desc,
      };
    case 403:
      return {
        title: apiContent.general.forbidden.title,
        message: apiContent.general.forbidden.desc,
      };
    case 404:
      return {
        title: apiContent.general.unfound.title,
        message: detail || apiContent.general.unfound.desc,
      };
    case 429:
      return {
        title: apiContent.general.requests.title,
        message: apiContent.general.requests.desc,
      };
    case 500:
    case 502:
    case 503:
      return {
        title: `${apiContent.general.server.title} (${status})`,
        message: detail || apiContent.general.server.desc,
      };
    default:
      return {
        title: `${apiContent.general.default.title} (${status})`,
        message: detail || apiContent.chat.checkConnection,
      };
  }
}