"use client"

import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Mail,
  ShieldCheck,
  Ticket,
  User,
  MapPin,
  Info,
} from "lucide-react";

/* ── Types ── */
type PasajeroForm = {
  numero_asiento: string
  nombre_pasajero: string
  email_pasajero: string
}

type PassengerFormProps = {
  pasajeros: PasajeroForm[]
  precio: number
  viajeName: string
  fechaViaje?: string
  isSubmitting: boolean
  onUpdate: (index: number, field: keyof PasajeroForm, value: string) => void
  onBack: () => void
  onSubmit: () => void
}

/* ── Helpers ── */
function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(precio);
}

/* ── Demo wrapper ── */
export default function PassengerFormDemo() {
  const [pasajeros, setPasajeros] = useState([
    { numero_asiento: "12", nombre_pasajero: "", email_pasajero: "" },
    { numero_asiento: "13", nombre_pasajero: "", email_pasajero: "" },
    { numero_asiento: "14", nombre_pasajero: "", email_pasajero: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = (index: number, field: keyof PasajeroForm, value: string) => {
    setPasajeros((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2500);
  };

  return (
    <PassengerForm
      pasajeros={pasajeros}
      precio={8500}
      viajeName="San José → Liberia"
      fechaViaje="Sábado 14 de junio, 2026"
      isSubmitting={isSubmitting}
      onUpdate={handleUpdate}
      onBack={() => {}}
      onSubmit={handleSubmit}
    />
  );
}

/* ── Main Component ── */
export function PassengerForm({
  pasajeros,
  precio,
  viajeName,
  fechaViaje,
  isSubmitting,
  onUpdate,
  onBack,
  onSubmit,
}: PassengerFormProps) {
  const total = precio * pasajeros.length;
  const allNamesValid = pasajeros.every((p) => p.nombre_pasajero.trim().length > 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%, #f5f3ff 100%)",
        fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pf-input {
          width: 100%;
          height: 52px;
          padding: 0 16px 0 48px;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: #1e293b;
          outline: none;
          transition: all 0.2s ease;
        }
        .pf-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
        .pf-input:focus {
          background: #fff;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.08);
        }

        .pf-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e8ecf4;
          overflow: hidden;
          transition: box-shadow 0.25s ease;
        }
        .pf-card:hover {
          box-shadow: 0 8px 32px -8px rgba(99,102,241,0.1);
        }

        .pf-btn-submit {
          width: 100%;
          height: 56px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: 0.02em;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px -2px rgba(99,102,241,0.35);
          position: relative;
          overflow: hidden;
        }
        .pf-btn-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .pf-btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -4px rgba(99,102,241,0.45);
        }
        .pf-btn-submit:active:not(:disabled) {
          transform: translateY(0) scale(0.99);
        }
        .pf-btn-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .pf-ticket-notch-left,
        .pf-ticket-notch-right {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(168deg, #f0f4ff 0%, #fafbff 40%);
          top: 50%;
          transform: translateY(-50%);
        }
        .pf-ticket-notch-left { left: -10px; }
        .pf-ticket-notch-right { right: -10px; }

        .pf-fade-in {
          animation: pfFadeUp 0.4s ease-out both;
        }
        @keyframes pfFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pf-spin { animation: pfSpin 1s linear infinite; }
        @keyframes pfSpin { to { transform: rotate(360deg); } }

        .pf-seat-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }
      `}</style>

      {/* ─── Top Navigation ─── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(240,244,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(226,232,240,0.6)",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 20px" }}>
          <button
            type="button"
            onClick={onBack}
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
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div
          className="pf-fade-in"
          style={{ padding: "24px 0 8px", animationDelay: "0.05s" }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            Datos de pasajeros
          </h1>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
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
              }}
            >
              <MapPin size={16} style={{ color: "#6366f1" }} />
              {viajeName}
            </div>
            {fechaViaje && (
              <span
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  fontWeight: 500,
                  paddingLeft: 24,
                }}
              >
                {fechaViaje}
              </span>
            )}
          </div>
        </div>

        {/* Summary pill */}
        <div
          className="pf-fade-in"
          style={{
            margin: "16px 0 20px",
            padding: "12px 16px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
            border: "1px solid #e0e7ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animationDelay: "0.1s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ticket size={18} style={{ color: "#6366f1" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#4338ca" }}>
              {pasajeros.length} asiento{pasajeros.length !== 1 ? "s" : ""}
            </span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#312e81" }}>
            {formatPrecio(total)}
          </span>
        </div>

        {/* ─── Passenger Cards ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingBottom: 200, // espacio para la barra inferior
          }}
        >
          {pasajeros.map((p: PasajeroForm, i: number) => (
            <div
              key={p.numero_asiento}
              className="pf-card pf-fade-in"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              {/* Card header — ticket style */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderBottom: "1.5px dashed #e8ecf4",
                  position: "relative",
                }}
              >
                <span className="pf-ticket-notch-left" />
                <span className="pf-ticket-notch-right" />

                <span
                  className="pf-seat-badge"
                  style={{
                    background:
                      i === 0
                        ? "linear-gradient(135deg, #6366f1, #818cf8)"
                        : i === 1
                        ? "linear-gradient(135deg, #8b5cf6, #a78bfa)"
                        : "linear-gradient(135deg, #06b6d4, #67e8f9)",
                    color: "#fff",
                    boxShadow:
                      i === 0
                        ? "0 4px 12px -2px rgba(99,102,241,0.3)"
                        : i === 1
                        ? "0 4px 12px -2px rgba(139,92,246,0.3)"
                        : "0 4px 12px -2px rgba(6,182,212,0.3)",
                  }}
                >
                  {p.numero_asiento}
                </span>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 2,
                    }}
                  >
                    Asiento
                  </p>
                  <p
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#1e293b",
                      lineHeight: 1,
                    }}
                  >
                    {formatPrecio(precio)}
                  </p>
                </div>
              </div>

              {/* Card body — form fields */}
              <div style={{ padding: "20px 20px 24px" }}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    Nombre completo{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={18}
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                    />
                    <input
                      type="text"
                      value={p.nombre_pasajero}
                      onChange={(e) =>
                        onUpdate(i, "nombre_pasajero", e.target.value)
                      }
                      placeholder="Ej. María Pérez"
                      className="pf-input"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    Correo electrónico{" "}
                    <span
                      style={{
                        color: "#94a3b8",
                        textTransform: "none",
                        fontWeight: 400,
                        fontSize: 12,
                      }}
                    >
                      (Opcional)
                    </span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={18}
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                    />
                    <input
                      type="email"
                      value={p.email_pasajero}
                      onChange={(e) =>
                        onUpdate(i, "email_pasajero", e.target.value)
                      }
                      placeholder="correo@ejemplo.com"
                      className="pf-input"
                    />
                  </div>
                  {i === 0 && (
                    <p
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 500,
                      }}
                    >
                      <Info size={14} style={{ color: "#a5b4fc", flexShrink: 0 }} />
                      Los boletos se enviarán a este correo
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Fixed Bottom Bar ─── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid #e8ecf4",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "16px 20px max(16px, env(safe-area-inset-bottom))",
          }}
        >
          {/* Total row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 14,
              padding: "0 4px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 2,
                }}
              >
                Total a pagar
              </p>
              <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                {pasajeros.length} asiento
                {pasajeros.length !== 1 ? "s" : ""} × {formatPrecio(precio)}
              </p>
            </div>
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {formatPrecio(total)}
            </span>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !allNamesValid}
            className="pf-btn-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="pf-spin" />
                Procesando reserva…
              </>
            ) : (
              <>
                <Ticket size={20} />
                Confirmar y reservar
              </>
            )}
          </button>

          {/* Trust badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 12,
              fontSize: 11,
              fontWeight: 600,
              color: "#94a3b8",
              letterSpacing: "0.02em",
            }}
          >
            <ShieldCheck size={15} style={{ color: "#22c55e" }} />
            Transacción segura y encriptada
          </div>
        </div>
      </div>
    </div>
  );
}