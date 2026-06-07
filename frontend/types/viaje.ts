export type BusSimple = {
  id: number
  nombre: string
  capacidad_total: number
}

export type Viaje = {
  id: number
  nombre: string
  fecha_salida: string
  hora_salida: string
  lugar_abordaje: string
  precio: number
  bus_id: number
  bus: BusSimple | null
  creado_por: number
  creado_en: string
  tokens_count: number
  asientos_count: number
  asientos_vendidos_count: number
  estado?: string
}

export type ViajeEstadoFiltro = "todos" | "proximos" | "pasados"

export type ViajeListFilters = {
  estado: ViajeEstadoFiltro
  fecha?: string
  bus_id?: number
}

export type ViajeListStats = {
  total: number
  proximos: number
  pasados: number
  lotesActivos: number
}
