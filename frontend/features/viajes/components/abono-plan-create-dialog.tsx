"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Phone, Route, User, Users, Wallet } from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const createSchema = z.object({
  viaje_id: z.coerce.number().positive("Seleccione un viaje"),
  cliente_nombre: z.string().min(2, "Ingrese el nombre del cliente").max(100),
  telefono: z.string().max(30, "Máximo 30 caracteres").optional(),
  cantidad_asientos_proyectados: z.coerce
    .number()
    .int("Debe ser un número entero")
    .positive("Debe reservar al menos 1 asiento"),
  precio_total: z.coerce.number().positive("El precio total debe ser mayor a 0"),
})

export type AbonoPlanFormValues = z.infer<typeof createSchema>

type AbonoPlanCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AbonoPlanFormValues) => Promise<void>
  isSubmitting: boolean
  precioSugerido?: number
  /** Si se define, el plan queda fijo a este viaje y no se muestra el selector. */
  viajeId?: number
  /** Lista de viajes disponibles; requerida cuando no se pasa `viajeId`. */
  viajes?: { id: number; nombre: string }[]
}

export function AbonoPlanCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  precioSugerido,
  viajeId,
  viajes = [],
}: AbonoPlanCreateDialogProps) {
  const form = useForm<AbonoPlanFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      viaje_id: viajeId ?? 0,
      cliente_nombre: "",
      telefono: "",
      cantidad_asientos_proyectados: 1,
      precio_total: precioSugerido ?? 0,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        viaje_id: viajeId ?? 0,
        cliente_nombre: "",
        telefono: "",
        cantidad_asientos_proyectados: 1,
        precio_total: precioSugerido ?? 0,
      })
    }
  }, [open, viajeId, precioSugerido, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo plan de abono</DialogTitle>
          <DialogDescription>
            Registra el plan de pagos del cliente. No se descuenta capacidad ni se
            bloquean asientos: el inventario se controla manualmente hasta que el
            plan se complete al 100%.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {viajeId === undefined && (
              <FormField
                control={form.control}
                name="viaje_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Route className="h-4 w-4" />
                      Viaje
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Seleccione un viaje" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {viajes.length === 0 ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No hay viajes disponibles
                          </div>
                        ) : (
                          viajes.map((v) => (
                            <SelectItem key={v.id} value={String(v.id)}>
                              {v.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="cliente_nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    Cliente
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Juan Pérez" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    Teléfono (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. 8888-8888" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cantidad_asientos_proyectados"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Asientos proyectados
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min={1} className="rounded-xl" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cantidad de asientos que cubrirá el token al completarse el plan.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="precio_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" />
                    Precio total
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormDescription>
                    Monto total que el cliente debe abonar para generar el token.
                  </FormDescription>
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
                disabled={isSubmitting || (viajeId === undefined && viajes.length === 0)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear plan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
