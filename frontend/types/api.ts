export type AsyncStatus = "idle" | "loading" | "success" | "error"

export type CrudListState<T> = {
  data: T[]
  status: AsyncStatus
  error: string | null
}
