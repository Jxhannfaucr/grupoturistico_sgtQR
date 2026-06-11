// app/(admin)/usuarios/_components/usuario-stat-cards.tsx
import { Shield, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  hint: string
  accent: "primary" | "accent"
}

function StatCard({ icon, label, value, hint, accent }: StatCardProps) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    accent:  "bg-amber-500/10 text-amber-600",
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          colors[accent]
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}

interface UsuarioStatCardsProps {
  total: number
  admins: number
}

export function UsuarioStatCards({ total, admins }: UsuarioStatCardsProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Total usuarios"
        value={total}
        hint="Cuentas registradas"
        accent="primary"
      />
      <StatCard
        icon={<Shield className="h-5 w-5" />}
        label="Administradores"
        value={admins}
        hint="Con rol admin"
        accent="accent"
      />
    </div>
  )
}