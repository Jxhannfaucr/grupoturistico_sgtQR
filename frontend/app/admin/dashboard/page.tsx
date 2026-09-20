"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  Gauge,
  HandCoins,
  MapPin,
  RefreshCw,
  Ticket,
  Wallet,
} from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { apiGet } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import { formatCurrency, formatViajeFecha } from "@/lib/format"
import { cn } from "@/lib/utils"

type DashboardStats = {
  ingresos_mes_actual: number
  ocupacion_global_porcentaje: number
  asientos_vendidos: number
  asientos_abonados: number
  capacidad_total: number
  saldo_pendiente_abonos: number
  tickets_mes_actual: number
  viajes_activos: number
  proximo_viaje: {
    id: number
    nombre: string
    fecha_salida: string
    asientos_restantes: number
  } | null
}

const porcentajeFormatter = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 })

function formatMesActual() {
  const mes = new Date().toLocaleDateString("es-CR", { month: "long", year: "numeric" })
  return mes.charAt(0).toUpperCase() + mes.slice(1)
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit", hour12: true })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  const fetchStats = useCallback(async () => {
    setStatus("loading")
    try {
      setStats(await apiGet<DashboardStats>("/api/stats/dashboard"))
      setStatus("ready")
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "No se pudieron cargar las estadísticas.")
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  const mesActual = stats ? formatMesActual() : ""

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Dashboard"
        description="Rendimiento del mes en curso: ingresos, ocupación y estado de tus viajes activos."
        actions={
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => void fetchStats()}
            disabled={status === "loading"}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", status === "loading" && "animate-spin")} />
            Actualizar
          </Button>
        }
      />

      {!stats && status === "loading" && <DashboardSkeleton />}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-16">
          <p className="text-sm text-destructive">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={() => void fetchStats()}>
            Reintentar
          </Button>
        </div>
      )}

      {stats && (
        <div className="space-y-8">
          <section>
            <SectionTitle>Finanzas y rendimiento · {mesActual}</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={<Wallet className="h-5 w-5" />}
                accent="emerald"
                label="Ingresos del mes"
                value={formatCurrency(stats.ingresos_mes_actual)}
                hint="Tiquetes al contado + abonos recibidos este mes"
              />
              <KpiCard
                icon={<HandCoins className="h-5 w-5" />}
                accent="amber"
                label="Saldo pendiente"
                value={formatCurrency(stats.saldo_pendiente_abonos)}
                hint="Deuda restante de los abonos activos"
              />
              <OcupacionCard stats={stats} />
              <KpiCard
                icon={<Ticket className="h-5 w-5" />}
                accent="blue"
                label="Tickets del mes"
                value={stats.tickets_mes_actual}
                hint="Emitidos este mes, sin contar cancelados"
              />
            </div>
          </section>

          <section>
            <SectionTitle>Operación</SectionTitle>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ProximoViajeCard viaje={stats.proximo_viaje} />
              <KpiCard
                icon={<MapPin className="h-5 w-5" />}
                accent="violet"
                label="Viajes activos"
                value={stats.viajes_activos}
                hint="Programados a futuro y no cancelados"
                footer={
                  <Button asChild variant="ghost" size="sm" className="-ml-3 w-fit rounded-full">
                    <Link href="/admin/viajes">
                      Ver todos los viajes
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                }
              />
            </div>
          </section>
        </div>
      )}
    </AdminPageShell>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  )
}

const ACCENTS = {
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
  blue: "bg-blue-500/10 text-blue-600",
  violet: "bg-violet-500/10 text-violet-600",
}

function KpiCard({
  icon,
  accent,
  label,
  value,
  hint,
  children,
  footer,
}: {
  icon: React.ReactNode
  accent: keyof typeof ACCENTS
  label: string
  value: React.ReactNode
  hint: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", ACCENTS[accent])}>
          {icon}
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
      {footer}
    </div>
  )
}

function OcupacionCard({ stats }: { stats: DashboardStats }) {
  const porcentaje = stats.ocupacion_global_porcentaje
  const sobreventa = porcentaje > 100

  return (
    <KpiCard
      icon={<Gauge className="h-5 w-5" />}
      accent="violet"
      label="Ocupación global"
      value={`${porcentajeFormatter.format(porcentaje)}%`}
      hint={
        stats.capacidad_total > 0 ? (
          <>
            {stats.asientos_vendidos} vendidos + {stats.asientos_abonados} abonados de{" "}
            {stats.capacidad_total} asientos
            {sobreventa && <span className="ml-1 font-medium text-destructive">· Sobreventa</span>}
          </>
        ) : (
          "Sin viajes activos con asientos"
        )
      }
    >
      <Progress value={Math.min(porcentaje, 100)} className="h-1.5" aria-label="Ocupación global" />
    </KpiCard>
  )
}

function ProximoViajeCard({ viaje }: { viaje: DashboardStats["proximo_viaje"] }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:col-span-2">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", ACCENTS.blue)}>
          <CalendarClock className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Próximo viaje</span>
      </div>

      {viaje ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="line-clamp-2 text-2xl font-bold tracking-tight text-foreground">{viaje.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {formatViajeFecha(viaje.fecha_salida)} · {formatHora(viaje.fecha_salida)}
              </p>
            </div>
            <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
              <p className="text-3xl font-bold tabular-nums text-foreground">{viaje.asientos_restantes}</p>
              {viaje.asientos_restantes === 0 ? (
                <Badge variant="destructive">Agotado</Badge>
              ) : (
                <p className="text-xs text-muted-foreground">asientos restantes</p>
              )}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="w-fit rounded-full">
            <Link href={`/admin/viajes/${viaje.id}`}>
              Ver control del viaje
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">No hay viajes programados a futuro.</p>
          <Button asChild variant="outline" size="sm" className="w-fit rounded-full">
            <Link href="/admin/viajes/crear">
              Crear viaje
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-hidden>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-44 rounded-2xl bg-muted lg:col-span-2" />
        <div className="h-44 rounded-2xl bg-muted" />
      </div>
    </div>
  )
}
