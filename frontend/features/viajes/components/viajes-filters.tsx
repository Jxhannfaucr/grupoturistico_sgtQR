"use client"

import { CalendarDays, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ViajeEstadoFiltro } from "@/types/viaje"

const ESTADO_OPTIONS: { value: ViajeEstadoFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "proximos", label: "Próximos" },
  { value: "pasados", label: "Pasados" },
]

type ViajesFiltersProps = {
  estado: ViajeEstadoFiltro
  fecha?: string
  onEstadoChange: (estado: ViajeEstadoFiltro) => void
  onFechaChange: (fecha: string) => void
  onRefresh: () => void
  isLoading?: boolean
}

export function ViajesFilters({
  estado,
  fecha = "",
  onEstadoChange,
  onFechaChange,
  onRefresh,
  isLoading,
}: ViajesFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {ESTADO_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={estado === option.value ? "default" : "outline"}
            className={cn(
              "rounded-full",
              estado === option.value && "shadow-sm shadow-primary/20"
            )}
            onClick={() => onEstadoChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:flex-none">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            className="h-9 rounded-full pl-9"
            aria-label="Filtrar desde fecha"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>
    </div>
  )
}
