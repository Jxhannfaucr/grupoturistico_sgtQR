"use client"

import { ArrowLeft, Loader2, Mail, ShieldCheck, Ticket, User, MapPin, Info, KeyRound } from "lucide-react";
import type { PasajeroForm } from "./page";

/* ── Types ── */
type PassengerFormProps = {
  pasajeros: PasajeroForm[]
  precio: number
  viajeName: string
  fechaViaje?: string
  isSubmitting: boolean
  tokenReserva: string
  onTokenChange: (token: string) => void
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

/* ── Main Component ── */
export function PassengerForm({
  pasajeros,
  precio,
  viajeName,
  fechaViaje,
  isSubmitting,
  tokenReserva,
  onTokenChange,
  onUpdate,
  onBack,
  onSubmit,
}: PassengerFormProps) {
  const total = precio * pasajeros.length;
  const allNamesValid = pasajeros.every((p) => p.nombre_pasajero.trim().length > 0);
  const isTokenValid = tokenReserva.trim().length > 3;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
        position: "relative",
      }}
    >
      <style>{`
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
        .pf-input:focus {
          background: #fff;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.08);
        }
      `}</style>

      {/* ─── Top Navigation y Headers se mantienen igual ─── */}
      <div style={{ paddingBottom: 240 }}>
        {/* ... (Listado de Tarjetas de Pasajeros Original de tu colega) ... */}
        {/* Simulación del renderizado de pasajeros para brevedad */}
        {pasajeros.map((p, i) => (
             <div key={p.numero_asiento}> {/* Mantén el diseño de la tarjeta de pasajero original aquí */} </div>
        ))}

        {/* NUEVA SECCIÓN: TOKEN DE COMPRA */}
        <div
            className="pf-fade-in pf-card"
            style={{ 
                marginTop: 24, 
                padding: "24px 20px", 
                border: "2px solid #e0e7ff",
                background: "linear-gradient(180deg, #fff 0%, #f8fafc 100%)"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <KeyRound size={20} color="#4f46e5" />
                </div>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Token de Autorización</h3>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Requerido para confirmar la reserva</p>
                </div>
            </div>

            <div style={{ position: "relative" }}>
                <Ticket
                    size={18}
                    style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                />
                <input
                    type="text"
                    value={tokenReserva}
                    onChange={(e) => onTokenChange(e.target.value.toUpperCase())}
                    placeholder="Ej. TKN-8F92A"
                    className="pf-input"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
                />
            </div>
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
          {/* ... (Total row se mantiene igual) ... */}
          
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !allNamesValid || !isTokenValid}
            className="pf-btn-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="pf-spin" />
                Validando token y reservando…
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                Confirmar con Token
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}