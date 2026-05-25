import { apiGet } from "@/lib/api/client"
import type { Viaje, ViajeListFilters } from "@/types/viaje"

function toQueryParams(filters: ViajeListFilters) {
  const params: Record<string, string | number | undefined> = {}

  if (filters.estado !== "todos") {
    params.estado = filters.estado
  }
  if (filters.fecha) {
    params.fecha = filters.fecha
  }
  if (filters.bus_id) {
    params.bus_id = filters.bus_id
  }

  return params
}

export async function fetchViajes(filters: ViajeListFilters): Promise<Viaje[]> {
  return apiGet<Viaje[]>("/api/viajes/", toQueryParams(filters))
}

export async function fetchViaje(id: number): Promise<Viaje> {
  return apiGet<Viaje>(`/api/viajes/${id}`)
}
