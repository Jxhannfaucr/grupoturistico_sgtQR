"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Swal from "sweetalert2"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// 1. Esquema de Validación Estricto (Zod)
const formSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  fecha_salida: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),
  hora_salida: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida. Use formato 24h (HH:MM)"),
  lugar_abordaje: z.string().min(2, "Especifique un lugar válido"),
  precio: z.coerce.number().positive("El precio debe ser mayor a 0"),
  bus_id: z.coerce.number().positive("Seleccione un bus"),
})

export default function CrearViajePage() {
  const router = useRouter()
  const [buses, setBuses] = useState<{ id: number; nombre: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 2. Configuración del Formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      fecha_salida: "",
      hora_salida: "",
      lugar_abordaje: "",
      precio: 0,
      bus_id: 0,
    },
  })

  // 3. Carga de Buses al montar la pantalla
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const res = await fetch(`${API_URL}/api/buses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setBuses(data) // Asume que el backend devuelve [{id: 1, nombre: "Bus 01"}, ...]
        }
      } catch (error) {
        console.error("Error cargando buses:", error)
      }
    }
    fetchBuses()
  }, [])

  // 4. Envío de Datos al Backend
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_URL}/api/viajes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Error al crear el viaje")

      Swal.fire({
        title: "Éxito",
        text: "Viaje creado correctamente",
        icon: "success",
        confirmButtonColor: "#171717",
      }).then(() => {
        router.push("/admin/viajes")
      })
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo registrar el viaje. Verifique la conexión.",
        icon: "error",
        confirmButtonColor: "#171717",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Crear viaje"
        description="Llene el formulario para registrar un nuevo viaje."
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/viajes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="mt-8 max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Viaje</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Playa Manuel Antonio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha_salida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Salida</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_salida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Salida</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lugar_abordaje"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lugar de Abordaje</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. San José de Upala" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bus_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar Bus</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un bus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buses.map((bus) => (
                          <SelectItem key={bus.id} value={String(bus.id)}>
                            {bus.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Procesando..." : "Crear Viaje"}
            </Button>
          </form>
        </Form>
      </div>
    </AdminPageShell>
  )
}