"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import {
  Calendar,
  ClipboardCopy,
  Copy,
  Hash,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Search,
  Ticket,
  Trash2,
  User,
  Users,
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

import { StatCard } from "./components/stat-card"
import { TokenCreateDialog } from "./components/token-create-dialog"
import { TokenEditDialog } from "./components/token-edit-dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// ─── Types ─────────────────────────────────────────────────
type TokenViaje = {
  id: number
  nombre: string
}

type Token = {
  id: number
  viaje_id: number
  codigo: string
  capacidad_total: number
  capacidad_usada: number
  capacidad_disponible: number
  cliente?: string | null
  creado_por?: number | null
  creado_en?: string | null
  viaje?: TokenViaje | null
}

type Viaje = {
  id: number
  nombre: string
}

export type CreateFormValues = {
  viaje_id: number
  capacidad_total: number
  cliente?: string
}

export type EditFormValues = {
  capacidad_total: number
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

function formatFecha(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
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

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function TokensPage() {
  const router = useRouter()

  // ── Data state ───────────────────────────────────────────
  const [tokens, setTokens] = useState<Token[]>([])
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // ── Filters ──────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("")
  const [viajeFilter, setViajeFilter] = useState<string>("todos")

  // ── Dialog state ─────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [editingToken, setEditingToken] = useState<Token | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Fetch tokens ─────────────────────────────────────────
  const fetchTokens = useCallback(async () => {
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch(`${API_URL}/api/tokens`, {
        headers: getAuthHeaders(),
      })
      if (res.status === 401) {
        setErrorMsg("Sesión expirada")
        setStatus("error")
        return
      }
      if (!res.ok) throw new Error("Error al cargar tokens")
      const data: Token[] = await res.json()
      setTokens(data)
      setStatus("success")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error de conexión")
      setStatus("error")
    }
  }, [])

  // ── Fetch viajes (solo activos para el select del form) ──
  const fetchViajes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/viajes`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        const viajesActivos = data
          .filter((v: any) => v.estado !== "cancelado")
          .map((v: any) => ({ id: v.id, nombre: v.nombre }))
        setViajes(viajesActivos)
      }
    } catch {
      // silenciar — no es crítico
    }
  }, [])

  useEffect(() => {
    fetchTokens()
    fetchViajes()
  }, [fetchTokens, fetchViajes])

  useEffect(() => {
    if (status === "error" && errorMsg.includes("Sesión expirada")) {
      router.push("/")
    }
  }, [status, errorMsg, router])

  // ── Filtered list ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = tokens

    if (viajeFilter !== "todos") {
      const vid = Number(viajeFilter)
      result = result.filter((t) => t.viaje_id === vid)
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      result = result.filter(
        (t) =>
          t.codigo.toLowerCase().includes(q) ||
          t.viaje?.nombre.toLowerCase().includes(q)
      )
    }

    return result
  }, [tokens, viajeFilter, busqueda])

  // ── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tokens.length
    const asignadosTotal = tokens.reduce((s, t) => s + t.capacidad_total, 0)
    const usados = tokens.reduce((s, t) => s + t.capacidad_usada, 0)
    const disponibles = asignadosTotal - usados
    return { total, asignadosTotal, usados, disponibles }
  }, [tokens])

  // ── CRUD handlers ────────────────────────────────────────
  async function handleCreate(values: CreateFormValues) {
    setIsSubmitting(true)
    try {
      const body: any = {
        viaje_id: values.viaje_id,
        capacidad_total: values.capacidad_total,
      }

      if (values.cliente?.trim()) {
        body.cliente = values.cliente.trim()
      }

      const res = await fetch(`${API_URL}/api/tokens`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "Error al crear el token")
      }

      const data = await res.json()

      Swal.fire({
        title: "Token creado",
        html: `Código generado: <strong class="font-mono text-lg">${data.token.codigo}</strong>`,
        icon: "success",
        confirmButtonColor: "#171717",
      })

      setCreateOpen(false)
      fetchTokens()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo crear el token.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit(values: EditFormValues) {
    if (!editingToken) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/tokens/${editingToken.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "Error al actualizar")
      }

      Swal.fire({
        title: "Éxito",
        text: "Token actualizado correctamente.",
        icon: "success",
        confirmButtonColor: "#171717",
      })

      setEditingToken(null)
      fetchTokens()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo actualizar.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(token: Token) {
    const result = await Swal.fire({
      title: `¿Eliminar token "${token.codigo}"?`,
      text:
        token.capacidad_usada > 0
          ? `Este token tiene ${token.capacidad_usada} ticket(s) emitido(s) y no se puede eliminar.`
          : "Esta acción no se puede deshacer.",
      icon: token.capacidad_usada > 0 ? "error" : "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#171717",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      showConfirmButton: token.capacidad_usada === 0,
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`${API_URL}/api/tokens/${token.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "No se pudo eliminar.")
      }

      Swal.fire({
        title: "Eliminado",
        text: `Token "${token.codigo}" eliminado del sistema.`,
        icon: "success",
        confirmButtonColor: "#171717",
      })

      fetchTokens()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo eliminar.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    }
  }

  // ── Unique viajes for filter dropdown ────────────────────
  const viajesEnTokens = useMemo(() => {
    const map = new Map<number, string>()
    tokens.forEach((t) => {
      if (t.viaje) map.set(t.viaje.id, t.viaje.nombre)
    })
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [tokens])

  // ── Render ───────────────────────────────────────────────
  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Tokens"
        description="Administra los tokens de QR asignados a cada viaje. Cada token tiene un código único para generar tickets."
        actions={
          <Button
            className="rounded-full shadow-md shadow-primary/25"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear token
          </Button>
        }
      />

      {/* ── Stats Cards ── */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Total tokens"
          value={stats.total}
          hint="Tokens creados"
          accent="primary"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Asientos asignados"
          value={stats.asignadosTotal}
          hint="En todos los tokens"
          accent="secondary"
        />
        <StatCard
          icon={<Ticket className="h-5 w-5" />}
          label="Tickets emitidos"
          value={stats.usados}
          hint="Capacidad usada"
          accent="accent"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Disponibles"
          value={stats.disponibles}
          hint="Sin usar en tokens"
          accent="success"
        />
      </div>

      {/* ── Filters ── */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={viajeFilter} onValueChange={setViajeFilter}>
            <SelectTrigger className="h-9 w-[200px] rounded-full">
              <Route className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por viaje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los viajes</SelectItem>
              {viajesEnTokens.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o viaje…"
              className="h-9 rounded-full pl-9"
              aria-label="Buscar token"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={fetchTokens}
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
        {status === "loading" && tokens.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Cargando tokens…</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-16">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={fetchTokens}>
              Reintentar
            </Button>
          </div>
        )}

        {status === "success" && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">No hay tokens registrados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea el primer token para comenzar a generar tickets QR.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer token
            </Button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-5">Código</TableHead>
                  <TableHead>Viaje</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="pr-5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((token) => {
                  const pct =
                    token.capacidad_total > 0
                      ? Math.round(
                          (token.capacidad_usada / token.capacidad_total) * 100
                        )
                      : 0
                  const lleno = token.capacidad_disponible === 0

                  return (
                    <TableRow key={token.id} className="group">
                      {/* Código */}
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(token.codigo)}
                                    className="flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground hover:text-primary transition-colors"
                                  >
                                    {token.codigo}
                                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Copiar código</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <p className="text-xs text-muted-foreground">
                              <Hash className="mr-0.5 inline h-3 w-3" />
                              {token.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Viaje */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {token.viaje?.nombre ?? "Sin viaje"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Cliente */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {token.cliente || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Capacidad */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {token.capacidad_total}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            asientos
                          </span>
                        </div>
                      </TableCell>

                      {/* Uso (barra de progreso) */}
                      <TableCell>
                        <div className="w-32 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {token.capacidad_usada}/{token.capacidad_total}
                            </span>
                            <Badge
                              variant={lleno ? "destructive" : pct > 70 ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {pct}%
                            </Badge>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                lleno
                                  ? "bg-destructive"
                                  : pct > 70
                                    ? "bg-amber-500"
                                    : "bg-primary"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Creado */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatFecha(token.creado_en)}
                          </span>
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
                              onClick={() => copyToClipboard(token.codigo)}
                            >
                              <ClipboardCopy className="mr-2 h-4 w-4" />
                              Copiar código
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditingToken(token)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar capacidad
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(token)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
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
      <TokenCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        viajes={viajes}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      {/* ── Edit Dialog ── */}
      <TokenEditDialog
        open={!!editingToken}
        onOpenChange={(open) => !open && setEditingToken(null)}
        token={editingToken}
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
      />
    </AdminPageShell>
  )
}