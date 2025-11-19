'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoginRequest, type LoginRequestType } from '@/types/auth'
import { apiPost } from '@/lib/api'
import { LogIn, AlertCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role')
  
  const [formData, setFormData] = useState<LoginRequestType>({
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

      // Store token in cookie via API route (ensure cookies are persisted)
      const sessionResponse = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.token, user: response.user }),
        credentials: 'include',
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json()
        throw new Error(`保存会话失败: ${errorData.error || sessionResponse.statusText}`)
      }

      // Store token in Web Storage as well to bypass browser 4KB cookie size limit
      try {
        window.localStorage.setItem('token', response.token)
        window.sessionStorage.setItem('token', response.token)
      } catch {}

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(response.user))

      // Route users based on their roles (align with BDD expectations)
      const userRoles = response.user?.roles || []

      if (userRoles.includes('SUPER_ADMIN')) {
        // Super admin goes to super-admin portal
        router.push('/super-admin/tenants')
      } else if (userRoles.includes('TENANT_ADMIN')) {
        // Tenant admin goes to admin portal
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

  const handleInputChange = (field: keyof LoginRequestType) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
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
