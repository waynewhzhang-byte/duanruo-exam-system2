import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import "./globals.css"
import QueryProvider from "@/components/providers/QueryProvider"
import { AuthProvider } from "@/contexts/AuthContext"

export const metadata: Metadata = {
  title: "端若数智考盟 - 在线招聘考试管理平台",
  description: "全流程多租户在线招聘考试管理系统",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-background font-sans">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors closeButton />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
