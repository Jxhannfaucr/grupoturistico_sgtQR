"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import {
  Calendar,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  Hash,
  Loader2,
  MoreHorizontal,
  Package,
  RefreshCw,
  Route,
  ScanLine,
  Search,
  Ticket as TicketIcon,
  Users,
  XCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// ─── Types ─────────────────────────────────────────────────
type TicketData = {
  id: number
  nombre_pasajero: string
  email_pasajero?: string | null
  qr_hash: string
  estado: "valido" | "usado" | "cancelado"
  numero_asiento?: string | null
  viaje_nombre?: string | null
  viaje_id?: number | null
  token_codigo?: string | null
  escaneado_en?: string | null
  creado_en?: string | null
}

type EstadoFiltro = "todos" | "valido" | "usado" | "cancelado"

// ─── Helpers ───────────────────────────────────────────────
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    Swal.fire({
      title: "Copiado",
      text: `"${text}" copiado al portapapeles.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    })
  })
}

const ESTADO_OPTIONS: { value: EstadoFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "valido", label: "Válidos" },
  { value: "usado", label: "Usados" },
  { value: "cancelado", label: "Cancelados" },
]

const ESTADO_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  valido: { variant: "default", label: "Válido" },
  usado: { variant: "secondary", label: "Usado" },
  cancelado: { variant: "destructive", label: "Cancelado" },
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function TicketsPage() {
  const router = useRouter()

  // ── Data state ───────────────────────────────────────────
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // ── Filters ──────────────────────────────────────────────
  const [estado, setEstado] = useState<EstadoFiltro>("todos")
  const [busqueda, setBusqueda] = useState("")
  const [viajeFilter, setViajeFilter] = useState<string>("todos")

  // ── Fetch tickets ────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch(`${API_URL}/api/tickets`, {
        headers: getAuthHeaders(),
      })
      if (res.status === 401) {
        setErrorMsg("Sesión expirada")
        setStatus("error")
        return
      }
      if (!res.ok) throw new Error("Error al cargar tickets")
      const data: TicketData[] = await res.json()
      setTickets(data)
      setStatus("success")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error de conexión")
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    if (status === "error" && errorMsg.includes("Sesión expirada")) {
      router.push("/")
    }
  }, [status, errorMsg, router])

  // ── Filtered list ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = tickets

    if (estado !== "todos") {
      result = result.filter((t) => t.estado === estado)
    }

    if (viajeFilter !== "todos") {
      result = result.filter((t) => String(t.viaje_id) === viajeFilter)
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      result = result.filter(
        (t) =>
          t.nombre_pasajero.toLowerCase().includes(q) ||
          (t.email_pasajero?.toLowerCase().includes(q) ?? false) ||
          t.qr_hash.toLowerCase().includes(q) ||
          (t.numero_asiento?.includes(q) ?? false)
      )
    }

    return result
  }, [tickets, estado, viajeFilter, busqueda])

  // ── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tickets.length
    const validos = tickets.filter((t) => t.estado === "valido").length
    const usados = tickets.filter((t) => t.estado === "usado").length
    const cancelados = tickets.filter((t) => t.estado === "cancelado").length
    return { total, validos, usados, cancelados }
  }, [tickets])

  // ── Unique viajes for filter ─────────────────────────────
  const viajesEnTickets = useMemo(() => {
    const map = new Map<number, string>()
    tickets.forEach((t) => {
      if (t.viaje_id && t.viaje_nombre) map.set(t.viaje_id, t.viaje_nombre)
    })
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [tickets])

  // ── Cancelar ticket ──────────────────────────────────────
  async function handleCancelar(ticket: TicketData) {
    const result = await Swal.fire({
      title: `¿Cancelar ticket de ${ticket.nombre_pasajero}?`,
      text: `Asiento #${ticket.numero_asiento}. Se liberará el asiento y se devolverá capacidad al lote.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#171717",
      confirmButtonText: "Sí, cancelar ticket",
      cancelButtonText: "No, mantener",
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket.id}/cancelar`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "No se pudo cancelar.")
      }

      Swal.fire({
        title: "Cancelado",
        text: "Ticket cancelado y asiento liberado.",
        icon: "success",
        confirmButtonColor: "#171717",
      })

      fetchTickets()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo cancelar el ticket.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Tickets"
        description="Consulta y gestiona los tickets emitidos para cada viaje."
      />

      {/* ── Stats Cards ── */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TicketIcon className="h-5 w-5" />}
          label="Total tickets"
          value={stats.total}
          hint="Emitidos en el sistema"
          accent="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Válidos"
          value={stats.validos}
          hint="Pendientes de uso"
          accent="success"
        />
        <StatCard
          icon={<ScanLine className="h-5 w-5" />}
          label="Usados"
          value={stats.usados}
          hint="Escaneados al abordar"
          accent="secondary"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label="Cancelados"
          value={stats.cancelados}
          hint="Tickets anulados"
          accent="destructive"
        />
      </div>

      {/* ── Filters ── */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Estado pills */}
          {ESTADO_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={estado === opt.value ? "default" : "outline"}
              className={cn(
                "rounded-full",
                estado === opt.value && "shadow-sm shadow-primary/20"
              )}
              onClick={() => setEstado(opt.value)}
            >
              {opt.label}
            </Button>
          ))}

          {/* Viaje select */}
          <Select value={viajeFilter} onValueChange={setViajeFilter}>
            <SelectTrigger className="h-9 w-[180px] rounded-full">
              <Route className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Viaje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los viajes</SelectItem>
              {viajesEnTickets.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar nombre, correo, QR…"
              className="h-9 rounded-full pl-9"
              aria-label="Buscar ticket"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={fetchTickets}
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
        {status === "loading" && tickets.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Cargando tickets…</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-16">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={fetchTickets}>
              Reintentar
            </Button>
          </div>
        )}

        {status === "success" && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <TicketIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">No hay tickets</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Los tickets se generan cuando los clientes reservan desde el link del lote.
              </p>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-5">Pasajero</TableHead>
                  <TableHead>Asiento</TableHead>
                  <TableHead>Viaje</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="pr-5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ticket) => {
                  const badgeInfo = ESTADO_BADGE[ticket.estado] ?? {
                    variant: "outline" as const,
                    label: ticket.estado,
                  }

                  return (
                    <TableRow key={ticket.id} className="group">
                      {/* Pasajero */}
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">
                              {ticket.nombre_pasajero}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.email_pasajero || "Sin correo"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Asiento */}
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-sm font-semibold">
                          #{ticket.numero_asiento ?? "—"}
                        </Badge>
                      </TableCell>

                      {/* Viaje */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {ticket.viaje_nombre ?? "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Lote */}
                      <TableCell>
                        {ticket.token_codigo ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(ticket.token_codigo!)}
                                  className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Package className="h-3 w-3" />
                                  {ticket.token_codigo}
                                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Copiar código de lote</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* QR Hash */}
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(ticket.qr_hash)}
                                className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                {ticket.qr_hash.slice(0, 8)}…
                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {ticket.qr_hash} — click para copiar
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <Badge variant={badgeInfo.variant}>
                          {badgeInfo.label}
                        </Badge>
                      </TableCell>

                      {/* Fecha */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatFecha(ticket.creado_en)}
                          </div>
                          {ticket.escaneado_en && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                              <ScanLine className="h-3 w-3" />
                              {formatFecha(ticket.escaneado_en)}
                            </div>
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
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(ticket.qr_hash)}
                            >
                              <ClipboardCopy className="mr-2 h-4 w-4" />
                              Copiar QR hash
                            </DropdownMenuItem>
                            {ticket.estado === "valido" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleCancelar(ticket)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancelar ticket
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
    </AdminPageShell>
  )
}

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════
function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  hint: string
  accent: "primary" | "secondary" | "accent" | "success" | "destructive"
}) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-amber-500/10 text-amber-600",
    success: "bg-emerald-500/10 text-emerald-600",
    destructive: "bg-destructive/10 text-destructive",
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          colors[accent]
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}