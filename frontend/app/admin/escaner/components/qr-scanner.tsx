"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"
import {
  AlertTriangle,
  Ban,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  RotateCcw,
  ScanLine,
  Users,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import { cn } from "@/lib/utils"

type TicketInfo = {
  id: number
  nombre_pasajero: string
  email_pasajero?: string | null
  qr_hash: string
  estado: "valido" | "escaneado" | "cancelado"
  numero_asiento?: string | null
  viaje_nombre?: string | null
  viaje_id?: number | null
  token_codigo?: string | null
  escaneado_en?: string | null
  creado_en?: string | null
}

type Motivo = "success" | "already_used" | "cancelled" | "not_found"

type EscaneoResultado = {
  valido: boolean
  motivo: Motivo
  message: string
  ticket: TicketInfo | null
}

type HistorialItem = EscaneoResultado & { hora: string; key: string }

const SCANNER_ELEMENT_ID = "qr-reader-viewport"

const MOTIVO_STYLES: Record<
  Motivo,
  { border: string; bg: string; text: string; icon: typeof CheckCircle2; label: string; badge: "default" | "secondary" | "destructive" }
> = {
  success: {
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: CheckCircle2,
    label: "Válido",
    badge: "default",
  },
  already_used: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: AlertTriangle,
    label: "Ya escaneado",
    badge: "secondary",
  },
  cancelled: {
    border: "border-destructive/40",
    bg: "bg-destructive/5",
    text: "text-destructive",
    icon: Ban,
    label: "Cancelado",
    badge: "destructive",
  },
  not_found: {
    border: "border-destructive/40",
    bg: "bg-destructive/5",
    text: "text-destructive",
    icon: XCircle,
    label: "No encontrado",
    badge: "destructive",
  },
}

