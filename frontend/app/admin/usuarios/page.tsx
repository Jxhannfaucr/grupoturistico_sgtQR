// app/(admin)/usuarios/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { Loader2, Plus, RefreshCw, Search, User } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { UsuarioStatCards }  from "./components/usuario-stat-cards"
import { UsuariosTable }     from "./components/usuarios-table"
import { UsuarioFormDialog } from "./components/usuario-form-dialog"
import type {
  Rol,
  Usuario,
  UsuarioCreateValues,
  UsuarioEditValues,
} from "./components/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function UsuariosPage() {
  const router = useRouter()

  const [usuarios, setUsuarios]             = useState<Usuario[]>([])
  const [roles, setRoles]                   = useState<Rol[]>([])
  const [status, setStatus]                 = useState<"idle" | "loading" | "error" | "success">("idle")
  const [errorMsg, setErrorMsg]             = useState("")
  const [busqueda, setBusqueda]             = useState("")
  const [dialogOpen, setDialogOpen]         = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [isSubmitting, setIsSubmitting]     = useState(false)

  const fetchUsuarios = useCallback(async () => {
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch(`${API_URL}/api/usuarios/`, { headers: getAuthHeaders() })
      if (res.status === 401) { setErrorMsg("Sesión expirada"); setStatus("error"); return }
      if (!res.ok) throw new Error("Error al cargar usuarios")
      const data: Usuario[] = await res.json()
      setUsuarios(data)
      setStatus("success")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error de conexión")
      setStatus("error")
    }
  }, [])

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/roles/`, { headers: getAuthHeaders() })
      if (res.ok) setRoles(await res.json())
    } catch {
    }
  }, [])

  useEffect(() => {
    fetchUsuarios()
    fetchRoles()
  }, [fetchUsuarios, fetchRoles])

  useEffect(() => {
    if (status === "error" && errorMsg.includes("Sesión expirada")) router.push("/")
  }, [status, errorMsg, router])

  const filtered = useMemo(() => {
    if (!busqueda.trim()) return usuarios
    const q = busqueda.toLowerCase()
    return usuarios.filter(
      (u) => u.username.toLowerCase().includes(q) || u.rol.nombre.toLowerCase().includes(q)
    )
  }, [usuarios, busqueda])

  const stats = useMemo(() => ({
    total:  usuarios.length,
    admins: usuarios.filter((u) => u.rol.nombre.toLowerCase() === "admin").length,
  }), [usuarios])

  function openCreate() { setEditingUsuario(null); setDialogOpen(true) }
  function openEdit(u: Usuario) { setEditingUsuario(u); setDialogOpen(true) }

  async function handleFormSubmit(values: UsuarioCreateValues | UsuarioEditValues) {
    setIsSubmitting(true)
    try {
      const isEdit = !!editingUsuario
      const url    = isEdit ? `${API_URL}/api/usuarios/${editingUsuario!.id}` : `${API_URL}/api/usuarios/`
      const method = isEdit ? "PUT" : "POST"
      const body   = isEdit
        ? Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "" && v !== undefined))
        : values

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(body) })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail ?? "Error al guardar")
      }

      Swal.fire({
        title: "Éxito",
        text: isEdit ? "Usuario actualizado correctamente" : "Usuario creado correctamente",
        icon: "success",
        confirmButtonColor: "#171717",
      })
      setDialogOpen(false)
      fetchUsuarios()
    } catch (err: any) {
      Swal.fire({ title: "Error", text: err?.message ?? "No se pudo guardar.", icon: "error", confirmButtonColor: "#171717" })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(usuario: Usuario) {
    const result = await Swal.fire({
      title: `¿Eliminar "${usuario.username}"?`,
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#171717",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })
    if (!result.isConfirmed) return

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuario.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail ?? "No se pudo eliminar.")
      }
      Swal.fire({ title: "Eliminado", text: `"${usuario.username}" fue eliminado.`, icon: "success", confirmButtonColor: "#171717" })
      fetchUsuarios()
    } catch (err: any) {
      Swal.fire({ title: "Error", text: err?.message ?? "No se pudo eliminar.", icon: "error", confirmButtonColor: "#171717" })
    }
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Usuarios"
        description="Administra las cuentas y roles de acceso al sistema."
        actions={
          <Button className="rounded-full shadow-md shadow-primary/25" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Crear usuario
          </Button>
        }
      />

      <UsuarioStatCards total={stats.total} admins={stats.admins} />

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o rol…"
            className="h-9 rounded-full pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={fetchUsuarios}
          disabled={status === "loading"}
        >
          <RefreshCw className={cn("mr-1 h-4 w-4", status === "loading" && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="mt-4">
        {status === "loading" && usuarios.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Cargando usuarios…</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-16">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={fetchUsuarios}>Reintentar</Button>
          </div>
        )}

        {status === "success" && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">No hay usuarios registrados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea el primer usuario para que pueda acceder al sistema.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer usuario
            </Button>
          </div>
        )}

        {filtered.length > 0 && (
          <UsuariosTable
            usuarios={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <UsuarioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuario={editingUsuario}
        roles={roles}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </AdminPageShell>
  )
}