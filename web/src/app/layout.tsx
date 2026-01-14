import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import NavigationWrapper from '@/components/layout/NavigationWrapper'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export const metadata: Metadata = {
  title: '端若数智考盟 - 智能招聘考试平台',
  description: '智能化招聘考试报名与管理平台',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '端若考盟'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <div className="min-h-screen bg-background">
                <NavigationWrapper />
                <main className="conditional-main">
                  {children}
                </main>
              </div>
              <Toaster position="top-right" richColors />
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
