"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarClock, Map, Package, Plus, Route } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { CrudAsyncState } from "@/components/admin/crud/crud-async-state"
import { CrudStatsGrid } from "@/components/admin/crud/crud-stats-grid"
import { Button } from "@/components/ui/button"
import { ViajesFilters } from "@/features/viajes/components/viajes-filters"
import { ViajesTable } from "@/features/viajes/components/viajes-table"
import { fetchViajes } from "@/features/viajes/api"
import { computeViajeStats } from "@/features/viajes/utils"
import { useCrudList } from "@/hooks/use-crud-list"
import type { ViajeEstadoFiltro, ViajeListFilters } from "@/types/viaje"

export function ViajesListPage() {
  const router = useRouter()
  const [estado, setEstado] = useState<ViajeEstadoFiltro>("todos")
  const [fecha, setFecha] = useState("")

  const filters = useMemo<ViajeListFilters>(
    () => ({
      estado,
      fecha: fecha || undefined,
    }),
    [estado, fecha]
  )

  const { data, status, error, reload, isLoading } = useCrudList({
    fetchFn: fetchViajes,
    filters,
  })

  const stats = useMemo(() => computeViajeStats(data), [data])

  useEffect(() => {
    if (status === "error" && error?.includes("Sesión expirada")) {
      router.push("/")
    }
  }, [status, error, router])

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Viajes"
        description="Gestiona salidas, buses asignados y lotes de QR para cada recorrido."
        actions={
          <Button asChild className="rounded-full shadow-md shadow-primary/25">
            <Link href="/admin/viajes/crear">
              <Plus className="h-4 w-4" />
              Crear viaje
            </Link>
          </Button>
        }
      />

      <CrudStatsGrid
        items={[
          {
            label: "Total viajes",
            value: stats.total,
            hint: "Registros en esta vista",
            icon: <Route className="h-5 w-5" />,
            accent: "primary",
          },
          {
            label: "Próximos",
            value: stats.proximos,
            hint: "Salidas pendientes",
            icon: <CalendarClock className="h-5 w-5" />,
            accent: "secondary",
          },
          {
            label: "Finalizados",
            value: stats.pasados,
            hint: "Viajes ya realizados",
            icon: <Map className="h-5 w-5" />,
            accent: "accent",
          }
        ]}
      />

      <ViajesFilters
        estado={estado}
        fecha={fecha}
        onEstadoChange={setEstado}
        onFechaChange={setFecha}
        onRefresh={reload}
        isLoading={isLoading}
      />

      <CrudAsyncState
        status={status}
        error={error}
        isEmpty={data.length === 0}
        onRetry={reload}
        emptyIcon={<Map className="h-5 w-5" />}
        emptyTitle="Aún no hay viajes"
        emptyDescription="Crea el primer viaje para comenzar a generar asientos y lotes QR."
        emptyAction={
          <Button asChild>
            <Link href="/admin/viajes/crear">
              <Plus className="h-4 w-4" />
              Crear primer viaje
            </Link>
          </Button>
        }
      >
        <ViajesTable viajes={data} />
      </CrudAsyncState>
    </AdminPageShell>
  )
}
