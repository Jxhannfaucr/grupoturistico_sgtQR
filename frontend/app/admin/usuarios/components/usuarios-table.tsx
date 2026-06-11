// app/(admin)/usuarios/_components/usuarios-table.tsx
import { Calendar, MoreHorizontal, Pencil, Trash2, User } from "lucide-react"
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
import { RolBadge } from "./rol-badge"
import type { Usuario } from "./types"

function formatFecha(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

interface UsuariosTableProps {
  usuarios: Usuario[]
  onEdit: (usuario: Usuario) => void
  onDelete: (usuario: Usuario) => void
}

export function UsuariosTable({ usuarios, onEdit, onDelete }: UsuariosTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-5">Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead className="pr-5 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id} className="group">

              {/* Usuario */}
              <TableCell className="pl-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">{usuario.username}</p>
                    <p className="text-xs text-muted-foreground">ID #{usuario.id}</p>
                  </div>
                </div>
              </TableCell>

              {/* Rol */}
              <TableCell>
                <RolBadge nombre={usuario.rol.nombre} />
              </TableCell>

              {/* Fecha */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatFecha(usuario.creado_en)}
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
                    <DropdownMenuItem onClick={() => onEdit(usuario)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(usuario)}
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
  )
}