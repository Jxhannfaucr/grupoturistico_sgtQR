"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [rol, setRol] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const userRol = localStorage.getItem("user_rol")

    if (!token) {
      router.replace("/")
      return
    }

    setRol(userRol)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_rol")
    router.replace("/")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Panel de administración </h1>
        <p className="text-muted-foreground">
          Sesión iniciada correctamente
          {rol ? ` · Rol: ${rol}` : ""}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-primary hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  )
}
