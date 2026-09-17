"use client"

import { useMemo, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import Swal from "sweetalert2"

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

export type AdminSeatData = {
  numero: string
  estado_asiento: string
  pasajero: {
    nombre: string
    email?: string | null
    telefono?: string | null
    estado_ticket: string
    token?: string | null
  } | null
}

type AdminSeatMapProps = {
  totalAsientos: number
  tipoPlantilla: string
  asientosInfo: AdminSeatData[]
}

export function AdminSeatMap({ totalAsientos, tipoPlantilla, asientosInfo }: AdminSeatMapProps) {
  
  // Transformar la data del backend a un diccionario rápido para el renderizado
  const seatDictionary = useMemo(() => {
    const dict: Record<string, AdminSeatData> = {}
    asientosInfo.forEach(a => { dict[a.numero] = a })
    return dict
  }, [asientosInfo])

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

  const is3x2 = tipoPlantilla === "3x2_ancho"
  const ocupadosCount = asientosInfo.filter(a => a.pasajero !== null).length
  const disponiblesCount = totalAsientos - ocupadosCount

  const handleSeatClick = (numero: string) => {
    const info = seatDictionary[numero]
    
    if (!info || !info.pasajero) {
      Swal.fire({
        title: `Asiento #${numero}`,
        text: "Este asiento se encuentra disponible.",
        icon: "info",
        confirmButtonColor: "#171717"
      })
      return
    }

    const { pasajero } = info
    const estadoColor = pasajero.estado_ticket === "valido" ? "#10b981" : pasajero.estado_ticket === "escaneado" ? "#64748b" : "#ef4444"
    
    Swal.fire({
      title: `Asiento #${numero}`,
      html: `
        <div style="text-align: left; margin-top: 10px;">
          <p style="margin-bottom: 8px;"><strong>Pasajero:</strong> ${pasajero.nombre}</p>
          <p style="margin-bottom: 8px;"><strong>Estado:</strong> <span style="color: ${estadoColor}; font-weight: bold;">${pasajero.estado_ticket.toUpperCase()}</span></p>
          <p style="margin-bottom: 8px;"><strong>Email:</strong> ${pasajero.email || 'N/A'}</p>
          <p style="margin-bottom: 8px;"><strong>Teléfono:</strong> ${pasajero.telefono || 'N/A'}</p>
          <p style="margin-bottom: 0;"><strong>Token origen:</strong> <span style="font-family: monospace;">${pasajero.token || 'N/A'}</span></p>
        </div>
      `,
      icon: "success",
      confirmButtonColor: "#171717",
      confirmButtonText: "Cerrar"
    })
  }

  return (
    <>
      <style>{`
        .ss-root { font-family: 'Syne', system-ui, sans-serif; }
        .ss-bus-scaler { width: 100%; display: flex; justify-content: center; overflow: hidden; }
        .ss-bus-inner { transform-origin: top center; transform: scale(var(--bus-scale, 1)); }
      `}</style>

      <div className="ss-root pb-10" style={{ paddingTop: "20px" }}>
        {/* Leyenda Visual Adaptada para Admin */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-5 px-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-green-500 border-[1.5px] border-green-600 shadow-[0_1px_3px_rgba(34,197,94,0.3)]" />
            <span className="text-[11px] font-600 uppercase tracking-widest text-slate-500">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-red-500 border-[1.5px] border-red-600 flex items-center justify-center shadow-[0_1px_3px_rgba(239,68,68,0.3)]">
              <UserIcon size={12} className="text-white" />
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
             {/* Cabina del Conductor */}
            <div className="relative bg-gradient-to-b from-slate-50 to-white px-6 pt-5 pb-4 border-b-2 border-dashed border-slate-200">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-700 uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-3 py-0.5 rounded-full border border-slate-200">
                  Frente del Bus
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
                      "relative flex items-center z-10 w-full",
                      row.layout === "2+2" ? "justify-between" : "justify-center"
                    )}
                    style={{ gap: row.layout === "3+2" ? 50 : (row.layout === "full_5" ? 8 : undefined) }}
                  >
                    {row.layout === "full_5" ? (
                      <div className="flex gap-2 bg-white px-1 rounded-lg">
                        {row.seats.map((num) => (
                          <AdminSeatButton 
                            key={num} 
                            numero={num}
                            isOccupied={!!seatDictionary[num]?.pasajero}
                            onClick={() => handleSeatClick(num)} 
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          {row.seats.slice(0, row.layout === "3+2" ? 3 : 2).map((num) => (
                            <AdminSeatButton 
                              key={num} 
                              numero={num}
                              isOccupied={!!seatDictionary[num]?.pasajero}
                              onClick={() => handleSeatClick(num)} 
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {row.seats.slice(row.layout === "3+2" ? 3 : 2, 5).map((num) => (
                            <AdminSeatButton 
                              key={num} 
                              numero={num}
                              isOccupied={!!seatDictionary[num]?.pasajero}
                              onClick={() => handleSeatClick(num)} 
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </BusScaler>

        <div className="flex justify-center mt-4 gap-4">
          <div className="text-[12px] font-600 text-slate-500 uppercase tracking-wider">
            <span className="text-green-600">{disponiblesCount}</span> Libres
          </div>
          <div className="text-[12px] font-600 text-slate-500 uppercase tracking-wider">
            <span className="text-red-600">{ocupadosCount}</span> Ocupados
          </div>
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
    const apply = () => {
      if (!wrapperRef.current || !innerRef.current) return
      const available = wrapperRef.current.clientWidth
      const scale     = available >= NATURAL_W ? 1 : available / NATURAL_W
      innerRef.current.style.setProperty("--bus-scale", String(scale.toFixed(4)))
      wrapperRef.current.style.height = scale < 1 ? `${innerRef.current.scrollHeight * scale}px` : ""
    }
    apply()
    window.addEventListener("resize", apply)
    return () => window.removeEventListener("resize", apply)
  }, [is3x2, NATURAL_W])

  return (
    <div ref={wrapperRef} className="ss-bus-scaler px-4 mb-2">
      <div ref={innerRef} className="ss-bus-inner">
        {children}
      </div>
    </div>
  )
}

function AdminSeatButton({ numero, isOccupied, onClick }: { numero: string; isOccupied: boolean; onClick: () => void }) {
  if (isOccupied) {
    return (
      <button
        onClick={onClick}
        className="relative flex flex-col items-center justify-end pb-1 w-[44px] h-[50px] rounded-t-xl rounded-b-md bg-red-500 border-[1.5px] border-red-600 hover:bg-red-600 transition-colors cursor-pointer overflow-hidden shadow-[0_1px_4px_rgba(239,68,68,0.3)]"
      >
        <div className="absolute top-0 left-0 right-0 h-3 bg-red-600 border-b border-red-700" />
        <span className="relative z-10 text-[10px] font-700 text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{numero}</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-end pb-1 w-[44px] h-[50px] rounded-t-xl rounded-b-md bg-green-500 border-[1.5px] border-green-600 hover:bg-green-600 transition-colors cursor-pointer overflow-hidden shadow-[0_1px_4px_rgba(34,197,94,0.3)]"
    >
      <div className="absolute top-0 left-0 right-0 h-3 bg-green-600 border-b border-green-700" />
      <span className="relative z-10 text-[10px] font-700 text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{numero}</span>
    </button>
  )
}

function UserIcon({ size, className }: { size: number, className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}