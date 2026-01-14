/**
 * Permission gate component for conditional rendering based on roles/permissions
 */

'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { Role, Permission } from '@/lib/permissions'

interface PermissionGateProps {
  children: React.ReactNode
  /** Required roles (user must have at least one) */
  roles?: Role[]
  /** Required permissions (user must have at least one) */
  permissions?: Permission[]
  /** Require all specified roles instead of any */
  requireAllRoles?: boolean
  /** Require all specified permissions instead of any */
  requireAllPermissions?: boolean
  /** Content to show when access is denied */
  fallback?: React.ReactNode
}

/**
 * Conditionally render children based on user's roles and permissions
 *
 * @example
 * <PermissionGate roles={['TENANT_ADMIN']}>
 *   <Button>Admin Only Button</Button>
 * </PermissionGate>
 *
 * @example
 * <PermissionGate permissions={['EXAM_CREATE', 'EXAM_UPDATE']} fallback={<p>No access</p>}>
 *   <ExamForm />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  roles,
  permissions,
  requireAllRoles = false,
  requireAllPermissions = false,
  fallback = null,
}: PermissionGateProps) {
  const {
    isAuthenticated,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
  } = usePermissions()

  // User must be authenticated
  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // Check roles if specified
  if (roles && roles.length > 0) {
    const hasRequiredRoles = requireAllRoles
      ? hasAllRoles(roles)
      : hasAnyRole(roles)

    if (!hasRequiredRoles) {
      return <>{fallback}</>
    }
  }

  // Check permissions if specified
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

    if (!hasRequiredPermissions) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

/**
 * Render children only for SUPER_ADMIN
 */
export function SuperAdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <PermissionGate roles={['SUPER_ADMIN']} fallback={fallback}>{children}</PermissionGate>
}

/**
 * Render children only for TENANT_ADMIN
 */
export function TenantAdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <PermissionGate roles={['TENANT_ADMIN']} fallback={fallback}>{children}</PermissionGate>
}

/**
 * Render children for any admin role (SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN)
 */
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <PermissionGate roles={['SUPER_ADMIN', 'TENANT_ADMIN', 'EXAM_ADMIN']} fallback={fallback}>{children}</PermissionGate>
}

/**
 * Render children only for reviewers
 */
export function ReviewerOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <PermissionGate roles={['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER']} fallback={fallback}>{children}</PermissionGate>
}

/**
 * Render children only for candidates
 */
export function CandidateOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <PermissionGate roles={['CANDIDATE']} fallback={fallback}>{children}</PermissionGate>
}
