import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouteGuard } from '../RouteGuard'

const mockPush = vi.fn()
const mockUsePathname = vi.fn().mockReturnValue('/test-path')

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockUsePathname(),
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}))

vi.mock('@/components/ui/loading', () => ({
  Spinner: ({ size }: { size: string }) => <div data-testid="spinner" data-size={size}>Loading...</div>,
}))

import { usePermissions } from '@/hooks/usePermissions'

const mockUsePermissions = usePermissions as ReturnType<typeof vi.fn>

describe('RouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
  })

  describe('when user is loading', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: false,
        user: null,
        hasAnyRole: vi.fn().mockReturnValue(false),
        hasAllRoles: vi.fn().mockReturnValue(false),
        hasAnyPermission: vi.fn().mockReturnValue(false),
        hasAllPermissions: vi.fn().mockReturnValue(false),
      })
    })

    it('should show loading spinner when showLoading is true', () => {
      render(
        <RouteGuard showLoading={true}>
          <div>Protected content</div>
        </RouteGuard>
      )

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })

    it('should not show loading spinner when showLoading is false', () => {
      render(
        <RouteGuard showLoading={false}>
          <div>Protected content</div>
        </RouteGuard>
      )

      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    })
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: false,
        user: { id: '1' },
        hasAnyRole: vi.fn().mockReturnValue(false),
        hasAllRoles: vi.fn().mockReturnValue(false),
        hasAnyPermission: vi.fn().mockReturnValue(false),
        hasAllPermissions: vi.fn().mockReturnValue(false),
      })
    })

    it('should redirect to login page', () => {
      render(
        <RouteGuard>
          <div>Protected content</div>
        </RouteGuard>
      )

      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=%2Ftest-path')
    })

    it('should redirect to custom fallback path', () => {
      render(
        <RouteGuard fallbackPath="/custom-login">
          <div>Protected content</div>
        </RouteGuard>
      )

      expect(mockPush).toHaveBeenCalledWith('/custom-login?returnUrl=%2Ftest-path')
    })

    it('should not render children', () => {
      render(
        <RouteGuard>
          <div>Protected content</div>
        </RouteGuard>
      )

      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', roles: ['CANDIDATE'] },
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })
    })

    it('should render children when authenticated with no role restrictions', () => {
      render(
        <RouteGuard>
          <div>Protected content</div>
        </RouteGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })

    it('should not redirect', () => {
      render(
        <RouteGuard>
          <div>Protected content</div>
        </RouteGuard>
      )

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should render children when user has required role', () => {
      const hasAnyRole = vi.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', roles: ['SUPER_ADMIN'] },
        hasAnyRole,
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })

      render(
        <RouteGuard roles={['SUPER_ADMIN']}>
          <div>Admin content</div>
        </RouteGuard>
      )

      expect(screen.getByText('Admin content')).toBeInTheDocument()
    })
  })

  describe('when user lacks required role', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', roles: ['CANDIDATE'] },
        hasAnyRole: vi.fn().mockReturnValue(false),
        hasAllRoles: vi.fn().mockReturnValue(false),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })
    })

    it('should redirect to unauthorized page', () => {
      render(
        <RouteGuard roles={['SUPER_ADMIN']}>
          <div>Admin content</div>
        </RouteGuard>
      )

      expect(mockPush).toHaveBeenCalledWith('/unauthorized')
    })
  })

  describe('when user lacks required permission', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', roles: ['CANDIDATE'], permissions: ['exam:view'] },
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(false),
        hasAllPermissions: vi.fn().mockReturnValue(false),
      })
    })

    it('should redirect to unauthorized page when lacking permission', () => {
      render(
        <RouteGuard permissions={['exam:create']}>
          <div>Create exam</div>
        </RouteGuard>
      )

      expect(mockPush).toHaveBeenCalledWith('/unauthorized')
    })
  })

  describe('requireAllRoles', () => {
    it('should use hasAllRoles when requireAllRoles is true', () => {
      const hasAllRoles = vi.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', roles: ['TENANT_ADMIN', 'EXAM_ADMIN'] },
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles,
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })

      render(
        <RouteGuard roles={['TENANT_ADMIN', 'EXAM_ADMIN']} requireAllRoles>
          <div>Multi-role content</div>
        </RouteGuard>
      )

      expect(hasAllRoles).toHaveBeenCalledWith(['TENANT_ADMIN', 'EXAM_ADMIN'])
      expect(screen.getByText('Multi-role content')).toBeInTheDocument()
    })
  })

  describe('requireAllPermissions', () => {
    it('should use hasAllPermissions when requireAllPermissions is true', () => {
      const hasAllPermissions = vi.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', roles: ['TENANT_ADMIN'], permissions: ['exam:create', 'exam:edit'] },
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions,
      })

      render(
        <RouteGuard permissions={['exam:create', 'exam:edit']} requireAllPermissions>
          <div>Full permissions content</div>
        </RouteGuard>
      )

      expect(hasAllPermissions).toHaveBeenCalledWith(['exam:create', 'exam:edit'])
      expect(screen.getByText('Full permissions content')).toBeInTheDocument()
    })
  })
})
