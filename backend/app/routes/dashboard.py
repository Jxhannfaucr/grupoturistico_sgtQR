"use client"

import { useState, useEffect } from "react"
import {
  Bus,
  CalendarCheck,
  CheckCircle,
  MapPin,
  Ticket,
  TrendingUp,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

type DashboardStats = {
  viajes_activos: number
  viajes_realizados: number
  total_buses: number
  total_tickets: number
  vendidos: number
  proximo_viaje: {
    id: number
    nombre: string
    fecha_salida: string
    hora_salida: string
  } | null
}

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function formatFecha(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
  })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_URL}/api/dashboard/stats`, {
          headers: getAuthHeaders(),
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error("Error cargando estadísticas:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="max-w-md lg:max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl" />
            ))}
          </div>
          <div className="h-24 bg-muted rounded-2xl mt-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md lg:max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Panel de control SGT-QR</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Viajes activos"
          value={stats?.viajes_activos ?? 0}
          color="blue"
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Realizados"
          value={stats?.viajes_realizados ?? 0}
          color="emerald"
        />
        <StatCard
          icon={<Bus className="h-5 w-5" />}
          label="Buses"
          value={stats?.total_buses ?? 0}
          color="violet"
        />
        <StatCard
          icon={<Ticket className="h-5 w-5" />}
          label="Tickets totales"
          value={stats?.total_tickets ?? 0}
          color="amber"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Vendidos"
          value={stats?.vendidos ?? 0}
          color="rose"
        />
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Próximo viaje
            </span>
          </div>
          {stats?.proximo_viaje ? (
            <>
              <p className="text-base font-bold text-foreground line-clamp-1">
                {stats.proximo_viaje.nombre}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFecha(stats.proximo_viaje.fecha_salida)} · {stats.proximo_viaje.hora_salida}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin programar</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: "blue" | "emerald" | "violet" | "amber" | "rose"
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    violet: "bg-violet-500/10 text-violet-600",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}