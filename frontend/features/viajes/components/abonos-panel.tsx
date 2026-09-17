"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  Ticket as TicketIcon,
  Users,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatCurrency, formatViajeFecha } from "@/lib/format"

import {
  AbonoPlanCreateDialog,
  type AbonoPlanFormValues,
} from "./abono-plan-create-dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// ─── Types ─────────────────────────────────────────────────
type AbonoMovimiento = {
  id: number
  monto: number
  fecha: string | null
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
  movimientos: AbonoMovimiento[]
}

type AbonosPanelProps = {
  viajeId: number
  precioSugerido?: number
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
// PANEL PRINCIPAL
// ═══════════════════════════════════════════════════════════
export function AbonosPanel({ viajeId, precioSugerido }: AbonosPanelProps) {
  const [planes, setPlanes] = useState<AbonoPlan[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPlanes = useCallback(async () => {
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch(
        `${API_URL}/api/abonos/viaje/${viajeId}?incluir_pasados=true`,
        { headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error("Error al cargar los planes de abono")
      const data: AbonoPlan[] = await res.json()
      setPlanes(data)
      setStatus("success")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error de conexión")
      setStatus("error")
    }
  }, [viajeId])

  useEffect(() => {
    fetchPlanes()
  }, [fetchPlanes])

  const stats = useMemo(() => {
    const activos = planes.filter((p) => p.estado === "activo")
    const totalProyectado = planes.reduce((s, p) => s + p.precio_total, 0)
    const totalAbonado = planes.reduce((s, p) => s + p.total_abonado, 0)
    return {
      activos: activos.length,
      completados: planes.filter((p) => p.estado === "completado").length,
      totalProyectado,
      totalAbonado,
    }
  }, [planes])

  async function handleCreate(values: AbonoPlanFormValues) {
    setIsSubmitting(true)
    try {
      const body = {
        viaje_id: viajeId,
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

  return (
    <div className="space-y-4">
      {/* Stats rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.activos}</p>
            <p className="text-sm text-muted-foreground">Planes activos</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700">
            <TicketIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-950">{stats.completados}</p>
            <p className="text-sm text-emerald-900">Planes completados</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalAbonado)}
            </p>
            <p className="text-sm text-muted-foreground">
              Abonado de {formatCurrency(stats.totalProyectado)}
            </p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Control manual de inventario: los planes de abono no reservan asientos.
        </p>
        <Button
          className="rounded-full shadow-md shadow-primary/25"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo plan de abono
        </Button>
      </div>

      {/* Contenido */}
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

      {status === "success" && planes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">No hay planes de abono</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea el primer plan para llevar el control de pagos de este viaje.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear primer plan
          </Button>
        </div>
      )}

      {planes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-5">Cliente</TableHead>
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
              {planes.map((plan) => {
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
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground">{plan.cliente_nombre}</p>
                        {plan.telefono && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {plan.telefono}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Creado {formatViajeFecha(plan.creado_en ?? "")}
                        </p>
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

      <AbonoPlanCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        precioSugerido={precioSugerido}
        viajeId={viajeId}
      />
    </div>
  )
}
