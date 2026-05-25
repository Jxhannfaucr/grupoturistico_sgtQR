const ACCESS_TOKEN_KEY = "access_token"
const USER_ROL_KEY = "user_rol"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getUserRol(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(USER_ROL_KEY)
}

export function clearAuth(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_ROL_KEY)
}
