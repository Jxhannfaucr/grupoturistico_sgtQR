// app/layout.tsx
import type { Metadata, Viewport } from "next"
import { Onest } from "next/font/google"
import "./globals.css"

const onest = Onest({ 
  subsets: ["latin"],
  variable: "--font-onest",
})

export const metadata: Metadata = {
  title: "SGT-QR | Sistema de Gestión de Tickets",
  description: "Sistema de gestión de tickets y abordaje para excursiones en bus",
  icons: {
    icon: "/images/logo.jpeg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${onest.variable} font-[family-name:var(--font-onest)] antialiased min-h-screen bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  )
}