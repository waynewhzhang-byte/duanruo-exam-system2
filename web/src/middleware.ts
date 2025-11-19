import { NextRequest, NextResponse } from 'next/server'

// Define protected route patterns and their required roles
// Now supports tenant-based routes: /[tenantSlug]/candidate, etc.
const PROTECTED_ROUTE_PATTERNS = {
  candidate: ['CANDIDATE'],
  reviewer: ['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER'],
  admin: ['ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'],
} as const

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/tenants',
  '/test-api',
  '/api/session',
  '/_next',
  '/favicon.ico',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes and static assets
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Extract tenant slug from pathname (format: /[tenantSlug]/...)
  const tenantSlugMatch = pathname.match(/^\/([^\/]+)\//)
  const tenantSlug = tenantSlugMatch?.[1]

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value
  const userInfo = request.cookies.get('user-info')?.value

  // Check if user is authenticated
  if (!token || !userInfo) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const user = JSON.parse(userInfo)
    const userRoles = user.roles || []

    // Extract route type from pathname (candidate, reviewer, admin)
    let routeType: string | null = null
    for (const type of Object.keys(PROTECTED_ROUTE_PATTERNS)) {
      if (pathname.includes(`/${type}`)) {
        routeType = type
        break
      }
    }

    // Check role-based access for protected routes
    if (routeType && routeType in PROTECTED_ROUTE_PATTERNS) {
      const requiredRoles = PROTECTED_ROUTE_PATTERNS[routeType as keyof typeof PROTECTED_ROUTE_PATTERNS]
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))

      if (!hasRequiredRole) {
        // Redirect to appropriate dashboard based on user's actual roles
        const redirectSlug = tenantSlug || 'default'
        if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('TENANT_ADMIN')) {
          return NextResponse.redirect(new URL(`/${redirectSlug}/admin`, request.url))
        } else if (userRoles.includes('PRIMARY_REVIEWER') || userRoles.includes('SECONDARY_REVIEWER')) {
          return NextResponse.redirect(new URL(`/${redirectSlug}/reviewer`, request.url))
        } else if (userRoles.includes('CANDIDATE')) {
          return NextResponse.redirect(new URL(`/${redirectSlug}/candidate`, request.url))
        } else {
          // No valid role, redirect to login
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('error', 'insufficient_permissions')
          return NextResponse.redirect(loginUrl)
        }
      }
    }

    // Add user info and tenant info to request headers for server components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-roles', JSON.stringify(userRoles))
    requestHeaders.set('x-auth-token', token)

    if (tenantSlug) {
      requestHeaders.set('x-tenant-slug', tenantSlug)
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Middleware error parsing user info:', error)
    // Invalid user info, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'invalid_session')
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
