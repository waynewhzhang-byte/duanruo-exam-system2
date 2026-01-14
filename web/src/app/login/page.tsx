'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoginRequest } from '@/types/auth'
import { apiPost, apiGet, API_BASE } from '@/lib/api'
import { LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Helper function to determine redirect path based on user roles
// Note: Candidates always go to global /candidate portal (can view all tenant exams)
// Admins and Reviewers go to tenant-specific portals
function getRedirectPath(tenantSlug: string | null, roles: string[]): string {
  // Priority: Admin > Reviewer > Candidate

  // Admins need tenant context
  if (roles.includes('TENANT_ADMIN') || roles.includes('ADMIN') || roles.includes('EXAM_ADMIN')) {
    return tenantSlug ? `/${tenantSlug}/admin` : '/admin'
  }

  // Reviewers need tenant context
  if (roles.includes('PRIMARY_REVIEWER') || roles.includes('SECONDARY_REVIEWER')) {
    return tenantSlug ? `/${tenantSlug}/reviewer` : '/reviewer'
  }

  // Candidates always go to global portal (SSO design: can access all tenant exams)
  if (roles.includes('CANDIDATE')) {
    return '/candidate'
  }

  // Default fallback
  return '/'
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role')
  const { login: authLogin } = useAuth()

  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      // Validate form data
      const validatedData = LoginRequest.parse(formData)

      // Normalize payload (trim to avoid accidental spaces)
      const payload = {
        username: validatedData.username.trim(),
        password: validatedData.password,
      }

      // Call login API
      const response = await apiPost<any>('/auth/login', payload)

      if (!response.token || !response.user) {
        throw new Error('登录响应格式错误：缺少 token 或 user 信息')
      }

      let finalToken = response.token
      let finalUser = response.user

      // Default flow: Store session and route based on roles
      await storeSession(finalToken, finalUser)

      // Route users based on their roles (prioritize SUPER_ADMIN)
      const userRoles = finalUser.roles || []

      // SUPER_ADMIN: Route to super admin portal immediately
      if (userRoles.includes('SUPER_ADMIN')) {
        router.push('/super-admin/tenants')
        return
      }

      // CANDIDATE: Route to global candidate portal (SSO design)
      // Candidates can access exams from all tenants, no need to select a specific tenant
      if (userRoles.includes('CANDIDATE')) {
        router.push('/candidate')
        return
      }

      // For Admins and Reviewers: Need to select a tenant
      try {
        console.log('[Login] Fetching tenants for user...')
        const tenants = await apiGet<any[]>('/tenants/me', { token: finalToken })
        console.log('[Login] Tenants response:', tenants)

        if (tenants && tenants.length > 0) {
          // If user has tenants, we need to select one
          const tenant = tenants[0]
          console.log('[Login] Selected tenant:', tenant)

          try {
            console.log('[Login] Calling select-tenant API...')
            const selectResponse = await fetch(`${API_BASE}/auth/select-tenant`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalToken}`
              },
              body: JSON.stringify({ tenantId: tenant.id })
            })

            console.log('[Login] select-tenant response status:', selectResponse.status)

            if (selectResponse.ok) {
              const data = await selectResponse.json()
              console.log('[Login] select-tenant data:', data)

              if (data.token && data.user) {
                finalToken = data.token
                finalUser = data.user

                // Update storage and context
                await storeSession(finalToken, finalUser)

                // Redirect based on user's roles in the selected tenant
                const tenantUserRoles = finalUser.roles || []
                const redirectPath = getRedirectPath(tenant.slug, tenantUserRoles)
                console.log('[Login] Redirecting to:', redirectPath, 'with roles:', tenantUserRoles)
                router.push(redirectPath)
                return
              } else {
                console.error('[Login] Missing token or user in select-tenant response')
              }
            } else {
              const errorText = await selectResponse.text()
              console.error('[Login] select-tenant failed:', selectResponse.status, errorText)
            }
          } catch (e) {
            console.error('[Login] Auto-select tenant error:', e)
          }
        } else {
          console.log('[Login] No tenants found for user')
        }
      } catch (e) {
        console.warn('[Login] Failed to fetch user tenants:', e)
      }

      // Default routing based on roles (for users without tenants)
      if (userRoles.includes('TENANT_ADMIN')) {
        // Tenant admin goes to admin portal (should have been handled above if tenant selected)
        router.push('/admin')
      } else if (userRoles.includes('PRIMARY_REVIEWER') || userRoles.includes('SECONDARY_REVIEWER')) {
        // Reviewers go to reviewer portal
        router.push('/reviewer')
      } else if (userRoles.includes('CANDIDATE')) {
        // Candidates go to candidate portal
        router.push('/candidate')
      } else if (userRoles.includes('ADMIN')) {
        // Generic admin
        router.push('/admin')
      } else {
        // Default fallback
        router.push('/')
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: error.message || '登录失败，请重试' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const storeSession = async (token: string, user: any) => {
    // Update AuthContext state first (this ensures React state is updated before navigation)
    await authLogin(token, user)

    // Store token in Web Storage as well to bypass browser 4KB cookie size limit
    try {
      window.localStorage.setItem('token', token)
      window.sessionStorage.setItem('token', token)
    } catch { }

    // Store user info in localStorage
    localStorage.setItem('user', JSON.stringify(user))
  }

  const handleInputChange = (field: keyof LoginRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev: LoginRequest) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getRoleTitle = () => {
    switch (role) {
      case 'candidate': return '候选人登录'
      case 'reviewer': return '审核员登录'
      case 'admin': return '管理员登录'
      default: return '用户登录'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">端</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">{getRoleTitle()}</CardTitle>
          <CardDescription>端若数智考盟 - 智能招聘考试平台</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  className={errors.username ? 'border-destructive' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isLoading ? '登录中...' : '登录'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                还没有账号？{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  立即注册
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                <Link href="/" className="font-medium text-primary hover:underline">
                  返回首页
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
