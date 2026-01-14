/**
 * Role-based permissions and access control
 * Maps roles to their allowed routes and permissions
 */

// Define all system roles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  EXAM_ADMIN: 'EXAM_ADMIN',
  PRIMARY_REVIEWER: 'PRIMARY_REVIEWER',
  SECONDARY_REVIEWER: 'SECONDARY_REVIEWER',
  CANDIDATE: 'CANDIDATE',
  EXAMINER: 'EXAMINER',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

import { PermissionCodes } from './permissions-unified'

// Define all system permissions
export const PERMISSIONS = PermissionCodes

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * Check if a user has a specific role
 */
export function hasRole(userRoles: string[], role: Role): boolean {
  return userRoles.includes(role)
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRoles: string[], roles: Role[]): boolean {
  return roles.some(role => userRoles.includes(role))
}

/**
 * Check if a user has all of the specified roles
 */
export function hasAllRoles(userRoles: string[], roles: Role[]): boolean {
  return roles.every(role => userRoles.includes(role))
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.some(permission => userPermissions.includes(permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.every(permission => userPermissions.includes(permission))
}

/**
 * Get the primary role of a user (highest priority role)
 * Priority order: SUPER_ADMIN > TENANT_ADMIN > EXAM_ADMIN > REVIEWER > EXAMINER > CANDIDATE
 */
export function getPrimaryRole(userRoles: string[]): Role | null {
  const rolePriority: Role[] = [
    ROLES.SUPER_ADMIN,
    ROLES.TENANT_ADMIN,
    ROLES.EXAM_ADMIN,
    ROLES.SECONDARY_REVIEWER,
    ROLES.PRIMARY_REVIEWER,
    ROLES.EXAMINER,
    ROLES.CANDIDATE,
  ]

  for (const role of rolePriority) {
    if (userRoles.includes(role)) {
      return role
    }
  }

  return null
}

/**
 * Get the default route for a role
 */
export function getDefaultRouteForRole(role: Role, tenantSlug?: string): string {
  const slug = tenantSlug || 'default'

  switch (role) {
    case ROLES.SUPER_ADMIN:
      return '/super-admin/tenants'
    case ROLES.TENANT_ADMIN:
      return `/${slug}/admin`
    case ROLES.EXAM_ADMIN:
      return `/${slug}/admin/exams`
    case ROLES.PRIMARY_REVIEWER:
    case ROLES.SECONDARY_REVIEWER:
      return `/${slug}/reviewer/queue`
    case ROLES.EXAMINER:
      return `/${slug}/examiner/verify`
    case ROLES.CANDIDATE:
      return `/${slug}/exams`
    default:
      return '/'
  }
}

/**
 * Check if a role can access a specific route pattern
 */
export function canAccessRoute(userRoles: string[], routePattern: string): boolean {
  // Super admin can access everything
  if (hasRole(userRoles, ROLES.SUPER_ADMIN)) {
    return true
  }

  // Route patterns for each role
  const roleRoutes: Record<Role, RegExp[]> = {
    [ROLES.SUPER_ADMIN]: [/.*/], // Can access everything
    [ROLES.TENANT_ADMIN]: [
      /^\/[^/]+\/admin/,
      /^\/[^/]+\/exams/,
      /^\/[^/]+\/my-applications/,
    ],
    [ROLES.EXAM_ADMIN]: [
      /^\/[^/]+\/admin\/exams/,
      /^\/[^/]+\/exams/,
      /^\/[^/]+\/my-applications/,
    ],
    [ROLES.PRIMARY_REVIEWER]: [
      /^\/[^/]+\/reviewer/,
      /^\/[^/]+\/exams/,
      /^\/[^/]+\/my-applications/,
    ],
    [ROLES.SECONDARY_REVIEWER]: [
      /^\/[^/]+\/reviewer/,
      /^\/[^/]+\/exams/,
      /^\/[^/]+\/my-applications/,
    ],
    [ROLES.CANDIDATE]: [
      /^\/[^/]+\/exams/,
      /^\/[^/]+\/my-applications/,
      /^\/[^/]+\/candidate/,
    ],
    [ROLES.EXAMINER]: [
      /^\/[^/]+\/examiner/,
      /^\/[^/]+\/exams/,
    ],
  }

  // Check if any of the user's roles allow access to this route
  for (const role of userRoles as Role[]) {
    const patterns = roleRoutes[role]
    if (patterns && patterns.some(pattern => pattern.test(routePattern))) {
      return true
    }
  }

  return false
}
