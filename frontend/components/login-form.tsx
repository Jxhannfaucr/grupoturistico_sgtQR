"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AlertCircle, Bus, CheckCircle2, Eye, EyeOff, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

type LoginStatus = "idle" | "success" | "error"

async function getLoginErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === "string") {
      return data.detail
    }
    if (Array.isArray(data.detail)) {
      return "Completa usuario y contraseña."
    }
  } catch {
    // respuesta no JSON
  }

  if (response.status === 422) {
    return "Completa usuario y contraseña."
  }
  if (response.status === 401) {
    return "Usuario o contraseña incorrectos."
  }
  if (response.status === 503) {
    return "No se puede conectar con el servidor. Intenta más tarde."
  }

  return "No se pudo iniciar sesión. Intenta de nuevo."
}

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<LoginStatus>("idle")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("idle")
    setMessage("")

    const trimmedUsername = username.trim()
    if (!trimmedUsername || !password) {
      setStatus("error")
      setMessage("Completa usuario y contraseña.")
      return
    }

    setIsLoading(true)

    try {
      const formData = new URLSearchParams()
      formData.append("username", trimmedUsername)
      formData.append("password", password)

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!response.ok) {
        const errorMessage = await getLoginErrorMessage(response)
        setStatus("error")
        setMessage(errorMessage)
        return
      }

      const data = await response.json()

      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("user_rol", data.rol)

      setStatus("success")
      setMessage("Acceso confirmado. Redirigiendo...")

      setTimeout(() => {
        router.push("/admin/dashboard")
      }, 800)
    } catch {
      setStatus("error")
      setMessage(
        "No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-28 h-28 md:w-32 md:h-32 mb-4">
          <Image
            src="/images/logo.jpeg"
            alt="Grupo Turístico Logo"
            fill
            className="object-contain rounded-full shadow-lg"
            priority
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">
          SGT-QR
        </h1>
        <p className="text-muted-foreground text-center mt-1 text-sm md:text-base">
          Sistema de Gestión de Tickets
        </p>
      </div>

      <div className="bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8">
        <div className="flex justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-secondary">
            <Bus className="w-5 h-5" />
            <span className="text-sm font-medium">Transporte</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <QrCode className="w-5 h-5" />
            <span className="text-sm font-medium">QR Scan</span>
          </div>
        </div>

        {status !== "idle" && message && (
          <Alert
            variant={status === "error" ? "destructive" : "default"}
            className={`mb-5 ${
              status === "success"
                ? "border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-300"
                : ""
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 className="text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle />
            )}
            <AlertTitle>
              {status === "success" ? "Acceso confirmado" : "Acceso denegado"}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-foreground font-medium text-base"
            >
              Usuario o Correo
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="usuario@ejemplo.com"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="h-14 text-base px-4 bg-input border-border focus:border-primary focus:ring-primary/20 focus:ring-2 transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-foreground font-medium text-base"
            >
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-14 text-base px-4 pr-12 bg-input border-border focus:border-primary focus:ring-primary/20 focus:ring-2 transition-all placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        © {new Date().getFullYear()} Grupo Turístico. Todos los derechos reservados.
      </p>
    </div>
  )
}
