import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from '../usePermissions'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      })
    })

    it('should return isAuthenticated as false', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should return empty roles array', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.userRoles).toEqual([])
    })

    it('should return empty permissions array', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.userPermissions).toEqual([])
    })

    it('should return false for all role checks', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.isSuperAdmin()).toBe(false)
      expect(result.current.isTenantAdmin()).toBe(false)
      expect(result.current.isExamAdmin()).toBe(false)
      expect(result.current.isReviewer()).toBe(false)
      expect(result.current.isCandidate()).toBe(false)
      expect(result.current.isAdmin()).toBe(false)
    })
  })

  describe('when user is SUPER_ADMIN', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          roles: ['SUPER_ADMIN'],
          permissions: ['tenant:create', 'tenant:delete', 'user:create'],
        },
        isAuthenticated: true,
      })
    })

    it('should identify SUPER_ADMIN role', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.isSuperAdmin()).toBe(true)
    })

    it('should identify as admin', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.isAdmin()).toBe(true)
    })

    it('should return correct primary role', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.getPrimaryRole()).toBe('SUPER_ADMIN')
    })

    it('should return default route for SUPER_ADMIN', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.getDefaultRoute()).toBe('/super-admin/tenants')
    })

    it('should check hasRole correctly', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.hasRole('SUPER_ADMIN')).toBe(true)
      expect(result.current.hasRole('CANDIDATE')).toBe(false)
    })

    it('should check hasAnyRole correctly', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.hasAnyRole(['SUPER_ADMIN', 'CANDIDATE'])).toBe(true)
      expect(result.current.hasAnyRole(['CANDIDATE', 'EXAMINER'])).toBe(false)
    })

    it('should check hasPermission correctly', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.hasPermission('tenant:create')).toBe(true)
      expect(result.current.hasPermission('exam:create')).toBe(false)
    })

    it('should check hasAnyPermission correctly', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.hasAnyPermission(['tenant:create', 'exam:create'])).toBe(true)
    })

    it('should check hasAllPermissions correctly', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.hasAllPermissions(['tenant:create', 'user:create'])).toBe(true)
      expect(result.current.hasAllPermissions(['tenant:create', 'exam:create'])).toBe(false)
    })
  })

  describe('when user is CANDIDATE', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'candidate@test.com',
          roles: ['CANDIDATE'],
          permissions: ['exam:view', 'application:create'],
        },
        isAuthenticated: true,
      })
    })

    it('should identify CANDIDATE role', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.isCandidate()).toBe(true)
      expect(result.current.isSuperAdmin()).toBe(false)
      expect(result.current.isAdmin()).toBe(false)
    })

    it('should return default route for CANDIDATE', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.getDefaultRoute('test-tenant')).toBe('/test-tenant/exams')
    })
  })

  describe('when user is REVIEWER', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '3',
          email: 'reviewer@test.com',
          roles: ['PRIMARY_REVIEWER'],
          permissions: ['application:review'],
        },
        isAuthenticated: true,
      })
    })

    it('should identify reviewer role', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.isReviewer()).toBe(true)
      expect(result.current.isPrimaryReviewer()).toBe(true)
      expect(result.current.isSecondaryReviewer()).toBe(false)
    })

    it('should return default route for reviewer', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.getDefaultRoute('test-tenant')).toBe('/test-tenant/reviewer/queue')
    })
  })

  describe('when user has multiple roles', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '4',
          email: 'multi@test.com',
          roles: ['TENANT_ADMIN', 'PRIMARY_REVIEWER'],
          permissions: ['tenant:manage', 'application:review'],
        },
        isAuthenticated: true,
      })
    })

    it('should identify all roles', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.isTenantAdmin()).toBe(true)
      expect(result.current.isReviewer()).toBe(true)
      expect(result.current.isAdmin()).toBe(true)
    })

    it('should return highest priority role as primary', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.getPrimaryRole()).toBe('TENANT_ADMIN')
    })

    it('should check hasAllRoles correctly', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.hasAllRoles(['TENANT_ADMIN', 'PRIMARY_REVIEWER'])).toBe(true)
      expect(result.current.hasAllRoles(['TENANT_ADMIN', 'CANDIDATE'])).toBe(false)
    })
  })

  describe('canAccessRoute', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          roles: ['SUPER_ADMIN'],
          permissions: [],
        },
        isAuthenticated: true,
      })
    })

    it('should allow SUPER_ADMIN to access any route', () => {
      const { result } = renderHook(() => usePermissions())
      expect(result.current.canAccessRoute('/any/route')).toBe(true)
      expect(result.current.canAccessRoute('/admin/settings')).toBe(true)
    })
  })
})
