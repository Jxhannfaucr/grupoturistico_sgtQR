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
  Download,
  MailWarning,
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
function getSafeDate(fecha?: string | null) {
  if (!fecha) return new Date()
  // Si ya trae la "T" (ej. de un ISO format de backend), lo usa directo. Si no, le agrega la hora 00:00.
  return new Date(fecha.includes("T") ? fecha : `${fecha}T00:00:00`)
}

function formatFechaCompleta(fecha?: string | null) {
  if (!fecha) return ""
  const d = getSafeDate(fecha)
  return d.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatDiaYMes(fecha?: string | null) {
  if (!fecha) return { dia: "--", mes: "---" }
  const d = getSafeDate(fecha)
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
      fecha="2026-06-14T06:30:00"
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
  const destino = parts[0] || viajeName
  const origen = lugar || parts[1] || ""

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Generación de PDF
  const handleDownloadPDF = async () => {
  try {
      // Obtenemos el slug de la URL (ej: "19-zygos")
      const pathParts = window.location.pathname.split('/');
      const slug = pathParts[pathParts.length - 1]; 
      
      // EXTRAEMOS SOLO EL NÚMERO (Regex para capturar números al inicio)
      const match = slug.match(/^(\d+)/);
      const viajeId = match ? match[1] : null;
      
      if (!viajeId || asientos.length === 0) {
        alert("No se pudo identificar el ID del viaje.");
        return;
      }

      // 1. Construimos la URL base usando la variable de entorno
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      
      // 2. Usamos el objeto URL para construir la ruta de forma segura
      // Esto garantiza que el slash /api/viajes/ esté perfecto
      const url = new URL(`${baseUrl}/api/viajes/${viajeId}/descargar-pdf`);
      url.searchParams.append("asientos", asientos.join(','));

      console.log("Descargando de:", url.toString());

      const res = await fetch(url.toString(), {
        method: "GET",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error del servidor:", errorText);
        throw new Error("No se pudo generar el documento.");
      }

      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `Tiquete_${viajeName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlBlob);
      a.remove();

    } catch (error) {
      console.error(error);
      alert("Hubo un problema al generar el PDF. Verifica la consola.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%, #f5f3ff 100%)",
        fontFamily: "'Syne', 'DM Sans', -apple-system, sans-serif",
        paddingBottom: 120,
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cs-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e8ecf4;
          overflow: hidden;
          transition: box-shadow 0.25s ease;
        }
        .cs-card:hover {
          box-shadow: 0 12px 40px -12px rgba(234, 88, 12, 0.15);
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
          animation: csFadeUp 0.5s ease-out both;
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
          font-family: monospace;
          font-weight: 700;
          font-size: 15px;
          color: #ea580c;
          background: #fff7ed;
          border: 1px solid #ffedd5;
        }

        .cs-btn-pdf {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          font-weight: 700;
          font-size: 15px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 20px -6px rgba(234, 88, 12, 0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .cs-btn-pdf:active {
          transform: scale(0.98);
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
          {/* Animated checkmark (Orange Theme) */}
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
                background: "#f97316",
                opacity: 0.35,
              }}
            />
            <div
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 28px -4px rgba(234,88,12,0.45)",
              }}
            >
              <Check size={34} color="#fff" strokeWidth={3} />
            </div>
          </div>

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
              fontWeight: 600,
              color: "#475569",
              marginBottom: 4,
              paddingLeft: 2,
            }}
          >
            <MapPin size={16} style={{ color: "#ea580c" }} />
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
          style={{ animationDelay: "0.18s", marginBottom: 24 }}
        >
          {/* Top section: Route with Orange gradient */}
          <div
            style={{
              padding: "24px 24px 20px",
              background: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
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
                background: "rgba(255,255,255,0.05)",
              }}
            />

            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 16,
              }}
            >
              Pase de Abordaje
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 22,
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
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 4,
                  }}
                >
                  Abordaje
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 16, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.25)" }} />
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowRight size={16} color="#fff" />
                </div>
                <div style={{ width: 16, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.25)" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                <p
                  style={{
                    fontSize: 22,
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
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 4,
                  }}
                >
                  Destino
                </p>
              </div>
            </div>
          </div>

          {/* Perforated divider */}
          <div
            style={{
              height: 22,
              position: "relative",
              background: "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%)",
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
                borderTop: "2px dashed #cbd5e1",
              }}
            />
          </div>

          {/* Bottom section: Details */}
          <div style={{ padding: "24px" }}>
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
                    background: "#fef3c7", // Amarillo suave
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <CalendarDays size={20} color="#d97706" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1, fontFamily: "monospace" }}>
                  {dia}
                </p>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#b45309", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
                    background: "#ffedd5", // Naranja suave
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <Clock size={20} color="#ea580c" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1, fontFamily: "monospace" }}>
                  {hora || "--:--"}
                </p>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#c2410c", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
                    background: "#e0e7ff", // Azul/indigo suave
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <Users size={20} color="#4f46e5" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1, fontFamily: "monospace" }}>
                  {asientos.length}
                </p>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#4338ca", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
                {asientos.map((s) => (
                  <span key={s} className="cs-seat-chip">
                    #{s}
                  </span>
                ))}
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
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <Sparkles size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#0f172a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  Importante
                </p>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#475569", lineHeight: 1.5 }}>
                  Llega al menos <span style={{ fontWeight: 700, color: "#0f172a" }}>15 minutos antes</span> de la hora de salida. Presenta este comprobante al abordar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACCIONES Y LEYENDAS NUEVAS (Descarga y Correo) ── */}
        <div className="cs-fade-in" style={{ animationDelay: "0.22s" }}>
          <button className="cs-btn-pdf" onClick={handleDownloadPDF}>
            <Download size={20} strokeWidth={2.5} />
            Descargar Tiquete (PDF)
          </button>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "16px",
              borderRadius: 14,
              background: "#fff7ed", // Naranja extra claro
              border: "1px dashed #fdba74",
            }}
          >
            <MailWarning size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#9a3412", marginBottom: 4 }}>
                ¿No recibiste el correo?
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#c2410c", lineHeight: 1.5 }}>
                Verifica tu bandeja de Spam. Si hubo un error en tu correo, simplemente <b>descarga el PDF</b> usando el botón de arriba, o comunícate con la administración.
              </p>
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
            marginTop: 32,
            fontSize: 12,
            fontWeight: 600,
            color: "#94a3b8",
            letterSpacing: "0.02em",
            animationDelay: "0.30s",
          }}
        >
          <ShieldCheck size={16} style={{ color: "#22c55e" }} />
          Tu reserva está protegida y confirmada
        </div>
      </div>
    </div>
  )
}