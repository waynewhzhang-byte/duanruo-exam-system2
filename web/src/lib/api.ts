import { z } from 'zod'
import { ErrorResponse, PaginationResponse } from './schemas'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

export { ErrorResponse, PaginationResponse } from './schemas'

interface ApiResult<T> {
  success: boolean
  data: T
  timestamp: string
  message?: string
  code?: string
}

interface BackendError {
  error?: { code?: string; message?: string | string[] }
  message?: string | string[]
}

async function resolveAuthToken(provided?: string): Promise<string | null> {
  if (provided) return provided
  if (typeof window !== 'undefined') {
    try {
      const raw = document.cookie || ''
      const getCookie = (name: string) => {
        const part = raw.split('; ').find((row) => row.startsWith(`${name}=`))
        return part ? decodeURIComponent(part.split('=')[1]) : null
      }
      const readable = getCookie('auth-token-readable') || getCookie('auth-token')
      if (readable) return readable
    } catch { /* ignore */ }
    return null
  }
  try {
    const nh = await import('next/headers')
    const cookieStore = await Promise.resolve(nh.cookies())
    const c = cookieStore.get('auth-token')
    return c?.value ?? null
  } catch {
    return null
  }
}

const RESERVED_TOP_LEVELS = [
  'admin', 'login', 'register', 'tenants', 'super-admin', 'profile',
  'candidate', 'reviewer', 'exams', 'exam', 'my-applications', 'api', '_next',
]

async function resolveTenantContext(providedId?: string): Promise<{
  tenantId: string | null
  tenantSlug: string | null
}> {
  if (providedId) {
    const slug = getTenantSlugFromPath()
    return { tenantId: providedId, tenantSlug: slug }
  }

  if (typeof window !== 'undefined') {
    try {
      const pathname = window.location.pathname
      if (pathname.startsWith('/super-admin')) {
        return { tenantId: null, tenantSlug: null }
      }
      const parts = pathname.split('/').filter(Boolean)
      const slug = parts[0]

      if (slug && !RESERVED_TOP_LEVELS.includes(slug)) {
        const raw = document.cookie || ''
        const getCookie = (name: string) => {
          const part = raw.split('; ').find((row) => row.startsWith(`${name}=`))
          return part ? decodeURIComponent(part.split('=')[1]) : null
        }
        const tenantRolesStr = getCookie('tenant-roles')
        if (tenantRolesStr) {
          const tenantRoles: Array<{ tenantId: string; tenantCode: string }> = JSON.parse(tenantRolesStr)
          const matched = tenantRoles.find((r) => r.tenantCode === slug)
          if (matched?.tenantId) {
            return { tenantId: matched.tenantId, tenantSlug: slug }
          }
        }
      }

      const userInfoStr = (() => {
        const raw = document.cookie || ''
        const part = raw.split('; ').find((row) => row.startsWith('user-info='))
        return part ? decodeURIComponent(part.split('=')[1]) : null
      })()
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        if (userInfo.tenantId) {
          return { tenantId: userInfo.tenantId, tenantSlug: slug && !RESERVED_TOP_LEVELS.includes(slug) ? slug : null }
        }
      }

      if (slug && !RESERVED_TOP_LEVELS.includes(slug)) {
        return { tenantId: null, tenantSlug: slug }
      }
    } catch { /* ignore */ }
  }
  return { tenantId: null, tenantSlug: null }
}

function getTenantSlugFromPath(): string | null {
  if (typeof window === 'undefined') return null
  const parts = window.location.pathname.split('/').filter(Boolean)
  const slug = parts[0]
  return slug && !RESERVED_TOP_LEVELS.includes(slug) ? slug : null
}

function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const obj = data as Record<string, unknown>
  const errorObj = typeof obj.error === 'object' && obj.error !== null ? obj.error as Record<string, unknown> : null
  const msg = errorObj?.message ?? obj.message
  if (Array.isArray(msg)) return msg.join('; ')
  if (typeof msg === 'string') return msg
  return ''
}

/** Unwrap `{ success, data }` from raw `fetch().json()` (same shape as `api()` uses). */
export function unwrapApiResult<T>(data: unknown): T | null {
  if (data && typeof data === 'object' && 'success' in (data as object) && 'data' in (data as object)) {
    return (data as ApiResult<T>).data
  }
  return null
}

