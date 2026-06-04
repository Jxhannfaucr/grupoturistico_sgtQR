"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { ArrowRight, Info, X, Bus, MapPin, Clock, CalendarDays, Timer } from "lucide-react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import Swal from "sweetalert2"

// ─── Utilidad cn() ───────────────────────────────────────────────────────────
function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
type SeatSelectorProps = {
  // Core (sin tocar)
  totalAsientos: number
  disponibles: string[]
  ocupados: string[]
  selected: string[]
  maxSelectable: number
  precio: number
  tipoPlantilla: string
  onToggle: (numero: string) => void
  onContinue: () => void
  // Props opcionales – Header (Dinámicos desde la BD)
  nombreViaje?: string
  ruta?: string
  fecha?: string
  horaSalida?: string
  logoSrc?: string        
  logoAlt?: string        
}

const TIMER_MINUTES = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPrecio(precio: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(precio)
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// ─── Componente principal ─────────────────────────────────────────────────────
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
  nombreViaje = "",
  ruta = "",
  fecha = "",
  horaSalida = "",
  logoSrc = "/images/logo.jpeg",
  logoAlt = "Logo empresa",
}: SeatSelectorProps) {
  // ── Temporizador ────────────────────────────────────────────────────────────
  const [timerActive, setTimerActive]   = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(TIMER_MINUTES * 60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  useEffect(() => {
    if (!timerActive) return
    intervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); setTimerActive(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerActive])

  // ── Lógica core intacta ──────────────────────────────────────────────────
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

  // ── Handler con SweetAlert2 ─────────────────────────────────────────────
  const handleSeatClick = useCallback(async (numero: string) => {
    const isSelected = selected.includes(numero)

    if (isSelected) {
      onToggle(numero)
      if (selected.length === 1) {
        setTimerActive(false)
        setTimerSeconds(TIMER_MINUTES * 60)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
      return
    }

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
      setTimerSeconds(TIMER_MINUTES * 60)
      setTimerActive(true)
    }

    onToggle(numero)
  }, [selected, onToggle])

  const timerPercent = timerSeconds / (TIMER_MINUTES * 60)
  const timerUrgent  = timerSeconds < 120
  const is3x2        = tipoPlantilla === "3x2_ancho"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

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

        @keyframes ssHeaderIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ss-header-anim { animation: ssHeaderIn 0.35s cubic-bezier(.22,.8,.44,1) both; }

        .ss-btn {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 60%, #dc2626 100%);
          transition: box-shadow 0.2s ease, transform 0.15s ease;
        }
        .ss-btn:hover  { box-shadow: 0 8px 28px -4px rgba(234,88,12,0.55); transform: translateY(-1px); }
        .ss-btn:active { transform: translateY(0) scale(0.98); }

        @media (hover: hover) and (pointer: fine) {
          .ss-seat-avail:hover {
            border-color: #fb923c !important;
            background-color: #fff7ed !important;
          }
        }
        .ss-seat-avail:focus:not(:focus-visible) {
          outline: none;
          box-shadow: none;
        }

        .ss-bus-scroll { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .ss-bus-scroll::-webkit-scrollbar { display: none; }

        @keyframes ssUrgent {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        .ss-urgent { animation: ssUrgent 1s ease-in-out infinite; }

        .ss-ring-track { stroke: #fed7aa; }
        .ss-ring-fill  { stroke: #ea580c; stroke-linecap: round; transition: stroke-dashoffset 1s linear; }
        .ss-ring-fill-urgent { stroke: #dc2626; }

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

      {/* ── Header FIXED ─────────────────────────────────────── */}
      <header
        className={cn(
          "ss-header-anim",
          "fixed top-0 left-0 right-0 z-50",
          "bg-white/97 backdrop-blur-xl",
          "border-b border-slate-100",
          "shadow-[0_2px_20px_-4px_rgba(0,0,0,0.10)]"
        )}
      >
        <div className="max-w-lg mx-auto">

          {/* Franja logo */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100/80">
            <div
              className={cn(
                "h-8 w-8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center",
                "bg-gradient-to-br from-orange-500 to-orange-700",
                "shadow-[0_2px_8px_rgba(234,88,12,0.35)]"
              )}
            >
              <img
                src={logoSrc}
                alt={logoAlt}
                className="h-8 w-auto object-cover bg-white"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                  if (fallback) fallback.style.display = "flex"
                }}
              />
              <span style={{ display: "none" }} className="items-center justify-center w-full h-full">
                <Bus size={16} className="text-white" strokeWidth={2} />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-700 text-slate-800 truncate leading-tight">
                {nombreViaje || "Viaje Especial"}
              </p>
              {ruta && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-orange-500 shrink-0" strokeWidth={2.5} />
                  <span className="text-[11px] font-500 text-slate-500 truncate">{"Lugar de salida: " + ruta}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pills de detalles - Solo Fecha y Hora */}
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto ss-bus-scroll">
            {fecha && <DetailPill icon={<CalendarDays size={11} strokeWidth={2.5} />} label={fecha} />}
            {horaSalida && <DetailPill icon={<Clock size={11} strokeWidth={2.5} />} label={horaSalida} />}
            {precio > 0 && <DetailPill icon={<div className="font-bold"></div>} label={formatPrecio(precio)} />}
          </div>
        </div>
      </header>

      {/* ── Cuerpo principal ─────────────────────────────────── */}
      <div className="ss-root pb-44" style={{ paddingTop: "40px" }}>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-5 px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white border-[1.5px] border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" />
            <span className="text-[11px] font-600 uppercase tracking-widest text-slate-500">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-b from-orange-400 to-orange-600 border-2 border-orange-700 shadow-[0_2px_8px_rgba(249,115,22,0.4)]" />
            <span className="text-[11px] font-600 uppercase tracking-widest text-slate-500">Tu selección</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-slate-100 border-[1.5px] border-slate-200 flex items-center justify-center opacity-50">
              <X size={10} className="text-slate-400" strokeWidth={3} />
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

            {/* ── Zona de asientos (MODIFICADA PARA EMPUJAR A LOS BORDES) ── */}
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
                      // 2x2 mantiene su diseño a los bordes, 3x2 y refuerzo se centran
                      row.layout === "2+2" ? "justify-between" : "justify-center"
                    )}
                    style={{
                      // Aplicamos el tamaño exacto del pasillo solo al 3x2 (36px o 40px)
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
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
            {disponibles.filter((d) => !ocupados.includes(d) && !selected.includes(d)).length} asientos disponibles
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

                  {timerActive && (
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-xl",
                      timerUrgent
                        ? "bg-red-50 border border-red-200 ss-urgent"
                        : "bg-amber-50 border border-amber-200"
                    )}>
                      <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
                        <circle cx="9" cy="9" r="7" fill="none" strokeWidth="2" className="ss-ring-track" />
                        <circle cx="9" cy="9" r="7" fill="none" strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 7}`}
                          strokeDashoffset={`${2 * Math.PI * 7 * (1 - timerPercent)}`}
                          className={cn("ss-ring-fill", timerUrgent && "ss-ring-fill-urgent")}
                          transform="rotate(-90 9 9)" />
                      </svg>
                      <span className={cn("text-[12px] font-700 tabular-nums",
                        timerUrgent ? "text-red-600" : "text-amber-700")}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatTimer(timerSeconds)}
                      </span>
                      <Timer size={11} className={timerUrgent ? "text-red-500" : "text-amber-600"} strokeWidth={2.5} />
                    </div>
                  )}
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

function DetailPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-600 text-slate-600">
      <span className="text-orange-500">{icon}</span>
      {label}
    </div>
  )
}

function SeatButton({
  numero, isOccupied, isSelected, onClick,
}: { numero: string; isOccupied: boolean; isSelected: boolean; onClick: () => void }) {

  if (isOccupied) {
    return (
      <div
        className="relative flex flex-col items-center justify-end pb-1 w-[44px] h-[50px] rounded-t-xl rounded-b-md bg-slate-100 border-[1.5px] border-slate-200 cursor-not-allowed overflow-hidden opacity-45"
        aria-label={`Asiento ${numero} ocupado`} role="img"
      >
        <div className="absolute top-0 left-0 right-0 h-3 bg-slate-200 border-b border-slate-300" />
        <X size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" strokeWidth={2.5} />
        <span className="relative z-10 text-[10px] font-700 text-slate-400"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>{numero}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Asiento ${numero}${isSelected ? ", seleccionado" : ", disponible"}`}
      aria-pressed={isSelected}
      className={cn(
        "ss-seat-avail",
        "relative flex flex-col items-center justify-end pb-1",
        "w-[44px] h-[50px] rounded-t-xl rounded-b-md",
        "overflow-hidden cursor-pointer select-none",
        "transition-[border-color,box-shadow] duration-150 ease-out",
        "outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1",
        !isSelected && [
          "bg-white border-[1.5px] border-slate-200",
          "shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
        ],
        isSelected && [
          "border-2 border-orange-700",
          "shadow-[0_6px_18px_-2px_rgba(249,115,22,0.5)]",
          "ss-pop",
        ]
      )}
      style={isSelected ? {
        background: "linear-gradient(to bottom, #fb923c, #ea580c)"
      } : undefined}
    >
      <div className={cn(
        "absolute top-0 left-0 right-0 h-3",
        isSelected
          ? "bg-orange-700/60 border-b border-orange-800/30"
          : "bg-slate-100 border-b border-slate-200"
      )} />
      {!isSelected && (
        <div className="absolute top-3 left-1.5 right-1.5 bottom-5 rounded-sm bg-slate-50 border border-slate-100" />
      )}
      <span
        className={cn("relative z-10 text-[10px] font-700",
          isSelected ? "text-white drop-shadow-sm" : "text-slate-500")}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {numero}
      </span>
    </button>
  )
}