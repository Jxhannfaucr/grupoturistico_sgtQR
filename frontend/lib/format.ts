const dateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("es-CR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})

const currencyFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatViajeFecha(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return "—"
  return dateFormatter.format(date)
}

export function formatViajeHora(hora: string): string {
  const [hours, minutes] = hora.split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return hora
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return timeFormatter.format(date)
}

export function isViajeProximo(fechaSalida: string): boolean {
  const date = new Date(fechaSalida)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() >= Date.now()
}
