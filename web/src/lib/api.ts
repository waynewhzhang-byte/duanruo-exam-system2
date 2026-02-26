import { z } from 'zod'
import { ErrorResponse, PaginationResponse } from './schemas'

// Base API configuration
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

// Re-export common schemas from schemas.ts
export { ErrorResponse, PaginationResponse } from './schemas'

// Resolve auth token automatically from provided option, browser cookie, or server cookies()
async function resolveAuthToken(provided?: string): Promise<string | null> {
  if (provided) return provided
  // Browser: read from document.cookie
  if (typeof window !== 'undefined') {
    try {
      // 1) Prefer cookie (when present and small enough)
      const raw = document.cookie || ''
      const getCookie = (name: string) => {
        const part = raw.split('; ').find((row) => row.startsWith(`${name}=`))
        return part ? decodeURIComponent(part.split('=')[1]) : null
      }
      const readable = getCookie('auth-token-readable') || getCookie('auth-token')
      if (readable) return readable

      // 2) Fallback: localStorage/sessionStorage (avoids browser 4KB cookie limit for large JWTs)
      const ls = window.localStorage?.getItem('token')
      if (ls) return ls
      const ss = window.sessionStorage?.getItem('token')
      if (ss) return ss
    } catch { }
    return null
  }
  // Server: use next/headers cookies()
  try {
    const nh = await import('next/headers')
    const cookieStore = await nh.cookies()
    const c = cookieStore.get('auth-token')
    return c?.value ?? null
  } catch {
    return null
  }
}

// Resolve tenant ID automatically from provided option, URL path, or browser localStorage
async function resolveTenantId(provided?: string): Promise<string | null> {
  if (provided) return provided

  if (typeof window !== 'undefined') {
    try {
      // 1. Check localStorage (current session preference)
      const storedId = window.localStorage?.getItem('tenant_id')
      if (storedId) return storedId

      // 2. Fallback: Try to infer from URL path if we're in a [tenantSlug] route
      // Format: /tenant-slug/admin/...
      const pathname = window.location.pathname
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length > 0) {
        const slug = parts[0]
        // If the slug looks like a tenant slug (not a top-level route like 'admin' or 'login')
        const reservedTopLevels = ['admin', 'login', 'register', 'tenants', 'super-admin', 'profile', 'candidate', 'reviewer']
        if (!reservedTopLevels.includes(slug)) {
          // Note: In a real-world high-perf scenario, we might have a slug->id map in memory/cache
          // For now, we return null and let the backend TenantGuard handle the slug via X-Tenant-Slug if we added it,
          // or we rely on the specific API call having passed it.
        }
      }
    } catch { }
  }
  return null
}

// API client with error handling and type safety
export async function api<T>(
  endpoint: string,
  options?: RequestInit & {
    schema?: z.ZodType<T>
    token?: string
    tenantId?: string
  }
): Promise<T> {
  const { schema, token, tenantId, ...fetchOptions } = options || {}

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  }
  const method = (fetchOptions.method || 'GET').toUpperCase()
  // Only set Content-Type for requests with a body to avoid unnecessary preflight on GET
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  // Auto inject X-Tenant-ID header
  const resolvedTenantId = await resolveTenantId(tenantId)
  if (resolvedTenantId) {
    headers['X-Tenant-ID'] = resolvedTenantId
  }

  // Auto inject Authorization header
  const resolvedToken = await resolveAuthToken(token)
  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    })

    const text = await response.text()
    let data: any = null
    let isJson = false
    if (text) {
      try {
        data = JSON.parse(text)
        isJson = true
      } catch {
        // Not JSON; keep raw text
      }
    }

    if (!response.ok) {
      const errorResult = isJson ? ErrorResponse.safeParse(data) : { success: false } as any
      if (errorResult.success) {
        throw new APIError(
          errorResult.data.code,
          errorResult.data.message,
          response.status,
          errorResult.data.traceId
        )
      } else {
        throw new APIError(
          'HTTP_ERROR',
          (isJson ? (data?.message || '') : text) || `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }
    }

    if (schema) {
      // Handle NestJS ApiResult wrapper if present
      const targetData = (isJson && data && typeof data === 'object' && 'success' in data && 'data' in data)
        ? data.data
        : data;
      return schema.parse(isJson ? targetData : text)
    }

    // Handle NestJS ApiResult wrapper for non-schema requests
    if (isJson && data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data.data as T;
    }

    return (isJson ? data : (text as unknown as T))
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    throw new APIError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed',
      0
    )
  }
}

// Custom API Error class
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public traceId?: string
  ) {
    super(message)
    this.name = 'APIError'
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isForbidden() {
    return this.status === 403
  }

  get isNotFound() {
    return this.status === 404
  }

  get isValidationError() {
    return this.status === 400 || this.status === 422
  }
}

// Helper functions for common HTTP methods
export const apiGet = <T>(endpoint: string, options?: Omit<Parameters<typeof api>[1], 'method'>) =>
  api<T>(endpoint, { ...options, method: 'GET' })

export const apiPost = <T>(endpoint: string, data?: any, options?: Omit<Parameters<typeof api>[1], 'method' | 'body'>) =>
  api<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  })

export const apiPut = <T>(endpoint: string, data?: any, options?: Omit<Parameters<typeof api>[1], 'method' | 'body'>) =>
  api<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  })

export const apiDelete = <T>(endpoint: string, options?: Omit<Parameters<typeof api>[1], 'method'>) =>
  api<T>(endpoint, { ...options, method: 'DELETE' })

// Public API function (no authentication required)
export const apiGetPublic = <T>(endpoint: string, options?: Omit<Parameters<typeof api>[1], 'token'>) =>
  api<T>(endpoint, { ...options, method: 'GET' })

// Tenant-aware API functions (automatically inject X-Tenant-ID header)
export const apiGetWithTenant = <T>(endpoint: string, tenantId: string, options?: Omit<Parameters<typeof api>[1], 'method' | 'tenantId'>) =>
  api<T>(endpoint, { ...options, method: 'GET', tenantId })

export const apiPostWithTenant = <T>(endpoint: string, tenantId: string, data?: any, options?: Omit<Parameters<typeof api>[1], 'method' | 'body' | 'tenantId'>) =>
  api<T>(endpoint, {
    ...options,
    method: 'POST',
    tenantId,
    body: data ? JSON.stringify(data) : undefined
  })

export const apiPutWithTenant = <T>(endpoint: string, tenantId: string, data?: any, options?: Omit<Parameters<typeof api>[1], 'method' | 'body' | 'tenantId'>) =>
  api<T>(endpoint, {
    ...options,
    method: 'PUT',
    tenantId,
    body: data ? JSON.stringify(data) : undefined
  })

export const apiDeleteWithTenant = <T>(endpoint: string, tenantId: string, options?: Omit<Parameters<typeof api>[1], 'method' | 'tenantId'>) =>
  api<T>(endpoint, { ...options, method: 'DELETE', tenantId })

// Auth helper to get token from cookies (for server-side)
export function getAuthHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
