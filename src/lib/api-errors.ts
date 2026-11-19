import { ApiError } from "@/lib/api"
import { feedbackContent as c } from "@/content/feedback"

export interface DescribedError {
  title: string
  message: string
  status?: number
}

export function describeApiError(error: unknown): DescribedError {
  // Network or CORS error
  if (error instanceof TypeError) return c.errors.network

  if (!(error instanceof ApiError)) return c.errors.default

  const { status } = error
  const detail = error.message

  if (status === 400) return { status, title: c.errors.badRequest.title, message: detail || c.errors.badRequest.message }
  if (status === 401) return { status, ...c.errors.unauthorized }
  if (status === 403) return { status, ...c.errors.forbidden }
  if (status === 404) return { status, title: c.errors.notFound.title, message: detail || c.errors.notFound.message }
  if (status === 422) return { status, ...c.errors.validation }
  if (status === 429) return { status, ...c.errors.tooMany }
  if (status >= 500) {
    return { status, title: c.errors.server.title, message: `${c.errors.server.message} (${status})` }
  }
  return { status, ...c.errors.default }
}