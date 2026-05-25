import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export type CrudStatItem = {
  label: string
  value: string | number
  hint?: string
  icon?: React.ReactNode
  accent?: "primary" | "secondary" | "accent" | "muted"
}

const accentClasses: Record<NonNullable<CrudStatItem["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/30 text-accent-foreground",
  muted: "bg-muted text-muted-foreground",
}

type CrudStatsGridProps = {
  items: CrudStatItem[]
  className?: string
}

export function CrudStatsGrid({ items, className }: CrudStatsGridProps) {
  return (
    <div className={cn("mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => (
        <Card
          key={item.label}
          className="overflow-hidden border-border/70 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <CardContent className="flex items-start gap-4 px-5">
            {item.icon ? (
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  accentClasses[item.accent ?? "primary"]
                )}
              >
                {item.icon}
              </div>
            ) : null}
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
              {item.hint ? (
                <p className="truncate text-xs text-muted-foreground">{item.hint}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
