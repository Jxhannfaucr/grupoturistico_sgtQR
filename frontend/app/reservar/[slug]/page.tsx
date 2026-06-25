"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Swal from "sweetalert2"
import { AlertCircle, Loader2, MapPin, CalendarDays, Clock, Timer } from "lucide-react"

import { SeatSelector } from "./seat-selector"
import { PassengerForm } from "./passenger-form"
import { ConfirmationScreen } from "./confirmation-screen"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"
const TIMER_MINUTES = 20

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
  punto_abordaje_pasajero: string
  telefono_pasajero?: string
}

// ─── Helpers ───────────────────────────────────────────────
function formatFechaBonita(fecha?: string | null) {
  if (!fecha) return ""
  const dateString = fecha.includes('T') ? fecha : `${fecha}T00:00:00`
  const d = new Date(dateString)
  return d.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function formatPrecio(precio: number) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", minimumFractionDigits: 0 }).format(precio)
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function DetailPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-600 text-slate-600">
      <span className="text-orange-500">{icon}</span>
      {label}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function ReservarPage() {
  const params = useParams()
  const slug = params.slug as string
  const viajeId = slug ? slug.split('-')[0] : ""

  const [viaje, setViaje] = useState<ViajePublicoInfo | null>(null)
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [pasajeros, setPasajeros] = useState<PasajeroForm[]>([])
  const [tokenReserva, setTokenReserva] = useState("")
  const [step, setStep] = useState<"seats" | "form" | "done">("seats")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Sesión Temporal del Usuario ──────────────────────────
  const [sessionId, setSessionId] = useState<string>("")

  useEffect(() => {
      let sid = localStorage.getItem("session_id")
      if (!sid) {
        sid = Math.random().toString(36).substring(2) + Date.now().toString(36)
        localStorage.setItem("session_id", sid)
      }
      setSessionId(sid)
    }, [])

  // ── Estado Global del Temporizador ───────────────────────
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(TIMER_MINUTES * 60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!timerActive) return
    intervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setTimerActive(false)
          setStep("seats")
          setSelectedSeats([])
          Swal.fire({
            title: "Tiempo agotado",
            text: "El tiempo de reserva ha expirado. Tus asientos han sido liberados.",
            icon: "warning",
            confirmButtonColor: "#ea580c",
          })
          // Nota: El backend limpiará la tabla automáticamente por expiración de tiempo.
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerActive])

  // ── Fetch Viaje info (Con Polling e Identidad) ────────────────────────
  const fetchViaje = useCallback(async (isPolling = false) => {
    // Si no tenemos session_id todavía, no disparamos para evitar desincronización
    if (!sessionId && isPolling) return; 
    
    if (!isPolling) setStatus("loading")
    try {
      // Inyectamos el session_id en la URL
      const url = new URL(`${API_URL}/api/viajes/publico/${viajeId}`)
      if (sessionId) url.searchParams.append("session_id", sessionId)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error("El enlace del viaje no es válido o ha expirado.")
      const data = await res.json()
      
      setViaje((prev) => {
        if (prev && isPolling) {
          return { ...prev, asientos_ocupados: data.asientos_ocupados }
        }
        return data
      })

      // [CORE FIX]: El backend es la fuente de verdad. Rehidratamos nuestra selección local.
      setSelectedSeats(data.mis_asientos || [])
      
      // Si el backend dice que tenemos asientos y el timer no está activo (ej. recarga de F5)
      if (data.mis_asientos?.length > 0 && !timerActive && !isPolling) {
        setTimerSeconds(TIMER_MINUTES * 60)
        setTimerActive(true)
      }

      if (!isPolling) setStatus("ready")
    } catch (err: any) {
      if (!isPolling) {
        setErrorMsg(err?.message ?? "Error al cargar la información.")
        setStatus("error")
      }
    }
  }, [viajeId, sessionId, timerActive])

  // ── Inicialización y Short Polling (Tiempo Real) ────────
  useEffect(() => {
    if (viajeId) fetchViaje() // Carga inicial
    
    // Polling cada 5 segundos para mantener actualizado el mapa de ocupación
    const pollingInterval = setInterval(() => {
      if (viajeId && step === "seats") fetchViaje(true)
    }, 5000)
    
    return () => clearInterval(pollingInterval)
  }, [fetchViaje, viajeId, step])

  // ── Seat toggle (Conexión API) ───────────────────────────
  async function toggleSeat(numero: string) {
    if (!viaje || !sessionId) return
    
    // Si el asiento está en la lista de ocupados/bloqueados por OTRO, ignorar clic
    if (viaje.asientos_ocupados.includes(numero) && !selectedSeats.includes(numero)) return

    const isRemoving = selectedSeats.includes(numero)

    if (isRemoving) {
      // 1. Deselección (Liberación inmediata)
      setSelectedSeats((prev) => prev.filter((s) => s !== numero))
      try {
        await fetch(`${API_URL}/api/viajes/${viajeId}/liberar-asiento`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero_asiento: numero, session_id: sessionId })
        })
        fetchViaje(true) // Refrescar visualmente
      } catch (error) {
        console.error("Error liberando asiento", error)
      }
      return
    }

    // 2. Lógica de seguridad del límite visual
    if (selectedSeats.length >= 10) {
      Swal.fire({
        title: "Límite alcanzado",
        text: `Solo puede seleccionar un máximo de 10 asientos.`,
        icon: "warning",
        confirmButtonColor: "#ea580c",
      })
      return
    }

    // 3. Selección (Bloqueo en API)
    try {
      const res = await fetch(`${API_URL}/api/viajes/${viajeId}/bloquear-asiento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero_asiento: numero, session_id: sessionId })
      })

      if (res.ok) {
        setSelectedSeats((prev) => [...prev, numero])
      } else {
        const errorData = await res.json()
        Swal.fire({
          title: "Asiento no disponible",
          text: errorData.detail ?? "Alguien más acaba de apartar este asiento.",
          icon: "error",
          confirmButtonColor: "#ea580c",
        })
        fetchViaje(true) // Alguien más lo tomó, actualizamos el mapa para pintarlo de gris
      }
    } catch (error) {
      Swal.fire({
        title: "Error de conexión",
        text: "No se pudo apartar el asiento. Verifique su conexión.",
        icon: "error",
        confirmButtonColor: "#ea580c",
      })
    }
  }

  // ── Step transitions ─────────────────────────────────────
  function goToForm() {
    if (selectedSeats.length === 0) {
      Swal.fire({ title: "Seleccione asientos", text: "Debe seleccionar al menos un asiento.", icon: "info", confirmButtonColor: "#ea580c" })
      return
    }
    setPasajeros(
      selectedSeats.map((s) => ({
        numero_asiento: s,
        nombre_pasajero: "",
        email_pasajero: "",
        punto_abordaje_pasajero: "",
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
    setPasajeros((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit() {
    if (!tokenReserva.trim()) {
        Swal.fire({ title: "Token Requerido", text: "Ingrese el Token de Autorización.", icon: "warning", confirmButtonColor: "#ea580c" })
        return
    }
    
    for (const p of pasajeros) {
      if (p.nombre_pasajero.trim().length < 2) {
        Swal.fire({ title: "Datos incompletos", text: `Ingrese el nombre para el asiento #${p.numero_asiento}.`, icon: "warning", confirmButtonColor: "#ea580c" })
        return
      }
    }

    setIsSubmitting(true)
    try {
      // AGREGAMOS el session_id en el payload por si el backend lo necesita para 
      // cruzar información con la tabla de bloqueos al momento de emitir el ticket.
      const res = await fetch(`${API_URL}/api/viajes/${viajeId}/reservar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: tokenReserva, 
          asientos: pasajeros,
          session_id: sessionId 
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "Error al validar el token o reservar.")
      }

      setTimerActive(false)
      setStep("done")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: any) {
      Swal.fire({ title: "Error de Validación", text: err?.message, icon: "error", confirmButtonColor: "#ea580c" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin text-orange-500" size={32} /></div>
  if (status === "error") return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><AlertCircle size={32} color="red" /> {errorMsg}</div>
  if (!viaje) return null

  if (step === "done") {
    return <ConfirmationScreen viajeName={viaje.nombre} fecha={viaje.fecha_salida} hora={viaje.hora_salida} lugar={viaje.lugar_abordaje} asientos={selectedSeats} />
  }

  const timerUrgent = timerSeconds < 120

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%, #f5f3ff 100%)", fontFamily: "'Syne', -apple-system, sans-serif", paddingBottom: 20 }}>
      
      {/* ── HEADER GLOBAL ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.10)]">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100/80">
            <div className="h-8 w-8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700 shadow-sm">
              <img src="/images/logo.jpeg" alt="Logo" className="h-8 w-auto object-cover bg-white" onError={(e) => { e.currentTarget.style.display = "none" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">{viaje.nombre}</p>
              {viaje.lugar_abordaje && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-orange-500 shrink-0" strokeWidth={2.5} />
                  <span className="text-[11px] font-medium text-slate-500 truncate">Salida principal: {viaje.lugar_abordaje}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <DetailPill icon={<CalendarDays size={11} strokeWidth={2.5} />} label={formatFechaBonita(viaje.fecha_salida)} />
            <DetailPill icon={<Clock size={11} strokeWidth={2.5} />} label={viaje.hora_salida || ""} />
            
            {/* TIMER GLOBAL SI ESTÁ ACTIVO */}
            {timerActive && (
              <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${timerUrgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <Timer size={11} className={timerUrgent ? "text-red-500" : "text-amber-600"} strokeWidth={2.5} />
                <span className={`text-[12px] font-bold tabular-nums ${timerUrgent ? "text-red-600" : "text-amber-700"}`}>
                  {formatTimer(timerSeconds)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px", marginTop: 100 }}>
        {step === "seats" && (
          <SeatSelector
            totalAsientos={viaje.total_asientos}
            ocupados={viaje.asientos_ocupados}
            selected={selectedSeats}
            maxSelectable={10} 
            precio={viaje.precio}
            tipoPlantilla={viaje.tipo_plantilla}
            onToggle={toggleSeat}
            onContinue={goToForm}
            onStartTimer={() => { setTimerSeconds(TIMER_MINUTES * 60); setTimerActive(true); }}
            onResetTimer={() => { setTimerActive(false); setTimerSeconds(TIMER_MINUTES * 60); if (intervalRef.current) clearInterval(intervalRef.current); }}
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