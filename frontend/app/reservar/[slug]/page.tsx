"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Swal from "sweetalert2"
import { AlertCircle, Clock, Loader2, MapPin, Ticket, ArrowLeft } from "lucide-react"

import { SeatSelector } from "./seat-selector"
import { PassengerForm } from "./passenger-form"
import { ConfirmationScreen } from "./confirmation-screen"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// ─── Types ─────────────────────────────────────────────────
type ViajePublicoInfo = {
  id: number
  nombre: string
  fecha_salida: string | null
  hora_salida: string | null
  lugar_abordaje: string | null
  precio: number
  total_asientos: number
  asientos_ocupados: string[]
  tipo_plantilla: string
}

export type PasajeroForm = {
  numero_asiento: string
  nombre_pasajero: string
  email_pasajero: string
}

// ─── Helpers ───────────────────────────────────────────────
function formatFechaBonita(fecha?: string | null) {
  if (!fecha) return ""
  const d = new Date(fecha + "T00:00:00")
  return d.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatPrecio(precio: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(precio)
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function ReservarPage() {
  const params = useParams()
  const slug = params.slug as string
  
  // Extrae solo el ID numérico del slug (ej: "15-ruta" -> "15")
  const viajeId = slug ? slug.split('-')[0] : ""

  const [viaje, setViaje] = useState<ViajePublicoInfo | null>(null)
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [pasajeros, setPasajeros] = useState<PasajeroForm[]>([])
  const [tokenReserva, setTokenReserva] = useState("")
  const [step, setStep] = useState<"seats" | "form" | "done">("seats")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Fetch Viaje info ──────────────────────────────────────
  const fetchViaje = useCallback(async () => {
    setStatus("loading")
    try {
      // Este endpoint debe devolver la info del viaje y qué asientos están ya comprados
      const res = await fetch(`${API_URL}/api/viajes/publico/${viajeId}`)
      if (!res.ok) {
        throw new Error("El enlace del viaje no es válido o ha expirado.")
      }
      const data: ViajePublicoInfo = await res.json()
      setViaje(data)
      setStatus("ready")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error al cargar la información.")
      setStatus("error")
    }
  }, [viajeId])

  useEffect(() => {
    if (viajeId) fetchViaje()
  }, [fetchViaje, viajeId])

  // ── Seat toggle ──────────────────────────────────────────
  function toggleSeat(numero: string) {
    if (!viaje) return
    if (viaje.asientos_ocupados.includes(numero)) return

    setSelectedSeats((prev) => {
      if (prev.includes(numero)) return prev.filter((s) => s !== numero)
      // Límite de seguridad genérico para evitar acaparamiento visual
      if (prev.length >= 10) {
        Swal.fire({
          title: "Límite alcanzado",
          text: `Por seguridad, solo puede seleccionar un máximo de 10 asientos a la vez.`,
          icon: "warning",
          confirmButtonColor: "#4f46e5",
        })
        return prev
      }
      return [...prev, numero]
    })
  }

  // ── Step transitions ─────────────────────────────────────
  function goToForm() {
    if (selectedSeats.length === 0) {
      Swal.fire({
        title: "Seleccione asientos",
        text: "Debe seleccionar al menos un asiento para continuar.",
        icon: "info",
        confirmButtonColor: "#4f46e5",
      })
      return
    }
    setPasajeros(
      selectedSeats.map((s) => ({
        numero_asiento: s,
        nombre_pasajero: "",
        email_pasajero: "",
      }))
    )
    setStep("form")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goBackToSeats() {
    setStep("seats")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function updatePasajero(index: number, field: keyof PasajeroForm, value: string) {
    setPasajeros((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit() {
    if (!tokenReserva.trim()) {
        Swal.fire({
            title: "Token Requerido",
            text: "Ingrese el Token de Autorización proporcionado por el administrador.",
            icon: "warning",
            confirmButtonColor: "#4f46e5",
        })
        return
    }

    for (const p of pasajeros) {
      if (p.nombre_pasajero.trim().length < 2) {
        Swal.fire({
          title: "Datos incompletos",
          text: `Ingrese el nombre del pasajero para el asiento #${p.numero_asiento}.`,
          icon: "warning",
          confirmButtonColor: "#4f46e5",
        })
        return
      }
    }

    setIsSubmitting(true)
    try {
      // El backend ahora valida que el Token exista, que tenga capacidad para la cantidad
      // de asientos seleccionados y que corresponda a este viaje.
      const res = await fetch(`${API_URL}/api/viajes/${viajeId}/reservar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            token: tokenReserva,
            asientos: pasajeros 
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "Error al validar el token o reservar los asientos.")
      }

      setStep("done")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: any) {
      Swal.fire({
        title: "Error de Validación",
        text: err?.message ?? "No se pudo procesar la reserva. Verifique su Token.",
        icon: "error",
        confirmButtonColor: "#4f46e5",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading & Error states se mantienen igual visualmente ──
  if (status === "loading") {
    // ... (Mantén el diseño de carga de tu colega aquí)
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin" size={32} /></div>
  }

  if (status === "error") {
    // ... (Mantén el diseño de error de tu colega aquí)
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><AlertCircle size={32} color="red" /> {errorMsg}</div>
  }

  if (!viaje) return null

  // ── Confirmation screen ──────────────────────────────────
  if (step === "done") {
    return (
      <ConfirmationScreen
        viajeName={viaje.nombre}
        fecha={viaje.fecha_salida}
        hora={viaje.hora_salida}
        lugar={viaje.lugar_abordaje}
        asientos={selectedSeats}
      />
    )
  }

  // ── Main layout ──────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%, #f5f3ff 100%)",
        fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
        paddingBottom: 20,
      }}
    >
        {/* ... (Header Visual de tu colega se mantiene exacto) ... */}
      
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px", marginTop: 80 }}>
        {step === "seats" && (
          <SeatSelector
            totalAsientos={viaje.total_asientos}
            disponibles={[]} // Ya no es necesario pasar disponibles, la lógica usa ocupados
            ocupados={viaje.asientos_ocupados}
            selected={selectedSeats}
            maxSelectable={10} 
            precio={viaje.precio}
            tipoPlantilla={viaje.tipo_plantilla}
            onToggle={toggleSeat}
            onContinue={goToForm}
          />
        )}

        {step === "form" && (
          <PassengerForm
            pasajeros={pasajeros}
            precio={viaje.precio}
            viajeName={viaje.nombre}
            isSubmitting={isSubmitting}
            tokenReserva={tokenReserva}
            onTokenChange={setTokenReserva}
            onUpdate={updatePasajero}
            onBack={goBackToSeats}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  )
}