"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  className?: string
  overlay?: boolean
  size?: "sm" | "md" | "lg"
  children?: React.ReactNode
}

export function LoadingOverlay({ 
  isLoading, 
  message, 
  className,
  overlay = true,
  size = "md",
  children 
}: LoadingOverlayProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }
  
  if (!isLoading && !children) return null
  
  if (!isLoading) return <>{children}</>
  
  if (overlay) {
    return (
      <div className={cn("relative", className)}>
        {children}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
              {message && (
                <p className="text-sm text-gray-600 text-center">{message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {message && <span className="text-sm">{message}</span>}
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }
  
  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  )
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({ 
  isLoading = false, 
  loadingText = "处理中...",
  children,
  disabled,
  className,
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
        "bg-blue-600 text-white hover:bg-blue-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {isLoading ? loadingText : children}
    </button>
  )
}

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = "加载中..." }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
    />
  )
}

interface SkeletonCardProps {
  showAvatar?: boolean
  lines?: number
}

export function SkeletonCard({ showAvatar = false, lines = 3 }: SkeletonCardProps) {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-4">
        {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-full" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-3 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Global Loading Provider
interface GlobalLoadingContextType {
  isLoading: boolean
  message?: string
  setLoading: (loading: boolean, message?: string) => void
}

const GlobalLoadingContext = React.createContext<GlobalLoadingContextType | undefined>(undefined)

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | undefined>()
  
  const setLoading = React.useCallback((loading: boolean, loadingMessage?: string) => {
    setIsLoading(loading)
    setMessage(loadingMessage)
  }, [])
  
  return (
    <GlobalLoadingContext.Provider value={{ isLoading, message, setLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 min-w-[200px]">
            <LoadingSpinner size="lg" />
            <p className="text-gray-700 text-center">{message || "处理中..."}</p>
          </div>
        </div>
      )}
    </GlobalLoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  const context = React.useContext(GlobalLoadingContext)
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider')
  }
  return context
}

// 别名导出
export const LS = LoadingOverlay;