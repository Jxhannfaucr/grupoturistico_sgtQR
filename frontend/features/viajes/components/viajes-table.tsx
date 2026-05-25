"use client"

import Link from "next/link"
import {
  Bus,
  Calendar,
  MapPin,
  MoreHorizontal,
  Package,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/viajes/${viaje.id}`}>Ver detalle</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild disabled>
                        <Link href={`/admin/viajes/${viaje.id}/editar`}>
                          Editar (próximamente)
                        </Link>
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
