import { cn } from "@/lib/utils"

type AdminPageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "relative mb-8 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm md:p-8",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
