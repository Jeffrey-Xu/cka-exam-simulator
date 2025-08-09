import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "CKA Simulator v2.0",
  description: "Professional Kubernetes Administrator certification practice with real AWS cluster access",
  keywords: "kubernetes, cka, certification, exam, simulator, practice, kubectl",
  authors: [{ name: "CKA Simulator Team" }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}