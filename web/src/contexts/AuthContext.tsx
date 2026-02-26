'use client'

import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { TenantRoleInfo, UserResponse } from '@/types/auth'

interface AuthState {
  isAuthenticated: boolean
  user: UserResponse | null
  token: string | null
  tenantRoles: TenantRoleInfo[]
  isLoading: boolean
  error: Error | null
}

interface AuthContextType extends AuthState {
  login: (token: string, user: UserResponse, tenantRoles?: TenantRoleInfo[]) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface SessionResponse {
  isAuthenticated: boolean
  user?: UserResponse
  token?: string
  tenantRoles?: TenantRoleInfo[]
}

async function fetchSession(): Promise<SessionResponse> {
  const response = await fetch('/api/session', {
    credentials: 'include',
  })

  if (!response.ok) {
    return { isAuthenticated: false }
  }

  return response.json()
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()

  const sessionQuery: UseQueryResult<SessionResponse, Error> = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const authState: AuthState = useMemo(() => {
    const data = sessionQuery.data
    return {
      isAuthenticated: data?.isAuthenticated ?? false,
      user: data?.user ?? null,
      token: data?.token ?? null,
      tenantRoles: data?.tenantRoles ?? [],
      isLoading: sessionQuery.isLoading,
      error: sessionQuery.error ?? null,
    }
  }, [sessionQuery.data, sessionQuery.isLoading, sessionQuery.error])

  const login = useCallback(async (
    token: string, 
    user: UserResponse, 
    tenantRoles: TenantRoleInfo[] = []
  ) => {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user, tenantRoles }),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to store session')
    }

    queryClient.setQueryData(['session'], {
      isAuthenticated: true,
      user,
      token,
      tenantRoles,
    })
  }, [queryClient])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/session', {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch {
    }

    queryClient.setQueryData(['session'], {
      isAuthenticated: false,
      user: undefined,
      token: undefined,
      tenantRoles: undefined,
    })
    queryClient.clear()
  }, [queryClient])

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['session'] })
  }, [queryClient])

  const contextValue: AuthContextType = useMemo(() => ({
    ...authState,
    login,
    logout,
    refreshSession,
  }), [authState, login, logout, refreshSession])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