async function parseResponse<T>(response: Response, text: string, schema?: z.ZodType<T>): Promise<T> {
  let data: unknown = null
  let isJson = false
  if (text) {
    try {
      data = JSON.parse(text)
      isJson = true
    } catch { /* not JSON */ }
  }

  if (!response.ok) {
    if (isJson) {
      const parsed = ErrorResponse.safeParse(data)
      if (parsed.success) {
        throw new APIError(parsed.data.code, parsed.data.message, response.status, parsed.data.traceId)
      }
      const msg = extractErrorMessage(data) || `HTTP ${response.status}: ${response.statusText}`
      const code = (data as BackendError)?.error?.code || 'HTTP_ERROR'
      throw new APIError(code, msg, response.status)
    }
    throw new APIError('HTTP_ERROR', text || `HTTP ${response.status}: ${response.statusText}`, response.status)
  }

  if (schema) {
    const targetData = isJson ? (unwrapApiResult<T>(data) ?? data) : text
    return schema.parse(targetData)
  }

  const unwrapped = isJson ? unwrapApiResult<T>(data) : null
  if (unwrapped !== null) return unwrapped

  return (isJson ? data : text) as T
}

export type RequestOptions = RequestInit & {
  schema?: z.ZodType<unknown>
  token?: string
  tenantId?: string
}

export async function api<T>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T> {
  const { schema, token, tenantId, ...fetchOptions } = options || {}

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> | undefined),
  }
  const method = (fetchOptions.method || 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  const { tenantId: resolvedTenantId, tenantSlug: resolvedSlug } = await resolveTenantContext(tenantId)
  if (resolvedTenantId) {
    headers['X-Tenant-ID'] = resolvedTenantId
  }
  if (resolvedSlug) {
    headers['X-Tenant-Slug'] = resolvedSlug
  }

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
    return parseResponse<T>(response, text, schema as z.ZodType<T> | undefined)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    throw new APIError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed',
      0,
    )
  }
}

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public traceId?: string,
  ) {
    super(message)
    this.name = 'APIError'
  }

  get isUnauthorized() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isNotFound() { return this.status === 404 }
  get isValidationError() { return this.status === 400 || this.status === 422 }
}

export const apiGet = <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
  api<T>(endpoint, { ...options, method: 'GET' })

export const apiPost = <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  api<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })

export const apiPut = <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  api<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })

export const apiPatch = <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  api<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })

export const apiDelete = <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
  api<T>(endpoint, { ...options, method: 'DELETE' })

export const apiGetPublic = <T>(endpoint: string, options?: Omit<RequestOptions, 'token'>) =>
  api<T>(endpoint, { ...options, method: 'GET' })

export function getAuthHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getTenantHeaders(tenantId: string, tenantSlug?: string): Record<string, string> {
  const h: Record<string, string> = { 'X-Tenant-ID': tenantId }
  if (tenantSlug) h['X-Tenant-Slug'] = tenantSlug
  return h
}

// Convenience wrappers that pass tenantId — the base api() already resolves
// tenant context from headers, so these simply forward the tenantId parameter.
export const apiGetWithTenant = <T>(endpoint: string, tenantId: string, options?: Omit<RequestOptions, 'method' | 'tenantId'>) =>
  api<T>(endpoint, { ...options, method: 'GET', tenantId })

export const apiPostWithTenant = <T>(endpoint: string, tenantId: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body' | 'tenantId'>) =>
  api<T>(endpoint, { ...options, method: 'POST', tenantId, body: data ? JSON.stringify(data) : undefined })

export const apiPutWithTenant = <T>(endpoint: string, tenantId: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body' | 'tenantId'>) =>
  api<T>(endpoint, { ...options, method: 'PUT', tenantId, body: data ? JSON.stringify(data) : undefined })

export const apiDeleteWithTenant = <T>(endpoint: string, tenantId: string, options?: Omit<RequestOptions, 'method' | 'tenantId'>) =>
  api<T>(endpoint, { ...options, method: 'DELETE', tenantId })

export async function apiGetBlob(
  endpoint: string,
  options?: Omit<RequestOptions, 'method'>,
): Promise<Blob> {
  const { schema: _schema, token, tenantId, ...fetchOptions } = options || {}
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> | undefined),
  }
  const { tenantId: resolvedTenantId, tenantSlug } = await resolveTenantContext(tenantId)
  if (resolvedTenantId) headers['X-Tenant-ID'] = resolvedTenantId
  if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug
  const resolvedToken = await resolveAuthToken(token)
  if (resolvedToken) headers.Authorization = `Bearer ${resolvedToken}`
  const response = await fetch(url, { ...fetchOptions, headers, credentials: 'include', method: 'GET' })
  if (!response.ok) {
    const text = await response.text()
    throw new APIError('HTTP_ERROR', text || response.statusText, response.status)
  }
  return response.blob()
}
