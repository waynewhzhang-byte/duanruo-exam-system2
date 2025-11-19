'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserResponse } from '@/lib/schemas'
import { z } from 'zod'

interface AuthState {
  isAuthenticated: boolean
  user: z.infer<typeof UserResponse> | null
  token: string | null
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (token: string, user: z.infer<typeof UserResponse>) => void
  logout: () => void
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

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  })

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/session', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isAuthenticated && data.user && data.token) {
          setAuthState({
            isAuthenticated: true,
            user: data.user,
            token: data.token,
            isLoading: false,
          })
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
          })
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      })
    }
  }

  const login = async (token: string, user: z.infer<typeof UserResponse>) => {
    try {
      // Store session on server
      await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, user }),
        credentials: 'include',
      })

      setAuthState({
        isAuthenticated: true,
        user,
        token,
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to store session:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/session', {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Failed to clear session:', error)
    }

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    })
  }

  // Initialize auth state on mount
  useEffect(() => {
    refreshSession()
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
