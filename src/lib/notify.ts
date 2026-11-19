import { toast, type ExternalToast } from "sonner"
import { ApiError } from "@/lib/api"
import { describeApiError } from "@/lib/api-errors"

export const notify = {
  success: (title: string, options?: ExternalToast) => toast.success(title, options),
  info: (title: string, options?: ExternalToast) => toast(title, options),
  error: (error: unknown) => {
    // 401 already redirects to login
    if (error instanceof ApiError && error.status === 401) return
    const { title, message } = describeApiError(error)
    toast.error(title, { description: message })
  },
}