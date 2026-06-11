// app/(admin)/usuarios/_components/usuario-form-dialog.tsx
"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"

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

import {
  usuarioCreateSchema,
  usuarioEditSchema,
  type Rol,
  type Usuario,
  type UsuarioCreateValues,
  type UsuarioEditValues,
} from "./types"

interface UsuarioFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: Usuario | null 
  roles: Rol[]
  onSubmit: (values: UsuarioCreateValues | UsuarioEditValues) => Promise<void>
  isSubmitting: boolean
}

export function UsuarioFormDialog({
  open,
  onOpenChange,
  usuario,
  roles,
  onSubmit,
  isSubmitting,
}: UsuarioFormDialogProps) {
  const isEditing = !!usuario
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<UsuarioCreateValues | UsuarioEditValues>({
    resolver: zodResolver(isEditing ? usuarioEditSchema : usuarioCreateSchema),
    defaultValues: { username: "", password: "", rol_id: undefined },
  })

  useEffect(() => {
    if (!open) return
    setShowPassword(false)
    form.reset(
      usuario
        ? { username: usuario.username, password: "", rol_id: usuario.rol.id }
        : { username: "", password: "", rol_id: undefined }
    )
  }, [open, usuario, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar usuario" : "Crear usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos. Deja la contraseña en blanco para no cambiarla."
              : "Completa los datos para crear una nueva cuenta de acceso."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de usuario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. operador_01"
                      className="rounded-xl"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Contraseña
                    {isEditing && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={
                          isEditing
                            ? "Dejar vacío para no cambiar"
                            : "Mínimo 6 caracteres"
                        }
                        className="rounded-xl pr-10"
                        autoComplete="new-password"
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye    className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rol_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccione un rol…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((rol) => (
                        <SelectItem key={rol.id} value={String(rol.id)}>
                          <span className="capitalize">{rol.nombre}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}