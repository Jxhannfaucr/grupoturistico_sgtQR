"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Swal from "sweetalert2"
import {
  Bus as BusIcon,
  Calendar,
  Hash,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// ─── Types ─────────────────────────────────────────────────
type Bus = {
  id: number
  nombre: string
  capacidad_total: number
  configuracion_json?: Record<string, unknown> | null
  creado_en?: string
}

// ─── Zod Schema ────────────────────────────────────────────
const busSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  capacidad_total: z.coerce
    .number()
    .int("Debe ser un número entero")
    .positive("La capacidad debe ser mayor a 0"),
})

type BusFormValues = z.infer<typeof busSchema>

// ─── Helpers ───────────────────────────────────────────────
function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function formatFecha(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function BusesPage() {
  const router = useRouter()

  // ── Data state ───────────────────────────────────────────
  const [buses, setBuses] = useState<Bus[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // ── Filter ───────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("")

  // ── Dialog state ─────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Fetch buses ──────────────────────────────────────────
  const fetchBuses = useCallback(async () => {
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch(`${API_URL}/api/buses`, {
        headers: getAuthHeaders(),
      })
      if (res.status === 401) {
        setErrorMsg("Sesión expirada")
        setStatus("error")
        return
      }
      if (!res.ok) throw new Error("Error al cargar buses")
      const data: Bus[] = await res.json()
      setBuses(data)
      setStatus("success")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error de conexión")
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    fetchBuses()
  }, [fetchBuses])

  useEffect(() => {
    if (status === "error" && errorMsg.includes("Sesión expirada")) {
      router.push("/")
    }
  }, [status, errorMsg, router])

  // ── Filtered list ────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!busqueda.trim()) return buses
    const q = busqueda.toLowerCase()
    return buses.filter((b) => b.nombre.toLowerCase().includes(q))
  }, [buses, busqueda])

  // ── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = buses.length
    const capacidad = buses.reduce((s, b) => s + b.capacidad_total, 0)
    return { total, capacidad }
  }, [buses])

  // ── CRUD handlers ────────────────────────────────────────
  function openCreate() {
    setEditingBus(null)
    setDialogOpen(true)
  }

  function openEdit(bus: Bus) {
    setEditingBus(bus)
    setDialogOpen(true)
  }

  async function handleFormSubmit(values: BusFormValues) {
    setIsSubmitting(true)
    try {
      const isEdit = !!editingBus
      const url = isEdit
        ? `${API_URL}/api/buses/${editingBus!.id}`
        : `${API_URL}/api/buses`
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "Error al guardar")
      }

      Swal.fire({
        title: "Éxito",
        text: isEdit ? "Bus actualizado correctamente" : "Bus registrado correctamente",
        icon: "success",
        confirmButtonColor: "#171717",
      })

      setDialogOpen(false)
      fetchBuses()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo guardar. Verifique la conexión.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(bus: Bus) {
    const result = await Swal.fire({
      title: `¿Eliminar "${bus.nombre}"?`,
      text: "Esta acción no se puede deshacer. Si el bus tiene viajes asociados, no se eliminará.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#171717",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`${API_URL}/api/buses/${bus.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => null)
        throw new Error(
          body?.detail ?? "No se pudo eliminar. Puede tener viajes asociados."
        )
      }

      Swal.fire({
        title: "Eliminado",
        text: `"${bus.nombre}" fue eliminado del sistema.`,
        icon: "success",
        confirmButtonColor: "#171717",
      })

      fetchBuses()
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo eliminar.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Buses"
        description="Administra las unidades de transporte disponibles para cada viaje."
        actions={
          <Button
            className="rounded-full shadow-md shadow-primary/25"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar bus
          </Button>
        }
      />

      {/* ── Stats Cards ── */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={<BusIcon className="h-5 w-5" />}
          label="Total unidades"
          value={stats.total}
          hint="Buses registrados"
          accent="primary"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Capacidad total"
          value={stats.capacidad}
          hint="Asientos sumados"
          accent="accent"
        />
      </div>

      {/* ── Filters ── */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre…"
            className="h-9 rounded-full pl-9"
            aria-label="Buscar bus"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={fetchBuses}
          disabled={status === "loading"}
        >
          <RefreshCw
            className={cn("mr-1 h-4 w-4", status === "loading" && "animate-spin")}
          />
          Actualizar
        </Button>
      </div>

      {/* ── Content ── */}
      <div className="mt-4">
        {status === "loading" && buses.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Cargando buses…</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-16">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={fetchBuses}>
              Reintentar
            </Button>
          </div>
        )}

        {status === "success" && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BusIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">No hay buses registrados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra la primera unidad para poder asignarla a tus viajes.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar primer bus
            </Button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-5">Unidad</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="pr-5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bus) => (
                  <TableRow key={bus.id} className="group">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <BusIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">
                            {bus.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Hash className="mr-0.5 inline h-3 w-3" />
                            {bus.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {bus.capacidad_total}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          asientos
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatFecha(bus.creado_en)}
                        </span>
                      </div>
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => openEdit(bus)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(bus)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Dialog ── */}
      <BusFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bus={editingBus}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
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
  accent: "primary" | "secondary" | "accent"
}) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-amber-500/10 text-amber-600",
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

// ═══════════════════════════════════════════════════════════
// FORM DIALOG (solo nombre + capacidad_total)
// ═══════════════════════════════════════════════════════════
function BusFormDialog({
  open,
  onOpenChange,
  bus,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bus: Bus | null
  onSubmit: (values: BusFormValues) => Promise<void>
  isSubmitting: boolean
}) {
  const isEditing = !!bus

  const form = useForm<BusFormValues>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      nombre: "",
      capacidad_total: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (bus) {
        form.reset({
          nombre: bus.nombre,
          capacidad_total: bus.capacidad_total,
        })
      } else {
        form.reset({
          nombre: "",
          capacidad_total: 0,
        })
      }
    }
  }, [open, bus, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar bus" : "Registrar bus"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la unidad."
              : "Completa los datos para registrar una nueva unidad."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la unidad</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Bus Ejecutivo 01"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacidad_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad (asientos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Ej. 45"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full shadow-md shadow-primary/25"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Guardar cambios" : "Registrar bus"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}