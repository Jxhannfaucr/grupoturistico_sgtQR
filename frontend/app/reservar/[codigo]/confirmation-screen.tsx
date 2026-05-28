"use client"

import { useEffect, useState } from "react"
import {
  Check,
  MapPin,
  Clock,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Users,
  ShieldCheck,
} from "lucide-react"

/* ── Types ── */
type ConfirmationScreenProps = {
  viajeName: string
  fecha: string | null
  hora: string | null
  lugar: string | null
  asientos: string[]
}

/* ── Helpers ── */
function formatFechaCompleta(fecha?: string | null) {
  if (!fecha) return ""
  const d = new Date(fecha + "T00:00:00")
  return d.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatDiaYMes(fecha?: string | null) {
  if (!fecha) return { dia: "--", mes: "---" }
  const d = new Date(fecha + "T00:00:00")
  return {
    dia: d.getDate().toString().padStart(2, "0"),
    mes: d
      .toLocaleDateString("es-CR", { month: "short" })
      .toUpperCase()
      .replace(".", ""),
  }
}

/* ── Demo wrapper ── */
export default function ConfirmationScreenDemo() {
  return (
    <ConfirmationScreen
      viajeName="San José → Liberia"
      fecha="2026-06-14"
      hora="06:30 AM"
      lugar="Terminal 7-10, San José"
      asientos={["12", "13", "14"]}
    />
  )
}

/* ── Main Component ── */
export function ConfirmationScreen({
  viajeName,
  fecha,
  hora,
  lugar,
  asientos,
}: ConfirmationScreenProps) {
  const [mounted, setMounted] = useState(false)
  const { dia, mes } = formatDiaYMes(fecha)
  const fechaCompleta = formatFechaCompleta(fecha)

  // Parse route
  const parts = viajeName.split("→").map((s) => s.trim())
  const destino = parts[0] || viajeName // El destino es de dónde sale el viaje
  const origen = lugar || parts[1] || "" // El origen es el punto de abordaje

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%, #f5f3ff 100%)",
        fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
        paddingBottom: 120,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cs-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e8ecf4;
          overflow: hidden;
          transition: box-shadow 0.25s ease;
        }
        .cs-card:hover {
          box-shadow: 0 8px 32px -8px rgba(99,102,241,0.1);
        }

        .cs-ticket-notch-left,
        .cs-ticket-notch-right {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%);
          top: 50%;
          transform: translateY(-50%);
        }
        .cs-ticket-notch-left { left: -10px; }
        .cs-ticket-notch-right { right: -10px; }

        .cs-fade-in {
          animation: csFadeUp 0.45s ease-out both;
        }
        @keyframes csFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cs-ping {
          animation: csPing 2.2s ease-in-out infinite;
        }
        @keyframes csPing {
          0% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.35); opacity: 0.08; }
          100% { transform: scale(1); opacity: 0.35; }
        }

        .cs-seat-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          min-width: 48px;
          padding: 0 14px;
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 15px;
          color: #4338ca;
          background: #eef2ff;
          border: 1px solid #e0e7ff;
        }
      `}</style>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>
        
        {/* ── Success Header ── */}
        <div
          className="cs-fade-in"
          style={{
            padding: "40px 0 8px",
            textAlign: "center",
            animationDelay: "0.05s",
          }}
        >
          {/* Animated checkmark */}
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
              margin: "0 auto 20px",
            }}
          >
            <div
              className="cs-ping"
              style={{
                position: "absolute",
                inset: -6,
                borderRadius: "50%",
                background: "#6366f1",
                opacity: 0.35,
              }}
            />
            <div
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 28px -4px rgba(99,102,241,0.45)",
              }}
            >
              <Check size={34} color="#fff" strokeWidth={3} />
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            ¡Reserva confirmada!
          </h1>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Tu viaje está listo. Revisa los detalles a continuación.
          </p>
        </div>

        {/* ── Route Info ── */}
        <div
          className="cs-fade-in"
          style={{
            margin: "20px 0",
            animationDelay: "0.12s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "#475569",
              marginBottom: 4,
              paddingLeft: 2,
            }}
          >
            <MapPin size={16} style={{ color: "#6366f1" }} />
            {origen} → {destino}
          </div>
          {fechaCompleta && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#94a3b8",
                paddingLeft: 24,
              }}
            >
              {fechaCompleta}
            </p>
          )}
        </div>

        {/* ── Boarding Pass Ticket ── */}
        <div
          className="cs-card cs-fade-in"
          style={{ animationDelay: "0.18s" }}
        >
          {/* ── Top section: Route with gradient ── */}
          <div
            style={{
              padding: "24px 24px 20px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -20,
                left: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
              }}
            />

            {/* Label */}
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 16,
              }}
            >
              Pase de Abordaje
            </p>

            {/* Route */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              {/* Origin = Punto de abordaje */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    wordBreak: "break-word",
                  }}
                >
                  {origen}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.55)",
                    marginTop: 2,
                  }}
                >
                  Punto de abordaje
                </p>
              </div>

              {/* Arrow */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 2,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.25)",
                  }}
                />
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowRight size={16} color="#fff" />
                </div>
                <div
                  style={{
                    width: 16,
                    height: 2,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.25)",
                  }}
                />
              </div>

              {/* Destination = A dónde va el viaje */}
              <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    wordBreak: "break-word",
                  }}
                >
                  {destino}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.55)",
                    marginTop: 2,
                  }}
                >
                  Destino
                </p>
              </div>
            </div>
          </div>

          {/* ── Perforated divider ── */}
          <div
            style={{
              height: 22,
              position: "relative",
              background:
                "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%)",
            }}
          >
            <span className="cs-ticket-notch-left" />
            <span className="cs-ticket-notch-right" />
            <div
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                top: "50%",
                transform: "translateY(-50%)",
                borderTop: "2px dashed #e2e8f0",
              }}
            />
          </div>

          {/* ── Bottom section: Details ── */}
          <div style={{ padding: "24px" }}>
            
            {/* Date, Time, Seats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Date */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#fef3c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <CalendarDays size={20} color="#d97706" />
                </div>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#1e293b",
                    lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {dia}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#b45309",
                    marginTop: 3,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {mes}
                </p>
              </div>

              {/* Time */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <Clock size={20} color="#2563eb" />
                </div>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#1e293b",
                    lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {hora || "--:--"}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1d4ed8",
                    marginTop: 3,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Salida
                </p>
              </div>

              {/* Seats */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#e0e7ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <Users size={20} color="#4f46e5" />
                </div>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#1e293b",
                    lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {asientos.length}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#4338ca",
                    marginTop: 3,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {asientos.length === 1 ? "Asiento" : "Asientos"}
                </p>
              </div>
            </div>

            {/* Seat chips */}
            {asientos.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                {asientos.map((s, i) => (
                  <span
                    key={s}
                    className="cs-seat-chip"
                    style={{
                      background:
                        i === 0
                          ? "#eef2ff"
                          : i === 1
                          ? "#f3e8ff"
                          : "#ecfeff",
                      borderColor:
                        i === 0
                          ? "#e0e7ff"
                          : i === 1
                          ? "#e9d5ff"
                          : "#cffafe",
                      color:
                        i === 0
                          ? "#4338ca"
                          : i === 1
                          ? "#7c3aed"
                          : "#0891b2",
                    }}
                  >
                    #{s}
                  </span>
                ))}
              </div>
            )}

            {/* Location — Full address */}
            {lugar && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "#f8fafc",
                  border: "1px solid #e8ecf4",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={18} color="#ef4444" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 3,
                    }}
                  >
                    Punto de abordaje
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1e293b",
                      lineHeight: 1.4,
                    }}
                  >
                    {lugar}
                  </p>
                </div>
              </div>
            )}

            {/* Important notice */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
                border: "1px solid #fde68a",
              }}
            >
              <Sparkles
                size={18}
                color="#d97706"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#92400e",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  Importante
                </p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#a16207",
                    lineHeight: 1.5,
                  }}
                >
                  Llega al menos{" "}
                  <span style={{ fontWeight: 700, color: "#92400e" }}>
                    15 minutos antes
                  </span>{" "}
                  de la hora de salida. Presenta este comprobante al abordar.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Trust badge ── */}
        <div
          className="cs-fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 24,
            fontSize: 11,
            fontWeight: 600,
            color: "#94a3b8",
            letterSpacing: "0.02em",
            animationDelay: "0.35s",
          }}
        >
          <ShieldCheck size={15} style={{ color: "#22c55e" }} />
          Tu reserva está segura y confirmada
        </div>
      </div>
    </div>
  )
}