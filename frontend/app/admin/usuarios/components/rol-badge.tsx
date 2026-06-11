// app/(admin)/usuarios/_components/rol-badge.tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const ROL_STYLES: Record<string, string> = {
  admin:    "bg-violet-100 text-violet-700 border-violet-200",
  operador: "bg-sky-100    text-sky-700    border-sky-200",
  chofer:   "bg-emerald-100 text-emerald-700 border-emerald-200",
}

export function RolBadge({ nombre }: { nombre: string }) {
  const cls =
    ROL_STYLES[nombre.toLowerCase()] ??
    "bg-gray-100 text-gray-600 border-gray-200"

  return (
    <Badge variant="outline" className={cn("capitalize font-medium", cls)}>
      {nombre}
    </Badge>
  )
}