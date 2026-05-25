export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === "string") {
      return data.detail
    }
    if (Array.isArray(data.detail)) {
      const first = data.detail[0]
      if (first?.msg) return String(first.msg)
      return "Datos inválidos. Revisa el formulario."
    }
  } catch {
    // respuesta no JSON
  }

  if (response.status === 401) {
    return "Sesión expirada. Inicia sesión de nuevo."
  }
  if (response.status === 404) {
    return "Recurso no encontrado."
  }
  if (response.status === 503) {
    return "No se puede conectar con el servidor. Intenta más tarde."
  }

  return "Ocurrió un error inesperado. Intenta de nuevo."
}