function formatHora(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export function QrScanner() {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const isProcessingRef = useRef(false)

  const [cameraStatus, setCameraStatus] = useState<"starting" | "running" | "error" | "stopped">("starting")
  const [cameraError, setCameraError] = useState("")
  const [resultado, setResultado] = useState<EscaneoResultado | null>(null)
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [manualHash, setManualHash] = useState("")
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    const qr = new Html5Qrcode(SCANNER_ELEMENT_ID)
    html5QrCodeRef.current = qr
    let cancelado = false

    qr.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
          const size = Math.floor(minEdge * 0.75)
          return { width: size, height: size }
        },
        aspectRatio: 1.0,
      },
      (decodedText) => {
        if (isProcessingRef.current) return
        isProcessingRef.current = true
        setProcesando(true)
        qr.pause(true)
        void procesarQr(decodedText)
      },
      () => {}
    )
      .then(() => {
        if (!cancelado) {
          setCameraStatus("running")
          return
        }
        qr.stop().then(() => qr.clear()).catch(() => {})
      })
      .catch((err) => {
        if (cancelado) return
        setCameraStatus("error")
        setCameraError(
          err?.message?.includes("NotAllowedError") || err?.name === "NotAllowedError"
            ? "Permiso de cámara denegado. Habilítalo en el navegador para escanear."
            : "No se pudo iniciar la cámara. Puedes usar el ingreso manual del código."
        )
      })

    return () => {
      cancelado = true
      const state = qr.getState()
      if (
        state === Html5QrcodeScannerState.SCANNING ||
        state === Html5QrcodeScannerState.PAUSED
      ) {
        qr.stop().then(() => qr.clear()).catch(() => {})
      }
    }
  }, [])

  async function procesarQr(qrHash: string) {
    setProcesando(true)
    try {
      const data = await apiClient<Omit<EscaneoResultado, "motivo"> & { motivo: Motivo }>(
        "/api/tickets/escanear",
        { method: "POST", body: { qr_hash: qrHash } }
      )
      setResultado(data)
      setHistorial((prev) => [
        { ...data, hora: new Date().toISOString(), key: `${qrHash}-${Date.now()}` },
        ...prev,
      ].slice(0, 20))
    } catch (err) {
      const motivo: Motivo = "not_found"
      const message = err instanceof ApiError ? err.message : "No se pudo validar el ticket."
      const fallback: EscaneoResultado = { valido: false, motivo, message, ticket: null }
      setResultado(fallback)
      setHistorial((prev) => [
        { ...fallback, hora: new Date().toISOString(), key: `${qrHash}-${Date.now()}` },
        ...prev,
      ].slice(0, 20))
    } finally {
      setProcesando(false)
    }
  }

  function handleContinuar() {
    setResultado(null)
    isProcessingRef.current = false
    if (cameraStatus === "running") {
      html5QrCodeRef.current?.resume()
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = manualHash.trim()
    if (!value || procesando) return
    isProcessingRef.current = true
    if (cameraStatus === "running") {
      html5QrCodeRef.current?.pause(true)
    }
    setManualHash("")
    void procesarQr(value)
  }

  const stats = useMemo(() => {
    const total = historial.length
    const validos = historial.filter((h) => h.motivo === "success").length
    const rechazados = total - validos
    return { total, validos, rechazados }
  }, [historial])

  const activeStyle = resultado ? MOTIVO_STYLES[resultado.motivo] : null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {cameraStatus === "running" ? (
                <Camera className="h-4 w-4 text-emerald-600" />
              ) : (
                <CameraOff className="h-4 w-4 text-muted-foreground" />
              )}
              Cámara
            </div>
            {cameraStatus === "running" && (
              <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                En vivo
              </Badge>
            )}
          </div>

          <div className="relative aspect-square w-full overflow-hidden bg-black/90 sm:mx-auto sm:max-w-md">
            <div
              id={SCANNER_ELEMENT_ID}
              className="flex h-full w-full items-center justify-center"
            />

            {cameraStatus === "starting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Iniciando cámara…</span>
              </div>
            )}

            {cameraStatus === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-white">
                <CameraOff className="h-8 w-8 text-red-400" />
                <p className="text-sm">{cameraError}</p>
              </div>
            )}

            {resultado && activeStyle && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">
                <ResultCard resultado={resultado} onContinuar={handleContinuar} />
              </div>
            )}

            {procesando && !resultado && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleManualSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground sm:shrink-0">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Ingreso manual
          </div>
          <Input
            type="text"
            value={manualHash}
            onChange={(e) => setManualHash(e.target.value)}
            placeholder="Código del ticket (qr_hash)"
            className="h-9 flex-1 font-mono"
            disabled={procesando}
          />
          <Button type="submit" size="sm" disabled={procesando || !manualHash.trim()}>
            Validar
          </Button>
        </form>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-3 gap-3">
          <StatMini label="Escaneados" value={stats.total} accent="primary" />
          <StatMini label="Válidos" value={stats.validos} accent="success" />
          <StatMini label="Rechazados" value={stats.rechazados} accent="destructive" />
        </div>

        <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Historial de esta sesión
          </div>

          {historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
              <ScanLine className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Los tickets escaneados aparecerán aquí.
              </p>
            </div>
          ) : (
            <ul className="max-h-[520px] divide-y divide-border/60 overflow-y-auto">
              {historial.map((item) => {
                const style = MOTIVO_STYLES[item.motivo]
                const Icon = style.icon
                return (
                  <li key={item.key} className="flex items-center gap-3 px-4 py-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.bg)}>
                      <Icon className={cn("h-4 w-4", style.text)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.ticket?.nombre_pasajero ?? "Ticket no encontrado"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.ticket?.numero_asiento ? `Asiento #${item.ticket.numero_asiento} · ` : ""}
                        {formatHora(item.hora)}
                      </p>
                    </div>
                    <Badge variant={style.badge}>{style.label}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultCard({
  resultado,
  onContinuar,
}: {
  resultado: EscaneoResultado
  onContinuar: () => void
}) {
  const style = MOTIVO_STYLES[resultado.motivo]
  const Icon = style.icon
  const ticket = resultado.ticket

  return (
    <div className={cn("w-full max-w-sm rounded-2xl border-2 bg-white p-5 shadow-xl", style.border)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", style.bg)}>
          <Icon className={cn("h-6 w-6", style.text)} />
        </div>
        <div>
          <p className={cn("text-sm font-semibold uppercase tracking-wide", style.text)}>{style.label}</p>
          <p className="text-xs text-muted-foreground">{resultado.message}</p>
        </div>
      </div>

      {ticket && (
        <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{ticket.nombre_pasajero}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {ticket.numero_asiento && (
              <Badge variant="outline" className="font-mono">
                Asiento #{ticket.numero_asiento}
              </Badge>
            )}
            {ticket.viaje_nombre && <span>{ticket.viaje_nombre}</span>}
          </div>
        </div>
      )}

      <Button onClick={onContinuar} className="mt-4 w-full gap-2">
        <RotateCcw className="h-4 w-4" />
        Escanear siguiente
      </Button>
    </div>
  )
}

function StatMini({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: "primary" | "success" | "destructive"
}) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    destructive: "bg-destructive/10 text-destructive",
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm">
      <p className={cn("mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold", colors[accent])}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
