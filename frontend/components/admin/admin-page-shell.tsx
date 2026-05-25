import { cn } from "@/lib/utils"

type AdminPageShellProps = {
  children: React.ReactNode
  className?: string
}

export function AdminPageShell({ children, className }: AdminPageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8", className)}>
      {children}
    </div>
  )
}
