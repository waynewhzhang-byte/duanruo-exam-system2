import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'auth-token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}

// Store session (login)
export async function POST(request: NextRequest) {
  try {
    const { token, user, tenantRoles } = await request.json()

    if (!token || !user) {
      return NextResponse.json(
        { error: 'Token and user are required' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)

    response.cookies.set('auth-token-readable', token, {
      ...COOKIE_OPTIONS,
      httpOnly: false,
    })

    response.cookies.set('user-info', JSON.stringify(user), {
      ...COOKIE_OPTIONS,
      httpOnly: false,
    })

    if (tenantRoles && tenantRoles.length > 0) {
      response.cookies.set('tenant-roles', JSON.stringify(tenantRoles), {
        ...COOKIE_OPTIONS,
        httpOnly: false,
      })
    }

    return response
  } catch (error) {
    console.error('Session POST error:', error)
    return NextResponse.json(
      { error: 'Failed to store session' },
      { status: 500 }
    )
  }
}

// Get current session
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const userInfo = request.cookies.get('user-info')?.value
    const tenantRolesInfo = request.cookies.get('tenant-roles')?.value

    if (!token || !userInfo) {
      return NextResponse.json(
        { isAuthenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: JSON.parse(userInfo),
      token,
      tenantRoles: tenantRolesInfo ? JSON.parse(tenantRolesInfo) : [],
    })
  } catch (error) {
    console.error('Session GET error:', error)
    return NextResponse.json(
      { isAuthenticated: false },
      { status: 500 }
    )
  }
}

// Clear session (logout)
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true })

    response.cookies.delete(COOKIE_NAME)
    response.cookies.delete('auth-token-readable')
    response.cookies.delete('user-info')
    response.cookies.delete('tenant-roles')

    return response
  } catch (error) {
    console.error('Session DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    )
  }
}
