"use client"

import Link from "next/link"
import {
  Bus,
  Calendar,
  MapPin,
  MoreHorizontal,
  Package,
  Users,
  Eye,
  Edit,
  Trash2,
  Link as LinkIcon,
  Ticket
} from "lucide-react"
import Swal from "sweetalert2"
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
import {
  formatCurrency,
  formatViajeFecha,
  formatViajeHora,
  isViajeProximo,
} from "@/lib/format"
import type { Viaje } from "@/types/viaje"

type ViajesTableProps = {
  viajes: Viaje[]
}

export function ViajesTable({ viajes }: ViajesTableProps) {
  
  // 1. Manejador para copiar el link público (con formato Slug amigable)
  const handleCopyLink = (viajeId: number, viajeNombre: string) => {
    // Transforma "San José - Upala" en "san-jose-upala"
    const nombreLimpio = viajeNombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Elimina tildes
      .replace(/[^a-z0-9]+/g, "-") // Reemplaza espacios y símbolos por guiones
      .replace(/(^-|-$)+/g, ""); // Limpia guiones sobrantes en los bordes

    // Resultado: 15-san-jose-upala
    const slug = `${viajeId}-${nombreLimpio}`;
    const url = `${window.location.origin}/reservar/${slug}`;
    
    navigator.clipboard.writeText(url)
    
    Swal.fire({
      title: "Enlace copiado",
      text: "El link público está listo para compartirse.",
      icon: "success",
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 3000
    })
  }

  // 2. Manejador para generar token de compra manual
  const handleGeneratePurchaseToken = (viajeId: number) => {
    // Aquí irá tu petición fetch al backend: POST /api/viajes/{viajeId}/generar-token
    console.log("Generando token para viaje:", viajeId)
    Swal.fire({
      title: "Generar Token",
      text: "Esta acción contactará al servidor para emitir un token único de compra.",
      icon: "info",
      confirmButtonColor: "#171717"
    })
  }

  // 3. Manejador para eliminar con barrera de seguridad
  const handleDelete = (viajeId: number) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer. Los tickets vendidos quedarán huérfanos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // Rojo destructivo
      cancelButtonColor: "#171717",
      confirmButtonText: "Sí, eliminar viaje",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí irá tu petición fetch: DELETE /api/viajes/{viajeId}
        console.log("Eliminando viaje:", viajeId)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-5">Viaje</TableHead>
            <TableHead>Salida</TableHead>
            <TableHead>Lugar</TableHead>
            <TableHead>Bus</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Capacidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="pr-5 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {viajes.map((viaje) => {
            const proximo = isViajeProximo(viaje.fecha_salida)

            return (
              <TableRow key={viaje.id} className="group">
                <TableCell className="pl-5">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">{viaje.nombre}</p>
                    <p className="text-xs text-muted-foreground">ID #{viaje.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm">{formatViajeFecha(viaje.fecha_salida)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatViajeHora(viaje.hora_salida)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-[200px] items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <span className="line-clamp-2 text-sm">{viaje.lugar_abordaje}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {viaje.bus?.nombre ?? "Sin bus"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {viaje.bus?.capacidad_total ?? viaje.asientos_count} asientos
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(viaje.precio)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {viaje.asientos_count}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Package className="h-3 w-3" />
                      {viaje.tokens_count} lotes
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={proximo ? "default" : "outline"}>
                    {proximo ? "Próximo" : "Finalizado"}
                  </Badge>
                </TableCell>

                {/* CELDA DE ACCIONES */}
                <TableCell className="pr-5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-70 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones del viaje</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      
                      {/* Bloque 1: Navegación e Información */}
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/viajes/${viaje.id}`} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Ver detalle / Estado</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/viajes/${viaje.id}/editar`} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar viaje</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Bloque 2: Operaciones Comerciales */}
                      <DropdownMenuItem 
                        onClick={() => handleCopyLink(viaje.id, viaje.nombre)}
                        className="cursor-pointer"
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        <span>Copiar link público</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleGeneratePurchaseToken(viaje.id)}
                        className="cursor-pointer"
                      >
                        <Ticket className="mr-2 h-4 w-4" />
                        <span>Generar token de compra</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Bloque 3: Acciones Destructivas */}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(viaje.id)}
                        className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar viaje</span>
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
  )
}