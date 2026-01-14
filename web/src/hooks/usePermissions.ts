/**
 * Hook for role-based access control
 */

import { useAuth } from '@/contexts/AuthContext'
import {
  Role,
  Permission,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPrimaryRole,
  getDefaultRouteForRole,
  canAccessRoute,
} from '@/lib/permissions'

export function usePermissions() {
  const { user, isAuthenticated } = useAuth()

  const userRoles = user?.roles || []
  const userPermissions = user?.permissions || []

  return {
    // User info
    isAuthenticated,
    user,
    userRoles,
    userPermissions,

    // Role checks
    hasRole: (role: Role) => hasRole(userRoles, role),
    hasAnyRole: (roles: Role[]) => hasAnyRole(userRoles, roles),
    hasAllRoles: (roles: Role[]) => hasAllRoles(userRoles, roles),

    // Permission checks
    hasPermission: (permission: Permission) => hasPermission(userPermissions, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userPermissions, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userPermissions, permissions),

    // Utility functions
    getPrimaryRole: () => getPrimaryRole(userRoles),
    getDefaultRoute: (tenantSlug?: string) => {
      const primaryRole = getPrimaryRole(userRoles)
      return primaryRole ? getDefaultRouteForRole(primaryRole, tenantSlug) : '/'
    },
    canAccessRoute: (routePattern: string) => canAccessRoute(userRoles, routePattern),

    // Convenience role checks
    isSuperAdmin: () => hasRole(userRoles, 'SUPER_ADMIN'),
    isTenantAdmin: () => hasRole(userRoles, 'TENANT_ADMIN'),
    isExamAdmin: () => hasRole(userRoles, 'EXAM_ADMIN'),
    isReviewer: () => hasAnyRole(userRoles, ['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER']),
    isPrimaryReviewer: () => hasRole(userRoles, 'PRIMARY_REVIEWER'),
    isSecondaryReviewer: () => hasRole(userRoles, 'SECONDARY_REVIEWER'),
    isCandidate: () => hasRole(userRoles, 'CANDIDATE'),
    isExaminer: () => hasRole(userRoles, 'EXAMINER'),

    // Check if user is any kind of admin
    isAdmin: () => hasAnyRole(userRoles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'EXAM_ADMIN']),
  }
}
