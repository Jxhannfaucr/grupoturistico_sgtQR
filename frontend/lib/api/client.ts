import { clearAuth, getAccessToken } from "@/lib/auth/token"
import { ApiError, parseApiError } from "@/lib/api/errors"

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  auth?: boolean
  params?: Record<string, string | number | undefined>
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(path.startsWith("http") ? path : `${API_URL}${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, auth = true, headers, params, ...rest } = options

  const requestHeaders = new Headers(headers)

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }

  if (auth) {
    const token = getAccessToken()
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`)
    }
  }

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const message = await parseApiError(response)

    if (response.status === 401 && typeof window !== "undefined") {
      clearAuth()
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  options?: Omit<RequestOptions, "method" | "body" | "params">
): Promise<T> {
  return apiClient<T>(path, { method: "GET", params, ...options })
}
