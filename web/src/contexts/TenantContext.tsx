'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { TenantType, TenantContextType, Tenant } from '@/types/tenant'
import { apiGet } from '@/lib/api'

// Create context - exported for direct useContext usage in components that may be outside TenantProvider
export const TenantContext = createContext<TenantContextType | null>(null)

// Provider props
interface TenantProviderProps {
  children: React.ReactNode
  tenantSlug?: string
}

// Provider component
export function TenantProvider({ children, tenantSlug }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!tenantSlug) {
      setTenant(null)
      setIsLoading(false)
      setError(null)
      return
    }

    // Fetch tenant by slug
    const fetchTenant = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Call backend API to get tenant by slug
        const data = await apiGet<TenantType>(`/tenants/slug/${tenantSlug}`, {
          schema: Tenant
        })
        setTenant(data)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch tenant')
        setError(error)
        setTenant(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenant()
  }, [tenantSlug])

  const value: TenantContextType = {
    tenant,
    tenantSlug: tenantSlug || null,
    isLoading,
    error,
    setTenant,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

// Custom hook to use tenant context
export function useTenant() {
  const context = useContext(TenantContext)
  
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  
  return context
}

// Hook to check if tenant is loaded
export function useTenantLoaded() {
  const { tenant, isLoading, error } = useTenant()
  return { isLoaded: !isLoading && !error && !!tenant, tenant, isLoading, error }
}

