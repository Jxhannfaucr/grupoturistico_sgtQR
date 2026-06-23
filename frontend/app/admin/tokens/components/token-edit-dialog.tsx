"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

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

import type { EditFormValues } from "../page"

const editSchema = z.object({
  capacidad_total: z.coerce
    .number()
    .int("Debe ser un número entero")
    .positive("La capacidad debe ser mayor a 0"),
})

type Token = {
  id: number
  codigo: string
  capacidad_total: number
  capacidad_usada: number
}

type TokenEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: Token | null
  onSubmit: (values: EditFormValues) => Promise<void>
  isSubmitting: boolean
}

export function TokenEditDialog({
  open,
  onOpenChange,
  token,
  onSubmit,
  isSubmitting,
}: TokenEditDialogProps) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      capacidad_total: 0,
    },
  })

  useEffect(() => {
    if (open && token) {
      form.reset({ capacidad_total: token.capacidad_total })
    }
  }, [open, token, form])

  if (!token) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar token</DialogTitle>
          <DialogDescription>
            Código: <span className="font-mono font-semibold">{token.codigo}</span>
            {" · "}Uso actual: {token.capacidad_usada} de {token.capacidad_total}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="capacidad_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva capacidad total</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={token.capacidad_usada || 1}
                      placeholder="Ej. 20"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo: {token.capacidad_usada || 1} (tickets ya emitidos).
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
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}