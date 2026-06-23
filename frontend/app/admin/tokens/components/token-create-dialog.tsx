"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, User } from "lucide-react"

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

import type { CreateFormValues } from "../page"

const createSchema = z.object({
  viaje_id: z.coerce.number().positive("Seleccione un viaje"),
  capacidad_total: z.coerce
    .number()
    .int("Debe ser un número entero")
    .positive("La capacidad debe ser mayor a 0"),
  cliente: z.string().max(100, "El nombre no puede exceder 100 caracteres").optional(),
})

type Viaje = {
  id: number
  nombre: string
}

type TokenCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  viajes: Viaje[]
  onSubmit: (values: CreateFormValues) => Promise<void>
  isSubmitting: boolean
}

export function TokenCreateDialog({
  open,
  onOpenChange,
  viajes,
  onSubmit,
  isSubmitting,
}: TokenCreateDialogProps) {
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      viaje_id: 0,
      capacidad_total: 0,
      cliente: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ viaje_id: 0, capacidad_total: 0, cliente: "" })
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear token</DialogTitle>
          <DialogDescription>
            Selecciona un viaje activo y define cuántos asientos asignar a este token.
            El código se genera automáticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="viaje_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Viaje</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccione un viaje activo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {viajes.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          No hay viajes activos disponibles
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

            <FormField
              control={form.control}
              name="cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    Cliente (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Juan Pérez"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nombre del cliente asociado a este token.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacidad_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad de asientos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Ej. 15"
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
                disabled={isSubmitting || viajes.length === 0}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear token
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}