import { cn } from "@/lib/utils"

type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: number
  hint: string
  accent: "primary" | "secondary" | "accent" | "success"
}

export function StatCard({ icon, label, value, hint, accent }: StatCardProps) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-amber-500/10 text-amber-600",
    success: "bg-emerald-500/10 text-emerald-600",
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