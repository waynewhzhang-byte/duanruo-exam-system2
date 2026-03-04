'use client'

import { ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { APIError } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'

interface QueryProviderProps {
  children: ReactNode
}

function handleGlobalError(error: unknown) {
  if (!(error instanceof APIError)) return

  if (error.isUnauthorized) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/login?redirect=${redirect}`
    }
    return
  }

  if (error.isForbidden) {
    toast({
      title: '权限不足',
      description: error.message || '您没有权限执行此操作',
      variant: 'destructive',
    })
    return
  }
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5 minutes
            staleTime: 1000 * 60 * 5,
            // 10 minutes
            gcTime: 1000 * 60 * 10,
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  )

  // Attach global error observer — using cache config directly (React Query v5 pattern)
  queryClient.getQueryCache().config.onError = handleGlobalError
  queryClient.getMutationCache().config.onError = handleGlobalError

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
