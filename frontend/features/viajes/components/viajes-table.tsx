"use client"

import { useMemo, useState } from "react"
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
  Ticket,
  Loader2,
  User,
  Copy,
} from "lucide-react"
import Swal from "sweetalert2"
import { Badge } from "@/components/ui/badge"
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
  FormDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  formatCurrency,
  formatViajeFecha,
  formatViajeHora,
  isViajeProximo,
} from "@/lib/format"

import { cn } from "@/lib/utils"

import type { Viaje } from "@/types/viaje"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// Schema para el formulario de token de compra
const purchaseTokenSchema = z.object({
  cliente: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  capacidad_total: z.coerce
    .number()
    .int("Debe ser un número entero")
    .positive("La capacidad debe ser mayor a 0"),
})

type PurchaseTokenFormValues = z.infer<typeof purchaseTokenSchema>

type ViajesTableProps = {
  viajes: Viaje[]
  onRefresh: () => void
}

export function ViajesTable({ viajes, onRefresh }: ViajesTableProps) {
  // Estado para el diálogo de token de compra
  const [purchaseTokenOpen, setPurchaseTokenOpen] = useState(false)
  const [selectedViaje, setSelectedViaje] = useState<Viaje | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)

  // Formulario para el token de compra
  const form = useForm<PurchaseTokenFormValues>({
    resolver: zodResolver(purchaseTokenSchema),
    defaultValues: {
      cliente: "",
      capacidad_total: 1,
    },
  })

  // 1. LÓGICA DE ORDENAMIENTO (De más reciente a más viejo)
  const sortedViajes = useMemo(() => {
    return [...viajes].sort((a, b) => {
      const timeA = new Date(`${a.fecha_salida}T${a.hora_salida || "00:00:00"}`).getTime()
      const timeB = new Date(`${b.fecha_salida}T${b.hora_salida || "00:00:00"}`).getTime()
      return timeB - timeA
    })
  }, [viajes])

  // 2. Manejador para copiar el link público
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

  // 3. Manejador para ABRIR el diálogo de token de compra
  const handleOpenPurchaseToken = (viaje: Viaje) => {
    setSelectedViaje(viaje)
    setGeneratedToken(null)
    form.reset({ cliente: "", capacidad_total: 1 })
    setPurchaseTokenOpen(true)
  }

  // 4. Manejador para GENERAR el token de compra
  const handleGeneratePurchaseToken = async (values: PurchaseTokenFormValues) => {
    if (!selectedViaje) return

    setIsGenerating(true)
    setGeneratedToken(null)

    try {
      const token = localStorage.getItem("access_token")

      const response = await fetch(`${API_URL}/api/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          viaje_id: selectedViaje.id,
          capacidad_total: values.capacidad_total,
          cliente: values.cliente.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || "Error al generar el token de compra")
      }

      const data = await response.json()
      setGeneratedToken(data.token.codigo)

      Swal.fire({
        title: "¡Token generado!",
        html: `
          <div class="text-left space-y-2">
            <p class="text-sm text-muted-foreground">Cliente: <strong>${values.cliente}</strong></p>
            <p class="text-sm text-muted-foreground">Viaje: <strong>${selectedViaje.nombre}</strong></p>
            <p class="text-sm text-muted-foreground">Asientos: <strong>${values.capacidad_total}</strong></p>
            <div class="mt-3 rounded-lg bg-muted p-3">
              <p class="text-xs text-muted-foreground mb-1">Código del token:</p>
              <p class="font-mono text-lg font-bold tracking-wider">${data.token.codigo}</p>
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#171717",
        confirmButtonText: "Entendido"
      })

    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo generar el token de compra.",
        icon: "error",
        confirmButtonColor: "#dc2626"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 5. Copiar token generado
  const handleCopyToken = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    Swal.fire({
      title: "Copiado",
      text: "Código del token copiado al portapapeles.",
      icon: "success",
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 2000
    })
  }

  // 6. Manejador para eliminar con barrera de seguridad
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
        const token = localStorage.getItem("access_token");

        const response = await fetch(`${API_URL}/api/viajes/${viajeId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const textResponse = await response.text();

        let data;
        try {
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
          }).then(() => {
            onRefresh();
          });
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
    <>
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
            {sortedViajes.map((viaje) => {
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
                            <DropdownMenuItem onClick={() => handleOpenPurchaseToken(viaje)} className="cursor-pointer">
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

      {/* ─── Diálogo: Generar Token de Compra ─── */}
      <Dialog
        open={purchaseTokenOpen}
        onOpenChange={(open) => {
          if (!isGenerating) {
            setPurchaseTokenOpen(open)
            if (!open) {
              setGeneratedToken(null)
              form.reset()
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Generar token de compra
            </DialogTitle>
            <DialogDescription>
              {selectedViaje && (
                <span>
                  Viaje: <strong className="text-foreground">{selectedViaje.nombre}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {!generatedToken ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGeneratePurchaseToken)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        Nombre del cliente
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. Juan Pérez"
                          className="rounded-xl"
                          autoFocus
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
                      <FormLabel className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Cantidad de asientos
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Ej. 1"
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Asientos que podrá generar este token como tickets.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setPurchaseTokenOpen(false)}
                    disabled={isGenerating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-full shadow-md shadow-primary/25"
                    disabled={isGenerating}
                  >
                    {isGenerating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isGenerating ? "Generando..." : "Generar token"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800 mb-2">¡Token generado exitosamente!</p>
                <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-emerald-100">
                  <p className="font-mono text-lg font-bold tracking-wider text-emerald-900">
                    {generatedToken}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                          onClick={() => handleCopyToken(generatedToken)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copiar código</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setGeneratedToken(null)
                    form.reset({ cliente: "", capacidad_total: 1 })
                  }}
                >
                  Generar otro token
                </Button>
                <Button
                  className="rounded-full shadow-md shadow-primary/25"
                  onClick={() => {
                    setPurchaseTokenOpen(false)
                    setGeneratedToken(null)
                    form.reset()
                  }}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}