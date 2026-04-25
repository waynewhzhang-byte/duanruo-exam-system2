import { NextRequest, NextResponse } from 'next/server'

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

function isPublicRoute(pathname: string): boolean {
  // Exact match or prefix match against PUBLIC_ROUTES
  for (const route of PUBLIC_ROUTES) {
    if (route === '/') {
      if (pathname === '/') return true
      continue
    }
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return true
    }
  }

  // Tenant-scoped public routes: /[tenantSlug]/login, /[tenantSlug]/register
  const tenantScopedPublic = ['/login', '/register']
  for (const suffix of tenantScopedPublic) {
    // Match /{tenantSlug}/login, /{tenantSlug}/register, etc.
    const match = pathname.match(/^\/[^\/]+\/[^\/]+$/)
    if (match && (pathname.endsWith(suffix))) {
      return true
    }
  }

  return false
}

// Route prefixes that map to user role dashboards for redirect when
// a user lacks permissions. Used only for friendly redirects, NOT for
// authorization decisions. Authorization is enforced by backend guards.
const ROLE_DASHBOARD_MAP: Record<string, string> = {
  SUPER_ADMIN: 'admin',
  TENANT_ADMIN: 'admin',
  ADMIN: 'admin',
  PRIMARY_REVIEWER: 'reviewer',
  SECONDARY_REVIEWER: 'reviewer',
  CANDIDATE: 'candidate',
}

// Next.js rewrites do NOT forward custom headers to the backend. We must proxy
// /api/v1 in middleware and explicitly forward X-Tenant-ID, X-Tenant-Slug, etc.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || `http://127.0.0.1:${process.env.BACKEND_PORT || 8081}`

// Role-based route validation is now done server-side via PermissionsGuard
// and TenantGuard. The middleware only handles:
// 1. API proxying (with header forwarding for tenant isolation)
// 2. Authentication check (token presence)
// 3. Friendly role-based redirects (not security enforcement)
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proxy /api/v1 to backend with headers forwarded (critical for tenant isolation)
  if (pathname.startsWith('/api/v1/')) {
    const requestHeaders = new Headers()
    const toForward = ['x-tenant-id', 'x-tenant-slug', 'authorization', 'content-type']
    for (const h of toForward) {
      const v = request.headers.get(h)
      if (v) requestHeaders.set(h, v)
    }
    const url = new URL(pathname + request.nextUrl.search, BACKEND_ORIGIN)
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  }

  // Skip middleware for public routes and static assets
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Extract tenant slug from pathname (format: /[tenantSlug]/...)
  const tenantSlugMatch = pathname.match(/^\/([^\/]+)\//)
  const tenantSlug = tenantSlugMatch?.[1]

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value

  // Check if user is authenticated - only token presence, NOT role validation
  // Role validation is handled by backend PermissionsGuard and TenantGuard
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Decode JWT payload (without signature verification) for UI-level redirects only.
  // All authorization decisions are made server-side by PermissionsGuard + TenantGuard.
  // A forged token will be rejected by the backend with 401/403.
  let userId: string | null = null
  let userRoles: string[] = []

  try {
    const payloadPart = token.split('.')[1]
    if (payloadPart) {
      const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString())
      userId = decoded.sub ?? null
      userRoles = Array.isArray(decoded.roles) ? decoded.roles : []
    }
  } catch {
    // Token is malformed - redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'invalid_session')
    return NextResponse.redirect(loginUrl)
  }

  // Forward auth and tenant context to server components via headers.
  // These are informational only; all authorization happens in backend guards.
  const requestHeaders = new Headers(request.headers)
  if (userId) {
    requestHeaders.set('x-user-id', userId)
  }
  requestHeaders.set('x-auth-token', token)

  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug)

    // If tenant slug is present in URL, try to resolve tenant-id from JWT
    // so backend gets the header it expects
    const tenantId = (token.split('.')[1]) ? extractTenantIdFromPayload(token) : null
    if (tenantId) {
      requestHeaders.set('x-tenant-id', tenantId)
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

function extractTenantIdFromPayload(token: string): string | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString())
    return decoded.tenantId ?? null
  } catch {
    return null
  }
}

export const config = {
  matcher: [
    '/api/v1/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}