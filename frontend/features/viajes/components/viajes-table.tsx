"use client"

import Link from "next/link"
import {
  Bus,
  Calendar,
  MapPin,
  MoreHorizontal,
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

import { cn } from "@/lib/utils"

import type { Viaje } from "@/types/viaje"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

type ViajesTableProps = {
  viajes: Viaje[]
  onRefresh?: () => void
}

export function ViajesTable({ viajes, onRefresh }: ViajesTableProps) {
  
  // 1. Manejador para copiar el link público (con formato Slug amigable)
  const handleCopyLink = (viajeId: number, viajeNombre: string) => {
    const nombreLimpio = viajeNombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-z0-9]+/g, "-") 
      .replace(/(^-|-$)+/g, ""); 

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
    console.log("Generando token para viaje:", viajeId)
    Swal.fire({
      title: "Generar Token",
      text: "Esta acción contactará al servidor para emitir un token único de compra.",
      icon: "info",
      confirmButtonColor: "#171717"
    })
  }

  // 3. Manejador para eliminar con barrera de seguridad
  const handleDelete = async (viajeId: number) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Si el viaje tiene ventas, se marcará como CANCELADO. Si no tiene ventas, se eliminará permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#171717",
      confirmButtonText: "Sí, procesar viaje",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        // Usamos access_token y API_URL tal como en tu página de creación
        const token = localStorage.getItem("access_token");
        
        const response = await fetch(`${API_URL}/api/viajes/${viajeId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}` 
          }
        });

        // 1. Leemos la respuesta como texto crudo primero
        const textResponse = await response.text();
        
        let data;
        try {
          // 2. Intentamos convertirla a JSON
          data = JSON.parse(textResponse);
        } catch (parseError) {
          throw new Error(`Error de conexión (Status ${response.status}). Ruta no encontrada o error de servidor.`);
        }

        if (response.ok) {
          Swal.fire({
            title: "Operación exitosa",
            text: data.message,
            icon: "success",
            confirmButtonColor: "#171717"
          });

          onRefresh?.();
        } else {
          throw new Error(data.detail || "Error al procesar la solicitud");
        }
      } catch (error: any) {
        Swal.fire({
          title: "Error",
          text: error.message,
          icon: "error",
          confirmButtonColor: "#dc2626"
        });
      }
    }
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
            const isCancelado = viaje.estado === "cancelado" 

            return (
              <TableRow 
                key={viaje.id} 
                className={cn(
                  "group", 
                  isCancelado && "bg-red-50/40 opacity-75 hover:bg-red-50/60 transition-colors"
                )}
              >
                <TableCell className="pl-5">
                  <div className="space-y-0.5">
                    <p className={cn("font-medium", isCancelado ? "text-red-900" : "text-foreground")}>
                      {viaje.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">ID #{viaje.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <Calendar className={cn("mt-0.5 h-4 w-4 shrink-0", isCancelado ? "text-red-400" : "text-primary")} />
                    <div className={cn(isCancelado && "line-through text-red-800/60")}>
                      <p className="text-sm">{formatViajeFecha(viaje.fecha_salida)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatViajeHora(viaje.hora_salida)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-[200px] items-start gap-2">
                    <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", isCancelado ? "text-red-400" : "text-secondary")} />
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
                  <span className={cn("font-semibold", isCancelado ? "line-through text-red-800/60" : "text-foreground")}>
                    {formatCurrency(viaje.precio)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={cn("gap-1", isCancelado && "border-red-200 text-red-700")}>
                      <Users className="h-3 w-3" />
                      {viaje.asientos_count} Total
                    </Badge>
                    <Badge 
                      variant={viaje.asientos_vendidos_count > 0 ? "default" : "secondary"} 
                      className={cn("gap-1", isCancelado && viaje.asientos_vendidos_count > 0 && "bg-red-800 hover:bg-red-800")}
                    >
                      <Ticket className="h-3 w-3" />
                      {viaje.asientos_vendidos_count} Vendidos
                    </Badge>
                  </div>
                </TableCell>
                
                <TableCell>
                  {isCancelado ? (
                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 font-bold uppercase tracking-wider text-[10px]">
                      Cancelado
                    </Badge>
                  ) : (
                    <Badge variant={proximo ? "default" : "outline"}>
                      {proximo ? "Próximo" : "Finalizado"}
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="pr-5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="opacity-70 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones del viaje</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/viajes/${viaje.id}`} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Ver detalle / Estado</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {!isCancelado && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/viajes/${viaje.id}/editar`} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar viaje</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleCopyLink(viaje.id, viaje.nombre)} className="cursor-pointer">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            <span>Copiar link público</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGeneratePurchaseToken(viaje.id)} className="cursor-pointer">
                            <Ticket className="mr-2 h-4 w-4" />
                            <span>Generar token de compra</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem 
                        onClick={() => handleDelete(viaje.id)}
                        disabled={isCancelado} 
                        className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 data-[disabled]:opacity-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{isCancelado ? "Ya está cancelado" : "Eliminar viaje"}</span>
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