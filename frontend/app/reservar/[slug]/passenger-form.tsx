"use client"

import { PasajeroForm } from "./page"
import { ArrowLeft, ArrowRight, KeyRound, MapPin, Mail, User, Phone, Receipt, Ticket, ShieldCheck, Info } from "lucide-react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

type PassengerFormProps = {
  pasajeros: PasajeroForm[]
  precio: number
  viajeName: string
  isSubmitting: boolean
  tokenReserva: string
  onTokenChange: (val: string) => void
  onUpdate: (index: number, field: keyof PasajeroForm | "telefono_pasajero", value: string) => void
  onBack: () => void
  onSubmit: () => void
}

function formatPrecio(precio: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(precio)
}

export function PassengerForm({
  pasajeros,
  precio,
  viajeName,
  isSubmitting,
  tokenReserva,
  onTokenChange,
  onUpdate,
  onBack,
  onSubmit,
}: PassengerFormProps) {
  const totalPagar = precio * pasajeros.length

  return (
    <div className="pb-32 font-['Syne',sans-serif] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-5">
        
        {/* ── 1. TARJETA DE AUTORIZACIÓN (TOKEN) ── */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-orange-600" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
              <KeyRound size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-800 leading-tight">Autorización</h2>
              <p className="text-[13px] font-medium text-slate-500">Token requerido para procesar la reserva</p>
            </div>
          </div>
          <div className="relative">
            <ShieldCheck size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={tokenReserva}
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder="Ingrese su Token aquí..."
              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all uppercase tracking-wider"
            />
          </div>
        </div>

        {/* ── 2. DATOS DE LOS PASAJEROS ── */}
        <div className="space-y-4">
          {pasajeros.map((p, index) => {
            const isTitular = index === 0; // El primer pasajero es el titular de la compra

            return (
              <div key={p.numero_asiento} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[13px]",
                      isTitular ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      #{p.numero_asiento}
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800">
                      {isTitular ? "Titular de la Reserva" : `Pasajero ${index + 1}`}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nombre Completo */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nombre y Apellidos</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={p.nombre_pasajero}
                        onChange={(e) => onUpdate(index, "nombre_pasajero", e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Punto de Abordaje (Texto libre con UX Defensiva) */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Lugar de Abordaje</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={p.punto_abordaje_pasajero}
                        onChange={(e) => onUpdate(index, "punto_abordaje_pasajero", e.target.value)}
                        placeholder="Ej: Frente a la gasolinera JSM, Upala"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      />
                    </div>
                    <p className="flex items-center gap-1 mt-1.5 ml-1 text-[11px] font-medium text-slate-500">
                      <Info size={12} className="text-orange-500" />
                      Sé específico para que el conductor pueda ubicarte.
                    </p>
                  </div>

                  {/* Campos adicionales solo para el Titular (Email y Teléfono) */}
                  {isTitular && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Correo (Opcional)</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={p.email_pasajero}
                            onChange={(e) => onUpdate(index, "email_pasajero", e.target.value)}
                            placeholder="correo@ejemplo.com"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Teléfono</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            // Usamos as any temporalmente si no has agregado el campo al type en page.tsx
                            value={(p as any).telefono_pasajero || ""}
                            onChange={(e) => onUpdate(index, "telefono_pasajero" as any, e.target.value)}
                            placeholder="8888-8888"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── 3. RESUMEN DE COMPRA ── */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] mt-6">
          <div className="flex items-center gap-2 mb-5">
            <Receipt size={20} className="text-slate-800" />
            <h2 className="text-[18px] font-bold text-slate-800">Resumen de Compra</h2>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-start text-[14px]">
              <span className="font-medium text-slate-500">Ruta:</span>
              <span className="font-bold text-slate-800 text-right max-w-[200px]">{viajeName}</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="font-medium text-slate-500">Tiquetes Normales ({pasajeros.length}):</span>
              <span className="font-bold text-slate-800">{formatPrecio(precio)} c/u</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex justify-between items-center">
            <span className="text-[16px] font-bold text-slate-800">Total a pagar</span>
            <span className="text-[24px] font-black text-slate-900 tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatPrecio(totalPagar)}
            </span>
          </div>
        </div>

      </div>

      {/* ── 4. BOTTOM ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_40px_-8px_rgba(0,0,0,0.12)]">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-white text-[15px] font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-[0_4px_18px_-2px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Confirmar Reserva
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}