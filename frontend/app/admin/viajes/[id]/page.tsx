"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, DollarSign, TrendingDown, Activity } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSeatMap, AdminSeatData } from "@/features/viajes/components/admin-seat-map"
import { AbonosPanel } from "@/features/viajes/components/abonos-panel"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

type ViajeDetalle = {
  viaje_id: number
  precio: number
  total_asientos: number
  tipo_plantilla: string
  mapa: AdminSeatData[]
}

// Helper para formato de moneda
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function ViajeDetallePage() {
  const params = useParams()
  const router = useRouter()
  const viajeId = params.id as string

  const [data, setData] = useState<ViajeDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchDetalles() {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) throw new Error("No hay sesión activa")

        const res = await fetch(`${API_URL}/api/viajes/${viajeId}/asientos-admin`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (!res.ok) {
          throw new Error("Error al cargar los detalles del viaje")
        }

        const jsonData = await res.json()
        setData(jsonData)
      } catch (err: any) {
        setError(err.message || "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    if (viajeId) {
      fetchDetalles()
    }
  }, [viajeId])

  // Lógica Financiera
  const kpis = useMemo(() => {
    if (!data) return null
    const ocupados = data.mapa.filter(a => a.pasajero !== null).length
    const libres = data.total_asientos - ocupados
    const precio = data.precio

    return {
      ingresoBruto: ocupados * precio,
      lucroCesante: libres * precio,
      ocupacion: data.total_asientos > 0 ? Math.round((ocupados / data.total_asientos) * 100) : 0
    }
  }, [data])

  return (
    <AdminPageShell>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/viajes")} className="mb-2 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Viajes
        </Button>
        <AdminPageHeader
          title={`Control del Viaje #${viajeId}`}
          description="Rendimiento financiero y distribución logística de pasajeros."
        />
      </div>

      <div className="mt-2">
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-card border border-border/70 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Procesando datos del viaje...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-600">
            {error}
          </div>
        )}

        {data && kpis && (
          <div className="space-y-6">
            {/* Panel de Rendimiento Financiero */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-950">{formatCurrency(kpis.ingresoBruto)}</p>
                  <p className="text-sm font-medium text-emerald-900">Ingreso Bruto</p>
                  <p className="text-xs text-emerald-700/80">Capital confirmado en asientos</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-950">{formatCurrency(kpis.lucroCesante)}</p>
                  <p className="text-sm font-medium text-amber-900">Costo de Oportunidad</p>
                  <p className="text-xs text-amber-700/80">Capital perdido por asientos libres</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpis.ocupacion}%</p>
                  <p className="text-sm font-medium text-foreground">Rendimiento Operativo</p>
                  <p className="text-xs text-muted-foreground">Ocupación del vehículo</p>
                </div>
              </div>
            </div>

            {/* Asientos / Abonos */}
            <Tabs defaultValue="asientos">
              <TabsList>
                <TabsTrigger value="asientos">Mapa de asientos</TabsTrigger>
                <TabsTrigger value="abonos">Abonos</TabsTrigger>
              </TabsList>

              <TabsContent value="asientos" className="mt-4">
                <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 shadow-inner">
                  <AdminSeatMap
                    totalAsientos={data.total_asientos}
                    tipoPlantilla={data.tipo_plantilla}
                    asientosInfo={data.mapa}
                  />
                </div>
              </TabsContent>

              <TabsContent value="abonos" className="mt-4">
                <AbonosPanel viajeId={Number(viajeId)} precioSugerido={data.precio} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}