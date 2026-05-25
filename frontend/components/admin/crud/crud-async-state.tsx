"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import type { AsyncStatus } from "@/types/api"

type CrudAsyncStateProps = {
  status: AsyncStatus
  error?: string | null
  isEmpty?: boolean
  onRetry?: () => void
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  loadingRows?: number
  children: React.ReactNode
}

export function CrudAsyncState({
  status,
  error,
  isEmpty = false,
  onRetry,
  emptyIcon,
  emptyTitle = "Sin resultados",
  emptyDescription = "No hay registros que coincidan con los filtros actuales.",
  emptyAction,
  loadingRows = 5,
  children,
}: CrudAsyncStateProps) {
  if (status === "loading" || status === "idle") {
    return (
      <div className="space-y-3">
        {Array.from({ length: loadingRows }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error ?? "Ocurrió un error inesperado."}</span>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }

  if (isEmpty) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border bg-card/50">
        <EmptyHeader>
          {emptyIcon ? <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia> : null}
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
        {emptyAction ? <EmptyContent>{emptyAction}</EmptyContent> : null}
      </Empty>
    )
  }

  return <>{children}</>
}
