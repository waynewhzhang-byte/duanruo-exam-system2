/**
 * Route guard component for role-based access control
 */

'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { Role, Permission } from '@/lib/permissions'
import { Spinner } from '@/components/ui/loading'

interface RouteGuardProps {
  children: React.ReactNode
  /** Required roles (user must have at least one) */
  roles?: Role[]
  /** Required permissions (user must have at least one) */
  permissions?: Permission[]
  /** Require all specified roles instead of any */
  requireAllRoles?: boolean
  /** Require all specified permissions instead of any */
  requireAllPermissions?: boolean
  /** Redirect path if access is denied (default: '/login') */
  fallbackPath?: string
  /** Show loading spinner while checking authentication */
  showLoading?: boolean
}

export function RouteGuard({
  children,
  roles,
  permissions,
  requireAllRoles = false,
  requireAllPermissions = false,
  fallbackPath = '/login',
  showLoading = true,
}: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    isAuthenticated,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
    user,
  } = usePermissions()

  useEffect(() => {
    // Wait for auth to initialize
    if (user === null && !isAuthenticated) {
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname)
      router.push(`${fallbackPath}?returnUrl=${returnUrl}`)
      return
    }

    // Check roles if specified
    if (roles && roles.length > 0) {
      const hasRequiredRoles = requireAllRoles
        ? hasAllRoles(roles)
        : hasAnyRole(roles)

      if (!hasRequiredRoles) {
        router.push('/unauthorized')
        return
      }
    }

    // Check permissions if specified
    if (permissions && permissions.length > 0) {
      const hasRequiredPermissions = requireAllPermissions
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions)

      if (!hasRequiredPermissions) {
        router.push('/unauthorized')
        return
      }
    }
  }, [
    isAuthenticated,
    user,
    roles,
    permissions,
    requireAllRoles,
    requireAllPermissions,
    pathname,
    fallbackPath,
    router,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
  ])

  // Show loading while checking authentication
  if (showLoading && !isAuthenticated && user === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  // Don't render children until authentication is verified
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

/**
 * Higher-order component version of RouteGuard
 */
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<RouteGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...guardProps}>
        <Component {...props} />
      </RouteGuard>
    )
  }
}
