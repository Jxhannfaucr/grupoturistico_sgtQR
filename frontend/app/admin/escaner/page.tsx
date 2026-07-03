"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"

const QrScanner = dynamic(
  () => import("./components/qr-scanner").then((mod) => mod.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card p-16 shadow-sm">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
        <span className="text-muted-foreground">Cargando escáner…</span>
      </div>
    ),
  }
)

export default function EscanerPage() {
  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Escanear QR"
        description="Valida los tickets de los pasajeros al abordar. Apunta la cámara al código QR del pase de abordaje."
      />
      <QrScanner />
    </AdminPageShell>
  )
}
