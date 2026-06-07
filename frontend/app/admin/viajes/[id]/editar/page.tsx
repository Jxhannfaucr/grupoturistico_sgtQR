"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle } from "lucide-react"
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
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// 1. Esquema de Validación Estricto
const formSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  fecha_salida: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),
  hora_salida: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida. Use formato 24h (HH:MM)"),
  lugar_abordaje: z.string().min(2, "Especifique un lugar válido"),
  precio: z.coerce.number().positive("El precio debe ser mayor a 0"),
  bus_id: z.coerce.number().positive("Seleccione un bus"),
})

export default function EditarViajePage() {
  const router = useRouter()
  const params = useParams() // Extraemos el ID de la URL
  const viajeId = params.id as string

  const [buses, setBuses] = useState<{ id: number; nombre: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [tieneVentas, setTieneVentas] = useState(false)

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

  // 3. Carga Inicial de Datos (Buses y Viaje)
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true)
      try {
        const token = localStorage.getItem("access_token")
        const headers = { Authorization: `Bearer ${token}` }

        // Peticiones en paralelo para mayor velocidad
        const [busesRes, viajeRes] = await Promise.all([
          fetch(`${API_URL}/api/buses`, { headers }),
          fetch(`${API_URL}/api/viajes/${viajeId}`, { headers })
        ])

        if (!viajeRes.ok) throw new Error("Viaje no encontrado")

        if (busesRes.ok) {
          const busesData = await busesRes.json()
          setBuses(busesData)
        }

        const viajeData = await viajeRes.json()

        // Evaluamos si el viaje tiene tickets vendidos
        const ventasActivas = viajeData.asientos_vendidos_count > 0
        setTieneVentas(ventasActivas)

        // Rellenamos el formulario con los datos recuperados
        form.reset({
          nombre: viajeData.nombre,
          fecha_salida: viajeData.fecha_salida.split("T")[0], // Extraemos solo YYYY-MM-DD
          hora_salida: viajeData.hora_salida,
          lugar_abordaje: viajeData.lugar_abordaje,
          precio: viajeData.precio,
          bus_id: viajeData.bus_id,
        })
      } catch (error) {
        console.error("Error cargando datos:", error)
        Swal.fire({
          title: "Error",
          text: "No se pudo cargar la información del viaje.",
          icon: "error",
          confirmButtonColor: "#171717",
        }).then(() => router.push("/admin/viajes"))
      } finally {
        setIsFetching(false)
      }
    }

    if (viajeId) fetchData()
  }, [viajeId, form, router])

  // 4. Envío de la Actualización al Backend
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (tieneVentas) {
      const confirmacion = await Swal.fire({
        title: "¿Confirmar cambios de horario?",
        text: "Existen pasajeros con tickets comprados. Es tu responsabilidad notificarles sobre estos cambios.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#171717",
        cancelButtonColor: "#dc2626",
        confirmButtonText: "Sí, guardar cambios",
        cancelButtonText: "Cancelar"
      })
      if (!confirmacion.isConfirmed) return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_URL}/api/viajes/${viajeId}`, {
        method: "PUT", // Método correcto para actualizar
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values),
      })

      const responseData = await response.json()

      if (!response.ok) throw new Error(responseData.detail || "Error al actualizar el viaje")

      Swal.fire({
        title: "Éxito",
        text: "Viaje actualizado correctamente",
        icon: "success",
        confirmButtonColor: "#171717",
      }).then(() => {
        router.push("/admin/viajes")
      })
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#171717",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <AdminPageShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Cargando información del viaje...</p>
        </div>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Editar viaje"
        description={`ID #${viajeId} - Modifica los parámetros operativos del viaje.`}
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/viajes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="mt-8 max-w-2xl space-y-6">
        
        {tieneVentas && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800 font-bold">Viaje con ventas activas</AlertTitle>
            <AlertDescription className="text-red-700 mt-1">
              No puedes modificar el <strong>precio</strong> ni el <strong>bus asignado</strong> porque ya existen tickets vendidos. Si alteras la fecha u hora, recuerda notificar a los clientes.
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
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
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          disabled={tieneVentas} // BLOQUEO CONDICIONAL
                        />
                      </FormControl>
                      {tieneVentas && <FormDescription>Bloqueado por ventas activas.</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

            <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Viaje</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej. Playa Manuel Antonio" 
                        {...field} 
                        disabled={tieneVentas}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando cambios..." : "Actualizar Viaje"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </AdminPageShell>
  )
}