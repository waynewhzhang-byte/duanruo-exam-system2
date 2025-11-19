/**
 * Tenant-aware API utilities
 * 
 * This module provides helper functions for making API calls with automatic tenant ID injection.
 */

import { api, apiGet as baseApiGet, apiPost as baseApiPost, apiPut as baseApiPut, apiDelete as baseApiDelete } from './api'

// Helper type for API options with tenant ID
type TenantApiOptions = Parameters<typeof api>[1] & {
  tenantId?: string
}

/**
 * Make a GET request with automatic tenant ID injection
 */
export const apiGetWithTenant = <T>(
  endpoint: string,
  tenantId: string | undefined,
  options?: Omit<TenantApiOptions, 'method' | 'tenantId'>
) => {
  return baseApiGet<T>(endpoint, {
    ...options,
    tenantId,
  })
}

/**
 * Make a POST request with automatic tenant ID injection
 */
export const apiPostWithTenant = <T>(
  endpoint: string,
  tenantId: string | undefined,
  data?: any,
  options?: Omit<TenantApiOptions, 'method' | 'body' | 'tenantId'>
) => {
  return baseApiPost<T>(endpoint, data, {
    ...options,
    tenantId,
  })
}

/**
 * Make a PUT request with automatic tenant ID injection
 */
export const apiPutWithTenant = <T>(
  endpoint: string,
  tenantId: string | undefined,
  data?: any,
  options?: Omit<TenantApiOptions, 'method' | 'body' | 'tenantId'>
) => {
  return baseApiPut<T>(endpoint, data, {
    ...options,
    tenantId,
  })
}

/**
 * Make a DELETE request with automatic tenant ID injection
 */
export const apiDeleteWithTenant = <T>(
  endpoint: string,
  tenantId: string | undefined,
  options?: Omit<TenantApiOptions, 'method' | 'tenantId'>
) => {
  return baseApiDelete<T>(endpoint, {
    ...options,
    tenantId,
  })
}

