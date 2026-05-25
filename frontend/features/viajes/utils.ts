import { isViajeProximo } from "@/lib/format"
import type { Viaje, ViajeListStats } from "@/types/viaje"

export function computeViajeStats(viajes: Viaje[]): ViajeListStats {
  return viajes.reduce<ViajeListStats>(
    (acc, viaje) => {
      acc.total += 1
      acc.lotesActivos += viaje.tokens_count

      if (isViajeProximo(viaje.fecha_salida)) {
        acc.proximos += 1
      } else {
        acc.pasados += 1
      }

      return acc
    },
    { total: 0, proximos: 0, pasados: 0, lotesActivos: 0 }
  )
}
