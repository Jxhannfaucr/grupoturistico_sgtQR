// app/(admin)/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Bus,
  LayoutDashboard,
  Map,
  Package,
  Ticket,
  Menu,
  X,
  LogOut,
  ChevronRight,
  User,
  PlusCircle,
  List,
  ScanLine,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Viajes",
    icon: Map,
    children: [
      {
        label: "Todos los Viajes",
        href: "/admin/viajes",
        icon: List,
      },
      {
        label: "Crear Viaje",
        href: "/admin/viajes/crear",
        icon: PlusCircle,
      },
    ],
  },
  {
    label: "Buses",
    href: "/admin/buses",
    icon: Bus,
  },
  {
    label: "Lotes",
    href: "/admin/tokens",
    icon: Package,
  },
  {
    label: "Tickets",
    href: "/admin/tickets",
    icon: Ticket,
  },
  {
    label: "Escanear QR",
    href: "/admin/escaner",
    icon: ScanLine,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    navigation.forEach((item) => {
      if (item.children?.some((child) => pathname.startsWith(child.href))) {
        setExpandedItems((prev) =>
          prev.includes(item.label) ? prev : [...prev, item.label]
        )
      }
    })
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_rol")
    router.push("/login")
  }

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="relative w-10 h-10">
              <Image
                src="/images/logo.jpeg"
                alt="SGT-QR"
                fill
                className="object-contain rounded-full shadow-lg"
              />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900">SGT-QR</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigation.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 active:scale-[0.98] ${
                      item.children.some((c) => isActive(c.href))
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        expandedItems.includes(item.label) ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {expandedItems.includes(item.label) && (
                    <div className="ml-9 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-gray-100 ${
                            isActive(child.href)
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <child.icon className="w-4 h-4" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 active:scale-[0.98] ${
                    isActive(item.href!)
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-100">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-sm h-10 border-red-300 text-red-600 hover:bg-red-50 active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="lg:pl-72">
        {/* Header móvil */}
        <header className="sticky top-0 z-30 lg:hidden bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/images/logo.jpeg"
                  alt="SGT-QR"
                  fill
                  className="object-contain rounded-full"
                />
              </div>
              <span className="font-bold text-gray-900">SGT-QR</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 text-red-500" />
            </Button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}