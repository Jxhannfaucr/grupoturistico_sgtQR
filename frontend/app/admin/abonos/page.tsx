"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import {
  Ban,
  ClipboardCopy,
  Copy,
  CreditCard,
  Loader2,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Route,
  Search,
  Ticket,
  User,
  Users,
  Wallet,
} from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatCurrency, formatViajeFecha, isViajeProximo } from "@/lib/format"

import { StatCard } from "../tokens/components/stat-card"
import {
  AbonoPlanCreateDialog,
  type AbonoPlanFormValues,
} from "@/features/viajes/components/abono-plan-create-dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// ─── Types ─────────────────────────────────────────────────
type AbonoViaje = {
  id: number
  nombre: string
}

type AbonoPlan = {
  id: number
  viaje_id: number
  cliente_nombre: string
  telefono: string | null
  cantidad_asientos_proyectados: number
  precio_total: number
  estado: "activo" | "completado" | "cancelado"
  total_abonado: number
  saldo_pendiente: number
  porcentaje_completado: number
  token_id: number | null
  token_codigo: string | null
  creado_en: string | null
  viaje: AbonoViaje | null
}

type Viaje = {
  id: number
  nombre: string
}

// ─── Helpers ───────────────────────────────────────────────
function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    Swal.fire({
      title: "Copiado",
      text: `Código "${text}" copiado al portapapeles.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    })
  })
}

function estadoBadgeVariant(estado: AbonoPlan["estado"]) {
  if (estado === "completado") return "default" as const
  if (estado === "cancelado") return "destructive" as const
  return "secondary" as const
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function AbonosPage() {
  const router = useRouter()

  // ── Data state ───────────────────────────────────────────
  const [planes, setPlanes] = useState<AbonoPlan[]>([])
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // ── Filters ──────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("")
  const [viajeFilter, setViajeFilter] = useState<string>("todos")
  const [incluirPasados, setIncluirPasados] = useState(false)

  // ── Dialog state ─────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Fetch abonos ─────────────────────────────────────────
  const fetchPlanes = useCallback(async () => {
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch(
        `${API_URL}/api/abonos/?incluir_pasados=${incluirPasados}`,
        { headers: getAuthHeaders() }
      )
      if (res.status === 401) {
        setErrorMsg("Sesión expirada")
        setStatus("error")
        return
      }
      if (!res.ok) throw new Error("Error al cargar los planes de abono")
      const data: AbonoPlan[] = await res.json()
      setPlanes(data)
      setStatus("success")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error de conexión")
      setStatus("error")
    }
  }, [incluirPasados])

  // ── Fetch viajes (solo próximos y no cancelados para el select del form) ──
  const fetchViajes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/viajes`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        const viajesDisponibles = data
          .filter((v: any) => v.estado !== "cancelado" && isViajeProximo(v.fecha_salida))
          .map((v: any) => ({ id: v.id, nombre: v.nombre }))
        setViajes(viajesDisponibles)
      }
    } catch {
      // silenciar — no es crítico
    }
  }, [])

  useEffect(() => {
    fetchPlanes()
  }, [fetchPlanes])

  useEffect(() => {
    fetchViajes()
  }, [fetchViajes])

  useEffect(() => {
    if (status === "error" && errorMsg.includes("Sesión expirada")) {
      router.push("/")
    }
  }, [status, errorMsg, router])

  // ── Filtered list ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = planes

    if (viajeFilter !== "todos") {
      const vid = Number(viajeFilter)
      result = result.filter((p) => p.viaje_id === vid)
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      result = result.filter(
        (p) =>
          p.cliente_nombre.toLowerCase().includes(q) ||
          p.viaje?.nombre.toLowerCase().includes(q) ||
          p.token_codigo?.toLowerCase().includes(q)
      )
    }

    return result
  }, [planes, viajeFilter, busqueda])

  // ── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activos = planes.filter((p) => p.estado === "activo").length
    const completados = planes.filter((p) => p.estado === "completado").length
    const totalProyectado = planes.reduce((s, p) => s + p.precio_total, 0)
    const totalAbonado = planes.reduce((s, p) => s + p.total_abonado, 0)
    return { activos, completados, totalProyectado, totalAbonado }
  }, [planes])

  // ── Unique viajes en la lista para el filtro ─────────────
  const viajesEnPlanes = useMemo(() => {
    const map = new Map<number, string>()
    planes.forEach((p) => {
      if (p.viaje) map.set(p.viaje.id, p.viaje.nombre)
    })
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [planes])

  // ── CRUD handlers ────────────────────────────────────────
  async function handleCreate(values: AbonoPlanFormValues) {
    setIsSubmitting(true)
    try {
      const body = {
        viaje_id: values.viaje_id,
        cliente_nombre: values.cliente_nombre,
        telefono: values.telefono?.trim() ? values.telefono.trim() : null,
        cantidad_asientos_proyectados: values.cantidad_asientos_proyectados,
        precio_total: values.precio_total,
      }

      const res = await fetch(`${API_URL}/api/abonos/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.detail ?? "Error al crear el plan de abono")
      }

      Swal.fire({
        title: "Plan creado",
        text: "El plan de abono fue registrado exitosamente.",
        icon: "success",
        confirmButtonColor: "#171717",
      })

      setCreateOpen(false)
      fetchPlanes()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo crear el plan.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRegistrarPago(plan: AbonoPlan) {
    const { value: monto } = await Swal.fire({
      title: "Registrar pago",
      html: `
        <div style="text-align:left; font-size:14px; margin-bottom:10px;">
          <p><strong>Cliente:</strong> ${plan.cliente_nombre}</p>
          <p><strong>Viaje:</strong> ${plan.viaje?.nombre ?? "—"}</p>
          <p><strong>Saldo pendiente:</strong> ${formatCurrency(plan.saldo_pendiente)}</p>
        </div>
      `,
      input: "number",
      inputLabel: "Monto abonado",
      inputAttributes: { min: "0.01", step: "0.01" },
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) {
          return "Ingrese un monto válido mayor a 0"
        }
        return undefined
      },
      showCancelButton: true,
      confirmButtonText: "Registrar pago",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#171717",
      cancelButtonColor: "#6b7280",
    })

    if (monto === undefined || monto === null || monto === "") return

    try {
      const res = await fetch(`${API_URL}/api/abonos/${plan.id}/pagos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ monto: Number(monto) }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.detail ?? "No se pudo registrar el pago.")
      }

      const data = await res.json()

      if (data.token_codigo) {
        await Swal.fire({
          title: "¡Plan completado!",
          html: `El abono llegó al 100%. Token generado: <strong class="font-mono text-lg">${data.token_codigo}</strong>`,
          icon: "success",
          confirmButtonColor: "#171717",
        })
      } else {
        await Swal.fire({
          title: "Pago registrado",
          text: "El abono fue actualizado correctamente.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        })
      }

      fetchPlanes()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo registrar el pago.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    }
  }

  async function handleCancelar(plan: AbonoPlan) {
    const result = await Swal.fire({
      title: `¿Cancelar el abono de "${plan.cliente_nombre}"?`,
      text: "Esta acción solo cambia el estado del plan a cancelado; los pagos ya registrados no se revierten.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#171717",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`${API_URL}/api/abonos/${plan.id}/cancelar`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.detail ?? "No se pudo cancelar el plan.")
      }

      Swal.fire({
        title: "Cancelado",
        text: "El plan de abono fue cancelado.",
        icon: "success",
        confirmButtonColor: "#171717",
      })

      fetchPlanes()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo cancelar el plan.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Abonos"
        description="Controla los planes de pago por cuotas. El inventario de asientos se administra manualmente hasta que un plan se completa al 100%."
        actions={
          <Button
            className="rounded-full shadow-md shadow-primary/25"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo plan de abono
          </Button>
        }
      />

      {/* ── Stats Cards ── */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Planes activos"
          value={stats.activos}
          hint="En proceso de pago"
          accent="primary"
        />
        <StatCard
          icon={<Ticket className="h-5 w-5" />}
          label="Planes completados"
          value={stats.completados}
          hint="Token generado"
          accent="success"
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Total abonado"
          value={formatCurrency(stats.totalAbonado)}
          hint="Suma de todos los pagos"
          accent="secondary"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total proyectado"
          value={formatCurrency(stats.totalProyectado)}
          hint="Suma de precios de los planes"
          accent="accent"
        />
      </div>

      {/* ── Filters ── */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={viajeFilter} onValueChange={setViajeFilter}>
            <SelectTrigger className="h-9 w-[200px] rounded-full">
              <Route className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por viaje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los viajes</SelectItem>
              {viajesEnPlanes.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              id="incluir-pasados"
              checked={incluirPasados}
              onCheckedChange={setIncluirPasados}
            />
            <Label htmlFor="incluir-pasados" className="text-sm text-muted-foreground">
              Incluir viajes finalizados/cancelados
            </Label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, viaje o token…"
              className="h-9 rounded-full pl-9"
              aria-label="Buscar plan de abono"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={fetchPlanes}
            disabled={status === "loading"}
          >
            <RefreshCw
              className={cn("mr-1 h-4 w-4", status === "loading" && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mt-4">
        {status === "loading" && planes.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Cargando planes de abono…</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-16">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={fetchPlanes}>
              Reintentar
            </Button>
          </div>
        )}

        {status === "success" && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">No hay planes de abono</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {incluirPasados
                  ? "Crea el primer plan para llevar el control de pagos de un cliente."
                  : "Crea el primer plan, o activa \"Incluir viajes finalizados/cancelados\" si esperabas ver un plan de un viaje que ya pasó."}
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer plan
            </Button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-5">Cliente</TableHead>
                  <TableHead>Viaje</TableHead>
                  <TableHead>Asientos proyectados</TableHead>
                  <TableHead>Precio total</TableHead>
                  <TableHead>Total abonado</TableHead>
                  <TableHead>Saldo pendiente</TableHead>
                  <TableHead className="w-40">Progreso</TableHead>
                  <TableHead>Estado / Token</TableHead>
                  <TableHead className="pr-5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((plan) => {
                  const pct = Math.min(plan.porcentaje_completado, 100)
                  const barColor =
                    plan.estado === "cancelado"
                      ? "bg-muted-foreground/40"
                      : pct >= 100
                        ? "bg-emerald-500"
                        : pct > 60
                          ? "bg-amber-500"
                          : "bg-primary"

                  return (
                    <TableRow key={plan.id} className="group">
                      {/* Cliente */}
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">{plan.cliente_nombre}</p>
                            {plan.telefono && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {plan.telefono}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Viaje */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{plan.viaje?.nombre ?? "Sin viaje"}</span>
                        </div>
                      </TableCell>

                      {/* Asientos proyectados */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {plan.cantidad_asientos_proyectados}
                          </span>
                        </div>
                      </TableCell>

                      {/* Precio total */}
                      <TableCell>
                        <span className="text-sm">{formatCurrency(plan.precio_total)}</span>
                      </TableCell>

                      {/* Total abonado */}
                      <TableCell>
                        <span className="text-sm font-medium text-emerald-700">
                          {formatCurrency(plan.total_abonado)}
                        </span>
                      </TableCell>

                      {/* Saldo pendiente */}
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            plan.saldo_pendiente > 0 ? "text-amber-700" : "text-muted-foreground"
                          )}
                        >
                          {formatCurrency(plan.saldo_pendiente)}
                        </span>
                      </TableCell>

                      {/* Progreso */}
                      <TableCell>
                        <div className="w-32 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full transition-all", barColor)}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Estado / Token */}
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={estadoBadgeVariant(plan.estado)} className="capitalize">
                            {plan.estado}
                          </Badge>
                          {plan.estado === "completado" && plan.token_codigo && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(plan.token_codigo as string)}
                              className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {plan.token_codigo}
                              <Copy className="h-3 w-3 opacity-60" />
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="pr-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-70 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {plan.estado === "activo" && (
                              <DropdownMenuItem onClick={() => handleRegistrarPago(plan)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Registrar pago
                              </DropdownMenuItem>
                            )}
                            {plan.estado === "completado" && plan.token_codigo && (
                              <DropdownMenuItem
                                onClick={() => copyToClipboard(plan.token_codigo as string)}
                              >
                                <ClipboardCopy className="mr-2 h-4 w-4" />
                                Copiar código de token
                              </DropdownMenuItem>
                            )}
                            {plan.estado === "activo" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleCancelar(plan)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Cancelar abono
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Create Dialog ── */}
      <AbonoPlanCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        viajes={viajes}
      />
    </AdminPageShell>
  )
}
