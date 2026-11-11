const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Makes the request and, if the API responds with an error, throws ApiError with FastAPI's `detail`
export async function apiRequest(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)
  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body)
    } catch {
      // when the body is not a json
    }
    throw new ApiError(res.status, detail)
  }
  return res
}

export async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await apiRequest(path, token, init)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}