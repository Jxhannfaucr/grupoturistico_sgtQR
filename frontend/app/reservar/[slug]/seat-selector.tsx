"use client"

import { useMemo } from "react"
import { ArrowRight, Info, X, Armchair } from "lucide-react"

type SeatSelectorProps = {
  totalAsientos: number
  disponibles: string[]
  ocupados: string[]
  selected: string[]
  maxSelectable: number
  precio: number
  tipoPlantilla: string
  onToggle: (numero: string) => void
  onContinue: () => void
}

function formatPrecio(precio: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(precio)
}

export function SeatSelector({
  totalAsientos,
  disponibles,
  ocupados,
  selected,
  maxSelectable,
  precio,
  tipoPlantilla,
  onToggle,
  onContinue,
}: SeatSelectorProps) {
  const seats = useMemo(
    () => Array.from({ length: totalAsientos }, (_, i) => String(i + 1)),
    [totalAsientos]
  )

  // LÓGICA MATEMÁTICA DE PLANTILLAS
  const rows = useMemo(() => {
    const result: { layout: string; seats: string[] }[] = []
    let i = 0
    
    while (i < seats.length) {
      const asientosRestantes = seats.length - i

      // Plantilla 3: Refuerzo trasero (Últimos 5 asientos van seguidos sin pasillo)
      if (tipoPlantilla === '2x2_refuerzo' && asientosRestantes === 5) {
        result.push({ layout: 'full_5', seats: seats.slice(i, i + 5) })
        i += 5
      } 
      // Plantilla 2: Bus Ancho (3 a la izquierda, 2 a la derecha)
      else if (tipoPlantilla === '3x2_ancho') {
        result.push({ layout: '3+2', seats: seats.slice(i, i + 5) })
        i += 5
      } 
      // Plantilla 1: Estándar (2 a la izquierda, 2 a la derecha)
      else {
        result.push({ layout: '2+2', seats: seats.slice(i, i + 4) })
        i += 4
      }
    }
    return result
  }, [seats, tipoPlantilla])

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
        paddingBottom: 160,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .seat-fade-in {
          animation: seatFadeUp 0.4s ease-out both;
        }
        @keyframes seatFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Leyenda ── */}
      <div
        className="seat-fade-in"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginBottom: 24,
          animationDelay: "0.05s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#f1f5f9",
              border: "1.5px solid #e2e8f0",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
            }}
          >
            Disponible
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "1.5px solid #4338ca",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
            }}
          >
            Tu selección
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#f1f5f9",
              border: "1.5px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6,
            }}
          >
            <X size={12} color="#94a3b8" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
            }}
          >
            Ocupado
          </span>
        </div>
      </div>

      {/* ── Bus Visual ── */}
      <div
        className="seat-fade-in"
        style={{
          animationDelay: "0.12s",
          maxWidth: 360,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 32,
            border: "2.5px solid #e2e8f0",
            boxShadow: "0 8px 32px -8px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Cabina del conductor */}
          <div
            style={{
              background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
              padding: "20px 20px 16px",
              borderBottom: "2px dashed #e8ecf4",
              position: "relative",
            }}
          >
            {/* Espejos */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: -4,
                width: 8,
                height: 24,
                borderRadius: "4px 0 0 4px",
                background: "#e2e8f0",
                border: "1px solid #cbd5e1",
                borderRight: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 12,
                right: -4,
                width: 8,
                height: 24,
                borderRadius: "0 4px 4px 0",
                background: "#e2e8f0",
                border: "1px solid #cbd5e1",
                borderLeft: "none",
              }}
            />

            {/* Volante */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 20,
                  borderRadius: "20px 20px 0 0",
                  border: "2px solid #e2e8f0",
                  borderBottom: "none",
                  background: "#f8fafc",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  background: "#f8fafc",
                  padding: "2px 10px",
                  borderRadius: 20,
                  border: "1px solid #e8ecf4",
                }}
              >
                Conductor
              </span>
            </div>
          </div>

        {/* Área de asientos */}
        <div style={{ padding: "20px 16px 16px" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Pasillo central fijo con alineación dinámica */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  // Si es 3x2, el centro del pasillo se desplaza 28px a la derecha
                  left: tipoPlantilla === '3x2_ancho' ? "calc(50% + 28px)" : "50%",
                  transform: "translateX(-50%)",
                  width: 32,
                  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: 16,
                  border: "1px solid #e8ecf4",
                }}
              />

              {rows.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="seat-fade-in"
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: row.layout === 'full_5' ? 10 : 40, 
                    animationDelay: `${0.15 + rowIdx * 0.04}s`,
                    zIndex: 10 // Pasa por encima del pasillo visual
                  }}
                >
                  
                  {/* RENDERIZADO CONDICIONAL SEGÚN LA PLANTILLA DE LA FILA */}
                  {row.layout === 'full_5' ? (
                    // FILA TRASERA DE REFUERZO (5 asientos pegados)
                    <div style={{ display: "flex", gap: 10, background: "#fff", padding: "0 4px", borderRadius: 8 }}>
                      {row.seats.map((num) => (
                        <SeatButton key={num} numero={num} isOccupied={ocupados.includes(num)} isSelected={selected.includes(num)} onClick={() => onToggle(num)} />
                      ))}
                    </div>
                  ) : (
                    // FILAS NORMALES CON PASILLO (2+2 o 3+2)
                    <>
                      {/* Lado Izquierdo (Mete 3 si es ancho, 2 si es estándar) */}
                      <div style={{ display: "flex", gap: 10 }}>
                        {row.seats.slice(0, row.layout === '3+2' ? 3 : 2).map((num) => (
                          <SeatButton key={num} numero={num} isOccupied={ocupados.includes(num)} isSelected={selected.includes(num)} onClick={() => onToggle(num)} />
                        ))}
                      </div>

                      {/* Lado Derecho (Mete el resto de la fila) */}
                      <div style={{ display: "flex", gap: 10 }}>
                        {row.seats.slice(row.layout === '3+2' ? 3 : 2, 5).map((num) => (
                          <SeatButton key={num} numero={num} isOccupied={ocupados.includes(num)} isSelected={selected.includes(num)} onClick={() => onToggle(num)} />
                        ))}
                        
                        {/* Relleno visual si la última fila queda incompleta */}
                        {row.layout === '2+2' && row.seats.length > 2 && row.seats.length < 4 &&
                          Array.from({ length: 4 - row.seats.length }).map((_, i) => (
                            <div key={`empty-22-${i}`} style={{ width: 46, height: 48 }} />
                          ))
                        }
                        {row.layout === '3+2' && row.seats.length > 3 && row.seats.length < 5 &&
                          Array.from({ length: 5 - row.seats.length }).map((_, i) => (
                            <div key={`empty-32-${i}`} style={{ width: 46, height: 48 }} />
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Parte trasera del bus */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "0 20px 16px",
            }}
          >
            <div
              style={{
                width: "33%",
                height: 4,
                borderRadius: 4,
                background: "#e2e8f0",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid #e8ecf4",
          boxShadow: "0 -4px 24px -8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "16px 20px max(16px, env(safe-area-inset-bottom))",
          }}
        >
          {selected.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "8px 0",
              }}
            >
              <Info size={16} color="#6366f1" />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#64748b",
                }}
              >
                Selecciona hasta {maxSelectable} asiento
                {maxSelectable !== 1 ? "s" : ""}
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Chips de asientos */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  {selected.map((s) => (
                    <span
                      key={s}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: "#eef2ff",
                        border: "1px solid #e0e7ff",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#4338ca",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {formatPrecio(precio * selected.length)}
                </p>
              </div>

              <button
                type="button"
                onClick={onContinue}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 24px",
                  borderRadius: 16,
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  boxShadow: "0 4px 16px -2px rgba(99,102,241,0.35)",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px -4px rgba(99,102,241,0.45)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px -2px rgba(99,102,241,0.35)"
                }}
              >
                Continuar
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Seat Button Component ──────────────────────────────────
function SeatButton({
  numero,
  isOccupied,
  isSelected,
  onClick,
}: {
  numero: string
  isOccupied: boolean
  isSelected: boolean
  onClick: () => void
}) {
  if (isOccupied) {
    return (
      <div
        style={{
          width: 46,
          height: 48,
          borderRadius: "12px 12px 6px 6px",
          background: "#f1f5f9",
          border: "1.5px solid #e2e8f0",
          cursor: "not-allowed",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: "#e2e8f0",
            borderBottom: "1px solid #cbd5e1",
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            fontFamily: "'JetBrains Mono', monospace",
            position: "relative",
            zIndex: 1,
          }}
        >
          {numero}
        </span>
        <X
          size={24}
          color="#cbd5e1"
          strokeWidth={2.5}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.7,
          }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 46,
        height: 48,
        borderRadius: "12px 12px 6px 6px",
        border: isSelected ? "2px solid #4338ca" : "1.5px solid #e2e8f0",
        background: isSelected
          ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
          : "#fff",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 4,
        overflow: "hidden",
        transition: "all 0.2s ease",
        boxShadow: isSelected
          ? "0 4px 12px -2px rgba(99,102,241,0.35)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "#a5b4fc"
          e.currentTarget.style.background = "#f5f3ff"
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "#e2e8f0"
          e.currentTarget.style.background = "#fff"
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 12,
          background: isSelected ? "#4338ca" : "#f1f5f9",
          borderBottom: isSelected ? "1px solid #3730a3" : "1px solid #e2e8f0",
        }}
      />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: isSelected ? "#fff" : "#64748b",
          fontFamily: "'JetBrains Mono', monospace",
          position: "relative",
          zIndex: 1,
        }}
      >
        {numero}
      </span>
    </button>
  )
}