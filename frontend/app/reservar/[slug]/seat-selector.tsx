"use client"

import { useMemo, useCallback, useRef, useEffect } from "react"
import { ArrowRight, Info, X, Bus } from "lucide-react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import Swal from "sweetalert2"

// ─── Utilidad cn() ───────────────────────────────────────────────────────────
function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
type SeatSelectorProps = {
  totalAsientos: number
  ocupados: string[]
  selected: string[]
  maxSelectable: number
  precio: number
  tipoPlantilla: string
  onToggle: (numero: string) => void
  onContinue: () => void
  onStartTimer: () => void
  onResetTimer: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPrecio(precio: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(precio)
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function SeatSelector({
  totalAsientos,
  ocupados,
  selected,
  maxSelectable,
  precio,
  tipoPlantilla,
  onToggle,
  onContinue,
  onStartTimer,
  onResetTimer,
}: SeatSelectorProps) {

  // ── Lógica de mapeo de asientos ──────────────────────────────────────────
  const seats = useMemo(
    () => Array.from({ length: totalAsientos }, (_, i) => String(i + 1)),
    [totalAsientos]
  )

  const rows = useMemo(() => {
    const result: { layout: string; seats: string[] }[] = []
    let i = 0
    while (i < seats.length) {
      const rem = seats.length - i
      if (tipoPlantilla === "2x2_refuerzo" && rem === 5) {
        result.push({ layout: "full_5", seats: seats.slice(i, i + 5) }); i += 5
      } else if (tipoPlantilla === "3x2_ancho") {
        result.push({ layout: "3+2", seats: seats.slice(i, i + 5) }); i += 5
      } else {
        result.push({ layout: "2+2", seats: seats.slice(i, i + 4) }); i += 4
      }
    }
    return result
  }, [seats, tipoPlantilla])

  // ── Handler de Clics (Comunica al padre el estado del timer) ─────────────
  const handleSeatClick = useCallback(async (numero: string) => {
    const isSelected = selected.includes(numero)

    // Si está deseleccionando...
    if (isSelected) {
      onToggle(numero)
      // Si era el último asiento que tenía seleccionado, apagamos el reloj global
      if (selected.length === 1) {
        onResetTimer()
      }
      return
    }

    // Si es su primer asiento, lanzamos advertencia y arrancamos reloj global
    if (selected.length === 0) {
      const result = await Swal.fire({
        title: "¿Apartar este asiento?",
        html: `<p style="color:#64748b;font-size:15px;line-height:1.6;margin-top:4px">
          Tienes <strong style="color:#ea580c">20 minutos</strong> para completar tu reserva.<br/>
          Si no finalizas a tiempo, el asiento <strong>se liberará automáticamente</strong>.
        </p>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, apartar →",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#ea580c",
        cancelButtonColor: "#94a3b8",
        reverseButtons: true,
        customClass: { popup: "ss-swal-popup", title: "ss-swal-title" },
        backdrop: "rgba(15,23,42,0.5)",
      })
      if (!result.isConfirmed) return
      
      onStartTimer()
    }

    onToggle(numero)
  }, [selected, onToggle, onStartTimer, onResetTimer])

  const is3x2 = tipoPlantilla === "3x2_ancho"
  const disponiblesCount = totalAsientos - ocupados.length

  return (
    <>
      <style>{`
        .ss-root { font-family: 'Syne', system-ui, sans-serif; }

        @keyframes ssRowIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ss-row-anim { animation: ssRowIn 0.45s cubic-bezier(.22,.8,.44,1) both; }

        @keyframes ssPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .ss-pop { animation: ssPop 0.22s ease-out; }

        @keyframes ssChipIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        .ss-chip { animation: ssChipIn 0.18s cubic-bezier(.34,1.56,.64,1) both; }

        @keyframes ssBarIn {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .ss-bar { animation: ssBarIn 0.35s cubic-bezier(.22,.8,.44,1) both; }

        .ss-btn {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 60%, #dc2626 100%);
          transition: box-shadow 0.2s ease, transform 0.15s ease;
        }
        .ss-btn:hover  { box-shadow: 0 8px 28px -4px rgba(234,88,12,0.55); transform: translateY(-1px); }
        .ss-btn:active { transform: translateY(0) scale(0.98); }

        .ss-seat-avail:focus:not(:focus-visible) {
          outline: none;
          box-shadow: none;
        }

        .ss-bus-scroll { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .ss-bus-scroll::-webkit-scrollbar { display: none; }

        .ss-swal-popup  { border-radius: 20px !important; padding: 28px 24px !important; font-family: 'Syne', system-ui, sans-serif !important; }
        .ss-swal-title  { font-size: 20px !important; font-weight: 700 !important; color: #0f172a !important; }

        .ss-bus-scaler {
          width: 100%;
          display: flex;
          justify-content: center;
          overflow: hidden;         
        }
        .ss-bus-inner {
          transform-origin: top center;
          transform: scale(var(--bus-scale, 1));
        }
      `}</style>

      {/* ── Cuerpo principal ─────────────────────────────────── */}
      <div className="ss-root pb-22" style={{ paddingTop: "20px" }}>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-5 px-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-green-500 border-[1.5px] border-green-600 shadow-[0_1px_3px_rgba(34,197,94,0.3)]" />
            <span className="text-[11px] font-600 uppercase tracking-widest text-slate-500">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-b from-orange-400 to-orange-600 border-2 border-orange-700 shadow-[0_2px_8px_rgba(249,115,22,0.4)]" />
            <span className="text-[11px] font-600 uppercase tracking-widest text-slate-500">Tu selección</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-red-500 border-[1.5px] border-red-600 flex items-center justify-center shadow-[0_1px_3px_rgba(239,68,68,0.3)]">
              <X size={10} className="text-white" strokeWidth={3} />
            </div>
            <span className="text-[11px] font-600 uppercase tracking-widest text-slate-500">Ocupado</span>
          </div>
        </div>

        <BusScaler is3x2={is3x2}>
          <div
            className={cn(
              "relative rounded-[36px] overflow-hidden",
              "border-[3px] border-slate-200 bg-white",
              "shadow-[0_20px_60px_-12px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.03)]",
              is3x2 ? "w-[325px]" : "w-[300px]"
            )}
          >
            <div className="absolute top-5 -left-2 w-2.5 h-7 rounded-l-md bg-slate-200 border border-slate-300 border-r-0 z-20" />
            <div className="absolute top-5 -right-2 w-2.5 h-7 rounded-r-md bg-slate-200 border border-slate-300 border-l-0 z-20" />

            <div className="relative bg-gradient-to-b from-slate-50 to-white px-6 pt-5 pb-4 border-b-2 border-dashed border-slate-200">
              <div className="mx-auto mb-3 rounded-xl h-8 w-4/5 bg-gradient-to-b from-sky-100/80 to-sky-50/40 border border-sky-200/70" />
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full border-[3px] border-slate-300 flex items-center justify-center bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-300 rounded-full" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-300 rounded-full" />
                  </div>
                </div>
                <span className="text-[9px] font-700 uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-3 py-0.5 rounded-full border border-slate-200">
                  Conductor
                </span>
              </div>
            </div>

            <div className={cn("pt-5 pb-4 w-full", is3x2 ? "px-5" : "px-6")}>
              <div className="relative flex flex-col gap-3 w-full">
                <div
                  className="absolute top-0 bottom-0 w-7 rounded-2xl -z-0 bg-gradient-to-b from-slate-100 to-slate-50 border border-slate-200/60"
                  style={{
                    left: is3x2 ? "calc(50% + 24px)" : "50%",
                    transform: "translateX(-50%)",
                  }}
                />

                {rows.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={cn(
                      "ss-row-anim relative flex items-center z-10 w-full",
                      row.layout === "2+2" ? "justify-between" : "justify-center"
                    )}
                    style={{
                      gap: row.layout === "3+2" ? 50 : (row.layout === "full_5" ? 8 : undefined),
                      animationDelay: `${0.1 + rowIdx * 0.045}s`,
                    }}
                  >
                    {row.layout === "full_5" ? (
                      <div className="flex gap-2 bg-white px-1 rounded-lg">
                        {row.seats.map((num) => (
                          <SeatButton key={num} numero={num}
                            isOccupied={ocupados.includes(num)}
                            isSelected={selected.includes(num)}
                            onClick={() => handleSeatClick(num)} />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          {row.seats.slice(0, row.layout === "3+2" ? 3 : 2).map((num) => (
                            <SeatButton key={num} numero={num}
                              isOccupied={ocupados.includes(num)}
                              isSelected={selected.includes(num)}
                              onClick={() => handleSeatClick(num)} />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {row.seats.slice(row.layout === "3+2" ? 3 : 2, 5).map((num) => (
                            <SeatButton key={num} numero={num}
                              isOccupied={ocupados.includes(num)}
                              isSelected={selected.includes(num)}
                              onClick={() => handleSeatClick(num)} />
                          ))}
                          {row.layout === "2+2" && row.seats.length < 4 &&
                            Array.from({ length: 4 - row.seats.length }).map((_, i) => (
                              <div key={`e22-${i}`} className="w-[44px] h-[50px]" />
                            ))}
                          {row.layout === "3+2" && row.seats.length > 3 && row.seats.length < 5 &&
                            Array.from({ length: 5 - row.seats.length }).map((_, i) => (
                              <div key={`e32-${i}`} className="w-[44px] h-[50px]" />
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pb-4 px-5">
              <div className="w-2/5 h-1.5 rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
            </div>
          </div>
        </BusScaler>

        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-600 text-slate-500 uppercase tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            {disponiblesCount} asientos disponibles
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ────────────────────────────────────────────── */}
      <div className={cn(
        "ss-bar fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 backdrop-blur-xl",
        "border-t border-slate-200/80",
        "shadow-[0_-8px_40px_-8px_rgba(0,0,0,0.12)]"
      )}>
        <div className="max-w-lg mx-auto px-5 py-3"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>

          {selected.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-50 border border-orange-100">
                <Info size={14} className="text-orange-500" />
              </div>
              <span className="text-sm font-500 text-slate-500">
                Selecciona hasta <span className="font-700 text-slate-700">{maxSelectable}</span>{" "}
                asiento{maxSelectable !== 1 ? "s" : ""}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {selected.map((s) => (
                    <span key={s}
                      className="ss-chip inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[11px] font-700 text-orange-700"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      #{s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xl font-800 text-slate-900 leading-none tracking-tight"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatPrecio(precio * selected.length)}
                  </p>
                </div>
              </div>

              <button type="button" onClick={onContinue}
                className={cn(
                  "ss-btn flex items-center gap-2",
                  "px-5 py-3.5 rounded-2xl",
                  "text-white text-[14px] font-700",
                  "shadow-[0_4px_18px_-2px_rgba(249,115,22,0.4)]",
                  "border-none outline-none cursor-pointer shrink-0 select-none"
                )}
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Continuar
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function BusScaler({ is3x2, children }: { is3x2: boolean; children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const innerRef   = useRef<HTMLDivElement>(null)
  const NATURAL_W = is3x2 ? 316 : 266

  useEffect(() => {
    const wrapper = wrapperRef.current
    const inner   = innerRef.current
    if (!wrapper || !inner) return

    const apply = () => {
      const available = wrapper.clientWidth
      const scale     = available >= NATURAL_W ? 1 : available / NATURAL_W
      inner.style.setProperty("--bus-scale", String(scale.toFixed(4)))
      const naturalH = inner.scrollHeight
      wrapper.style.height = scale < 1 ? `${naturalH * scale}px` : ""
    }

    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [is3x2, NATURAL_W])

  return (
    <div ref={wrapperRef} className="ss-bus-scaler px-4 mb-2">
      <div ref={innerRef} className="ss-bus-inner">
        {children}
      </div>
    </div>
  )
}

function SeatButton({
  numero, isOccupied, isSelected, onClick,
}: { numero: string; isOccupied: boolean; isSelected: boolean; onClick: () => void }) {

  if (isOccupied) {
    return (
      <div
        className="relative flex flex-col items-center justify-end pb-1 w-[44px] h-[50px] rounded-t-xl rounded-b-md bg-red-500 border-[1.5px] border-red-600 cursor-not-allowed overflow-hidden shadow-[0_1px_4px_rgba(239,68,68,0.3)]"
      >
        <div className="absolute top-0 left-0 right-0 h-3 bg-red-600 border-b border-red-700" />
        <X size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" strokeWidth={2.5} />
        <span className="relative z-10 text-[10px] font-700 text-white"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>{numero}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ss-seat-avail",
        "relative flex flex-col items-center justify-end pb-1",
        "w-[44px] h-[50px] rounded-t-xl rounded-b-md",
        "overflow-hidden cursor-pointer select-none",
        "transition-[border-color,box-shadow] duration-150 ease-out",
        "outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1",
        !isSelected && [
          "bg-green-500 border-[1.5px] border-green-600",
          "shadow-[0_1px_4px_rgba(34,197,94,0.3)]",
        ],
        isSelected && [
          "border-2 border-orange-700",
          "shadow-[0_6px_18px_-2px_rgba(249,115,22,0.5)]",
          "ss-pop",
        ]
      )}
      style={isSelected ? { background: "linear-gradient(to bottom, #fb923c, #ea580c)" } : undefined}
    >
      <div className={cn(
        "absolute top-0 left-0 right-0 h-3",
        isSelected
          ? "bg-orange-700/60 border-b border-orange-800/30"
          : "bg-green-600 border-b border-green-700"
      )} />
      {!isSelected && (
        <div className="absolute top-3 left-1.5 right-1.5 bottom-5 rounded-sm bg-green-400 border border-green-500" />
      )}
      <span
        className={cn("relative z-10 text-[10px] font-700", isSelected ? "text-white drop-shadow-sm" : "text-white drop-shadow-sm")}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {numero}
      </span>
    </button>
  )
}