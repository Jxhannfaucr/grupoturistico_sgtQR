"use client"

import { useCallback, useEffect, useState } from "react"
import type { AsyncStatus } from "@/types/api"

type UseCrudListOptions<T, F> = {
  fetchFn: (filters: F) => Promise<T[]>
  filters: F
  enabled?: boolean
}

export function useCrudList<T, F>({
  fetchFn,
  filters,
  enabled = true,
}: UseCrudListOptions<T, F>) {
  const [data, setData] = useState<T[]>([])
  const [status, setStatus] = useState<AsyncStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) return

    setStatus("loading")
    setError(null)

    try {
      const result = await fetchFn(filters)
      setData(result)
      setStatus("success")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudieron cargar los datos."
      setError(message)
      setData([])
      setStatus("error")
    }
  }, [enabled, fetchFn, filters])

  useEffect(() => {
    reload()
  }, [reload])

  return {
    data,
    status,
    error,
    isLoading: status === "loading" || status === "idle",
    reload,
  }
}
