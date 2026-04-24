'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
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
export function TenantProvider({
  children,
  tenantSlug,
}: Readonly<TenantProviderProps>) {
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
        // NOTE:
        // Some backend environments may serialize date fields as non-string objects
        // (e.g. "{}"), which would fail strict zod parsing. We only need stable
        // tenant identity fields here, so normalize defensively.
        const raw = await apiGet<any>(`/tenants/slug/${tenantSlug}`)
        const data = Tenant.partial().passthrough().parse(raw)

        // Ensure slug is set (backend returns code, frontend uses slug for URLs)
        // and normalize date-like fields to strings to satisfy TenantType.
        const normalizedTenant: TenantType = {
          id: data.id as string,
          name: data.name as string,
          code: data.code,
          slug: data.slug || data.code || tenantSlug,
          schemaName: data.schemaName,
          description: data.description ?? null,
          status: (data.status as TenantType['status']) || 'ACTIVE',
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone ?? null,
          createdAt:
            typeof data.createdAt === 'string'
              ? data.createdAt
              : new Date().toISOString(),
          updatedAt:
            typeof data.updatedAt === 'string'
              ? data.updatedAt
              : new Date().toISOString(),
          activatedAt:
            typeof data.activatedAt === 'string' ? data.activatedAt : null,
          deactivatedAt:
            typeof data.deactivatedAt === 'string' ? data.deactivatedAt : null,
        }
        setTenant(normalizedTenant)
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

  const value: TenantContextType = useMemo(
    () => ({
      tenant,
      tenantSlug: tenantSlug || null,
      isLoading,
      error,
      setTenant,
    }),
    [tenant, tenantSlug, isLoading, error],
  )

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

