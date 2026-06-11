// app/(admin)/usuarios/_components/types.ts
import * as z from "zod"

export type Rol = {
  id: number
  nombre: string
}

export type Usuario = {
  id: number
  username: string
  rol: Rol
  creado_en: string
}

export const usuarioCreateSchema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  rol_id: z.coerce
    .number({ required_error: "Seleccione un rol" })
    .positive("Seleccione un rol"),
})

export const usuarioEditSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
  rol_id: z.coerce.number().positive().optional(),
})

export type UsuarioCreateValues = z.infer<typeof usuarioCreateSchema>
export type UsuarioEditValues = z.infer<typeof usuarioEditSchema>