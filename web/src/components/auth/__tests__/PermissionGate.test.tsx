import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  PermissionGate,
  SuperAdminOnly,
  TenantAdminOnly,
  AdminOnly,
  ReviewerOnly,
  CandidateOnly,
} from '../PermissionGate'

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}))

import { usePermissions } from '@/hooks/usePermissions'

const mockUsePermissions = usePermissions as ReturnType<typeof vi.fn>

describe('PermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: false,
        hasAnyRole: vi.fn().mockReturnValue(false),
        hasAllRoles: vi.fn().mockReturnValue(false),
        hasAnyPermission: vi.fn().mockReturnValue(false),
        hasAllPermissions: vi.fn().mockReturnValue(false),
      })
    })

    it('should render fallback when user is not authenticated', () => {
      render(
        <PermissionGate fallback={<div>Fallback content</div>}>
          <div>Protected content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Fallback content')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })

    it('should render nothing when no fallback provided', () => {
      const { container } = render(
        <PermissionGate>
          <div>Protected content</div>
        </PermissionGate>
      )

      expect(container.innerHTML).toBe('')
    })
  })

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })
    })

    it('should render children when authenticated with no restrictions', () => {
      render(
        <PermissionGate>
          <div>Protected content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })

    it('should render children when user has required role', () => {
      const hasAnyRole = vi.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        hasAnyRole,
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })

      render(
        <PermissionGate roles={['SUPER_ADMIN']}>
          <div>Admin content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Admin content')).toBeInTheDocument()
      expect(hasAnyRole).toHaveBeenCalledWith(['SUPER_ADMIN'])
    })

    it('should render fallback when user lacks required role', () => {
      const hasAnyRole = vi.fn().mockReturnValue(false)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        hasAnyRole,
        hasAllRoles: vi.fn().mockReturnValue(false),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })

      render(
        <PermissionGate roles={['SUPER_ADMIN']} fallback={<div>Access denied</div>}>
          <div>Admin content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    })

    it('should render children when user has required permission', () => {
      const hasAnyPermission = vi.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission,
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })

      render(
        <PermissionGate permission="exam:create">
          <div>Create exam button</div>
        </PermissionGate>
      )

      expect(screen.getByText('Create exam button')).toBeInTheDocument()
    })

    it('should render fallback when user lacks required permission', () => {
      const hasAnyPermission = vi.fn().mockReturnValue(false)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission,
        hasAllPermissions: vi.fn().mockReturnValue(false),
      })

      render(
        <PermissionGate permission="exam:create" fallback={<div>No permission</div>}>
          <div>Create exam button</div>
        </PermissionGate>
      )

      expect(screen.getByText('No permission')).toBeInTheDocument()
    })

    it('should use hasAllRoles when requireAllRoles is true', () => {
      const hasAllRoles = vi.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles,
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      })

      render(
        <PermissionGate roles={['TENANT_ADMIN', 'EXAM_ADMIN']} requireAllRoles>
          <div>Multi-role content</div>
        </PermissionGate>
      )

      expect(hasAllRoles).toHaveBeenCalledWith(['TENANT_ADMIN', 'EXAM_ADMIN'])
    })

    it('should use hasAllPermissions when requireAllPermissions is true', () => {
      const hasAllPermissions = vi.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true,
        hasAnyRole: vi.fn().mockReturnValue(true),
        hasAllRoles: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions,
      })

      render(
        <PermissionGate
          permissions={['exam:create', 'exam:edit']}
          requireAllPermissions
        >
          <div>Full permissions content</div>
        </PermissionGate>
      )

      expect(hasAllPermissions).toHaveBeenCalledWith(['exam:create', 'exam:edit'])
    })
  })
})

describe('SuperAdminOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children for SUPER_ADMIN', () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      hasAnyRole: vi.fn().mockReturnValue(true),
      hasAllRoles: vi.fn().mockReturnValue(true),
      hasAnyPermission: vi.fn().mockReturnValue(true),
      hasAllPermissions: vi.fn().mockReturnValue(true),
    })

    render(
      <SuperAdminOnly>
        <div>Super admin only</div>
      </SuperAdminOnly>
    )

    expect(screen.getByText('Super admin only')).toBeInTheDocument()
  })

  it('should render fallback for non-SUPER_ADMIN', () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      hasAnyRole: vi.fn().mockReturnValue(false),
      hasAllRoles: vi.fn().mockReturnValue(false),
      hasAnyPermission: vi.fn().mockReturnValue(true),
      hasAllPermissions: vi.fn().mockReturnValue(true),
    })

    render(
      <SuperAdminOnly fallback={<div>Not super admin</div>}>
        <div>Super admin only</div>
      </SuperAdminOnly>
    )

    expect(screen.getByText('Not super admin')).toBeInTheDocument()
  })
})

describe('TenantAdminOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children for TENANT_ADMIN', () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      hasAnyRole: vi.fn().mockReturnValue(true),
      hasAllRoles: vi.fn().mockReturnValue(true),
      hasAnyPermission: vi.fn().mockReturnValue(true),
      hasAllPermissions: vi.fn().mockReturnValue(true),
    })

    render(
      <TenantAdminOnly>
        <div>Tenant admin only</div>
      </TenantAdminOnly>
    )

    expect(screen.getByText('Tenant admin only')).toBeInTheDocument()
  })
})

describe('AdminOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children for any admin role', () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      hasAnyRole: vi.fn().mockReturnValue(true),
      hasAllRoles: vi.fn().mockReturnValue(true),
      hasAnyPermission: vi.fn().mockReturnValue(true),
      hasAllPermissions: vi.fn().mockReturnValue(true),
    })

    render(
      <AdminOnly>
        <div>Admin content</div>
      </AdminOnly>
    )

    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })
})

describe('ReviewerOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children for reviewer roles', () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      hasAnyRole: vi.fn().mockReturnValue(true),
      hasAllRoles: vi.fn().mockReturnValue(true),
      hasAnyPermission: vi.fn().mockReturnValue(true),
      hasAllPermissions: vi.fn().mockReturnValue(true),
    })

    render(
      <ReviewerOnly>
        <div>Reviewer content</div>
      </ReviewerOnly>
    )

    expect(screen.getByText('Reviewer content')).toBeInTheDocument()
  })
})

describe('CandidateOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children for CANDIDATE role', () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      hasAnyRole: vi.fn().mockReturnValue(true),
      hasAllRoles: vi.fn().mockReturnValue(true),
      hasAnyPermission: vi.fn().mockReturnValue(true),
      hasAllPermissions: vi.fn().mockReturnValue(true),
    })

    render(
      <CandidateOnly>
        <div>Candidate content</div>
      </CandidateOnly>
    )

    expect(screen.getByText('Candidate content')).toBeInTheDocument()
  })
})
