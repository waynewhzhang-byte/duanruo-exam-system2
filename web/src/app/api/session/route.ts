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
    const { token, user } = await request.json()

    if (!token || !user) {
      return NextResponse.json(
        { error: 'Token and user are required' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ success: true })

    // Set auth token cookie (httpOnly)
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)

    // Also set a readable token cookie for client-side to construct Authorization header
    response.cookies.set('auth-token-readable', token, {
      ...COOKIE_OPTIONS,
      httpOnly: false, // Allow client-side access for fetch headers
    })

    // Also set user info cookie (for client-side access to user data)
    response.cookies.set('user-info', JSON.stringify(user), {
      ...COOKIE_OPTIONS,
      httpOnly: false, // Allow client-side access
    })

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

    // Clear auth cookies
    response.cookies.delete(COOKIE_NAME)
    response.cookies.delete('auth-token-readable')
    response.cookies.delete('user-info')

    return response
  } catch (error) {
    console.error('Session DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    )
  }
}
