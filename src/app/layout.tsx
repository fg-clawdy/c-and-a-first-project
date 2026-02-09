import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/auth/AuthProvider"

export const metadata: Metadata = {
  title: "Shared Notepad",
  description: "A shared notepad for registered users",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
