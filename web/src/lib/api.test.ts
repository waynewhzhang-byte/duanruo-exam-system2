import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APIError, getAuthHeaders, getTenantHeaders } from './api'

describe('APIError', () => {
  it('should create an error with code, message, and status', () => {
    const error = new APIError('VALIDATION_ERROR', 'Invalid input', 400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('Invalid input')
    expect(error.status).toBe(400)
    expect(error.name).toBe('APIError')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(APIError)
  })

  it('should create an error with traceId', () => {
    const error = new APIError('NOT_FOUND', 'Resource not found', 404, 'trace-123')
    expect(error.traceId).toBe('trace-123')
  })

  it('should have traceId undefined when not provided', () => {
    const error = new APIError('ERROR', 'msg', 500)
    expect(error.traceId).toBeUndefined()
  })

  describe('convenience getters', () => {
    it('isUnauthorized should be true for 401', () => {
      const error = new APIError('UNAUTHORIZED', 'Unauthorized', 401)
      expect(error.isUnauthorized).toBe(true)
      expect(error.isForbidden).toBe(false)
      expect(error.isNotFound).toBe(false)
      expect(error.isValidationError).toBe(false)
    })

    it('isForbidden should be true for 403', () => {
      const error = new APIError('FORBIDDEN', 'Forbidden', 403)
      expect(error.isForbidden).toBe(true)
      expect(error.isUnauthorized).toBe(false)
    })

    it('isNotFound should be true for 404', () => {
      const error = new APIError('NOT_FOUND', 'Not found', 404)
      expect(error.isNotFound).toBe(true)
    })

    it('isValidationError should be true for 400', () => {
      const error = new APIError('VALIDATION_ERROR', 'Bad request', 400)
      expect(error.isValidationError).toBe(true)
    })

    it('isValidationError should be true for 422', () => {
      const error = new APIError('UNPROCESSABLE', 'Unprocessable', 422)
      expect(error.isValidationError).toBe(true)
    })

    it('all getters should be false for other status codes', () => {
      const error = new APIError('SERVER_ERROR', 'Internal error', 500)
      expect(error.isUnauthorized).toBe(false)
      expect(error.isForbidden).toBe(false)
      expect(error.isNotFound).toBe(false)
      expect(error.isValidationError).toBe(false)
    })
  })
})

describe('getAuthHeaders', () => {
  it('should return Authorization header when token provided', () => {
    const headers = getAuthHeaders('my-jwt-token')
    expect(headers).toEqual({ Authorization: 'Bearer my-jwt-token' })
  })

  it('should return empty object when no token provided', () => {
    const headers = getAuthHeaders(undefined)
    expect(headers).toEqual({})
  })

  it('should return empty object when empty string token', () => {
    const headers = getAuthHeaders('')
    expect(headers).toEqual({})
  })
})

describe('getTenantHeaders', () => {
  it('should return X-Tenant-ID header with tenantId', () => {
    const headers = getTenantHeaders('tenant-123')
    expect(headers).toEqual({ 'X-Tenant-ID': 'tenant-123' })
  })

  it('should include X-Tenant-Slug when provided', () => {
    const headers = getTenantHeaders('tenant-123', 'my-slug')
    expect(headers).toEqual({
      'X-Tenant-ID': 'tenant-123',
      'X-Tenant-Slug': 'my-slug',
    })
  })

  it('should not include X-Tenant-Slug when not provided', () => {
    const headers = getTenantHeaders('tenant-123')
    expect(headers).not.toHaveProperty('X-Tenant-Slug')
  })
})