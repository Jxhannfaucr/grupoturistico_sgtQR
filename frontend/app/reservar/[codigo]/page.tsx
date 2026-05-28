"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Swal from "sweetalert2"
import {
  AlertCircle,
  Clock,
  Loader2,
  MapPin,
  Ticket,
  ArrowLeft,
} from "lucide-react"

import { SeatSelector } from "./seat-selector"
import { PassengerForm } from "./passenger-form"
import { ConfirmationScreen } from "./confirmation-screen"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

// ─── Types ─────────────────────────────────────────────────
type LoteInfo = {
  viaje_nombre: string
  viaje_fecha: string | null
  viaje_hora: string | null
  lugar_abordaje: string | null
  precio: number
  capacidad_disponible: number
  asientos_disponibles: string[]
  asientos_ocupados: string[]
  total_asientos: number
}

type PasajeroForm = {
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
  const codigo = params.codigo as string

  const [lote, setLote] = useState<LoteInfo | null>(null)
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [pasajeros, setPasajeros] = useState<PasajeroForm[]>([])
  const [step, setStep] = useState<"seats" | "form" | "done">("seats")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Fetch lote info ──────────────────────────────────────
  const fetchLote = useCallback(async () => {
    setStatus("loading")
    try {
      const res = await fetch(`${API_URL}/api/reservar/${codigo}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "Código de lote no válido.")
      }
      const data: LoteInfo = await res.json()
      setLote(data)
      setStatus("ready")
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error al cargar la información.")
      setStatus("error")
    }
  }, [codigo])

  useEffect(() => {
    fetchLote()
  }, [fetchLote])

  // ── Seat toggle ──────────────────────────────────────────
  function toggleSeat(numero: string) {
    if (!lote) return
    if (lote.asientos_ocupados.includes(numero)) return

    setSelectedSeats((prev) => {
      if (prev.includes(numero)) return prev.filter((s) => s !== numero)
      if (prev.length >= lote.capacidad_disponible) {
        Swal.fire({
          title: "Límite alcanzado",
          text: `Solo puede reservar ${lote.capacidad_disponible} asiento(s) con este enlace.`,
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
        text: "Debe seleccionar al menos un asiento.",
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

  function updatePasajero(
    index: number,
    field: keyof PasajeroForm,
    value: string
  ) {
    setPasajeros((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit() {
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
      const res = await fetch(`${API_URL}/api/reservar/${codigo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asientos: pasajeros }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? "Error al reservar.")
      }

      setStep("done")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err?.message ?? "No se pudo completar la reserva.",
        icon: "error",
        confirmButtonColor: "#4f46e5",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading state ────────────────────────────────────────
  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%, #f5f3ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        `}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              position: "relative",
              width: 56,
              height: 56,
              margin: "0 auto 16px",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "3px solid #e0e7ff",
              }}
            />
            <Loader2
              size={28}
              color="#6366f1"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#94a3b8",
            }}
          >
            Cargando información del viaje…
          </p>
          <style>{`@keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────
  if (status === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%, #f5f3ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        `}</style>
        <div
          style={{
            maxWidth: 400,
            width: "100%",
            background: "#fff",
            borderRadius: 24,
            border: "1px solid #e8ecf4",
            boxShadow: "0 8px 32px -8px rgba(0,0,0,0.08)",
            padding: 32,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <AlertCircle size={32} color="#ef4444" />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Enlace no válido
          </h1>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#94a3b8",
              lineHeight: 1.6,
            }}
          >
            {errorMsg}
          </p>
        </div>
      </div>
    )
  }

  if (!lote) return null

  // ── Confirmation screen ──────────────────────────────────
  if (step === "done") {
    return (
      <ConfirmationScreen
        viajeName={lote.viaje_nombre}
        fecha={lote.viaje_fecha}
        hora={lote.viaje_hora}
        lugar={lote.lugar_abordaje}
        asientos={selectedSeats}
      />
    )
  }

  // ── Main layout ──────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%, #f5f3ff 100%)",
        fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
        paddingBottom: 20,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(226,232,240,0.6)",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 20px" }}>
          {/* Top row: back button + price */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={goBackToSeats}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "#64748b",
                fontFamily: "'DM Sans', sans-serif",
                padding: 0,
              }}
            >
              <ArrowLeft size={18} />
              Volver
            </button>

            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1,
                }}
              >
                {formatPrecio(lote.precio)}
              </p>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                por asiento
              </p>
            </div>
          </div>

          {/* Route + trip info */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: 4,
              }}
            >
              <Ticket size={16} style={{ color: "#6366f1" }} />
              {lote.viaje_nombre}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                paddingLeft: 24,
              }}
            >
              {lote.viaje_fecha && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#64748b",
                  }}
                >
                  <Clock size={12} color="#94a3b8" />
                  {formatFechaBonita(lote.viaje_fecha)}
                  {lote.viaje_hora && ` · ${lote.viaje_hora}`}
                </span>
              )}
              {lote.lugar_abordaje && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#64748b",
                  }}
                >
                  <MapPin size={12} color="#94a3b8" />
                  {lote.lugar_abordaje}
                </span>
              )}
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 6 }}>
            <div
              style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                background:
                  step === "seats"
                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                    : "#e0e7ff",
                transition: "all 0.3s ease",
              }}
            />
            <div
              style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                background:
                  step === "form"
                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                    : "#e8ecf4",
                transition: "all 0.3s ease",
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>
        {step === "seats" && (
          <SeatSelector
            totalAsientos={lote.total_asientos}
            disponibles={lote.asientos_disponibles}
            ocupados={lote.asientos_ocupados}
            selected={selectedSeats}
            maxSelectable={lote.capacidad_disponible}
            precio={lote.precio}
            onToggle={toggleSeat}
            onContinue={goToForm}
          />
        )}

        {step === "form" && (
          <PassengerForm
            pasajeros={pasajeros}
            precio={lote.precio}
            viajeName={lote.viaje_nombre}
            isSubmitting={isSubmitting}
            onUpdate={updatePasajero}
            onBack={goBackToSeats}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  )
}