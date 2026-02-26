'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoginRequest, TenantRoleInfo } from '@/types/auth'
import { apiPost, API_BASE } from '@/lib/api'
import { LogIn, AlertCircle, GraduationCap, Shield, Users, FileCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function getRedirectPath(tenantSlug: string | null, roles: string[]): string {
  if (roles.includes('TENANT_ADMIN') || roles.includes('ADMIN') || roles.includes('EXAM_ADMIN')) {
    return tenantSlug ? `/${tenantSlug}/admin` : '/admin'
  }
  if (roles.includes('PRIMARY_REVIEWER') || roles.includes('SECONDARY_REVIEWER')) {
    return tenantSlug ? `/${tenantSlug}/reviewer` : '/reviewer'
  }
  if (roles.includes('CANDIDATE')) {
    return '/candidate'
  }
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
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      const validatedData = LoginRequest.parse(formData)
      const payload = {
        username: validatedData.username.trim(),
        password: validatedData.password,
      }

      const response = await apiPost<any>('/auth/login', payload)

      if (!response.token || !response.user) {
        throw new Error('登录响应格式错误：缺少 token 或 user 信息')
      }

      let finalToken = response.token
      let finalUser = response.user
      const tenantRoles = response.tenantRoles || []

      await storeSession(finalToken, finalUser, tenantRoles)

      const userRoles = finalUser.roles || []

      if (userRoles.includes('SUPER_ADMIN')) {
        router.push('/super-admin/tenants')
        return
      }

      if (userRoles.includes('CANDIDATE')) {
        router.push('/candidate')
        return
      }

      if (tenantRoles.length > 0) {
        const firstTenantRole = tenantRoles[0]

        if (tenantRoles.length > 1) {
          localStorage.setItem('pendingTenantSelection', 'true')
        }

        try {
          const selectResponse = await fetch(`${API_BASE}/auth/select-tenant`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${finalToken}`
            },
            body: JSON.stringify({ tenantId: firstTenantRole.tenantId })
          })

          if (selectResponse.ok) {
            const data = await selectResponse.json()
            if (data.token && data.user) {
              finalToken = data.token
              finalUser = data.user
              const selectTenantRoles = data.tenantRoles || tenantRoles
              await storeSession(finalToken, finalUser, selectTenantRoles)
              const redirectPath = getRedirectPath(firstTenantRole.tenantCode, finalUser.roles || [])
              router.push(redirectPath)
              return
            }
          }
        } catch (e) {
          console.error('[Login] Auto-select tenant error:', e)
        }

        const redirectPath = getRedirectPath(firstTenantRole.tenantCode, userRoles)
        router.push(redirectPath)
        return
      }

      if (userRoles.includes('TENANT_ADMIN')) {
        router.push('/admin')
      } else if (userRoles.includes('PRIMARY_REVIEWER') || userRoles.includes('SECONDARY_REVIEWER')) {
        router.push('/reviewer')
      } else {
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

  const storeSession = async (token: string, user: any, tenantRoles: TenantRoleInfo[] = []) => {
    await authLogin(token, user, tenantRoles)
    try {
      window.localStorage.setItem('token', token)
      window.sessionStorage.setItem('token', token)
    } catch { }
    localStorage.setItem('user', JSON.stringify(user))
    if (tenantRoles.length > 0) {
      localStorage.setItem('tenantRoles', JSON.stringify(tenantRoles))
    }
  }

  const handleInputChange = (field: keyof LoginRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev: LoginRequest) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const roleConfig = {
    candidate: { 
      title: '考生入口', 
      description: '登录后可以报名考试、查看准考证和成绩',
      icon: GraduationCap,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500'
    },
    reviewer: { 
      title: '审核员入口', 
      description: '登录后可以处理报名审核任务',
      icon: FileCheck,
      gradient: 'from-amber-500 via-orange-500 to-red-500'
    },
    admin: { 
      title: '管理员入口', 
      description: '登录后可以管理考试和报名数据',
      icon: Shield,
      gradient: 'from-violet-500 via-purple-500 to-indigo-500'
    },
    default: { 
      title: '欢迎登录', 
      description: '智能招聘考试管理平台',
      icon: Users,
      gradient: 'from-slate-500 via-gray-500 to-zinc-500'
    }
  }

  const config = role ? (roleConfig[role as keyof typeof roleConfig] || roleConfig.default) : roleConfig.default
  const Icon = config.icon

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${config.gradient} p-12 flex-col justify-between relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">端若数智考盟</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            智能招聘<br />考试管理平台
          </h1>
          
          <p className="text-white/80 text-lg max-w-md leading-relaxed">
            打造极致的在线考试报名体验，连接考生与理想岗位
          </p>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">10K+</div>
              <div className="text-white/70 text-sm">考生</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">500+</div>
              <div className="text-white/70 text-sm">企业</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">50K+</div>
              <div className="text-white/70 text-sm">考试</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">端若数智考盟</span>
          </div>

          <div className="mb-8">
            <div className={`w-16 h-16 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">{config.title}</h2>
            <p className="text-center text-slate-500">{config.description}</p>
          </div>

          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {errors.general && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{errors.general}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-medium">用户名</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="请输入用户名"
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    className={`h-12 bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-200 ${errors.username ? 'border-red-400' : ''}`}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">密码</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="请输入密码"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      className={`h-12 bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-200 pr-12 ${errors.password ? 'border-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300" />
                    <span>记住登录</span>
                  </label>
                  <a href="#" className="text-slate-600 hover:text-slate-900">忘记密码？</a>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-12 bg-gradient-to-r ${config.gradient} border-0 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      登录中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      登录
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="text-center space-y-3">
                  <p className="text-slate-500 text-sm">
                    还没有账号？{' '}
                    <Link href="/register" className="font-medium text-slate-900 hover:underline">
                      立即注册
                    </Link>
                  </p>
                  
                  <div className="flex justify-center gap-4 text-sm">
                    <Link href="/login?role=candidate" className={`px-3 py-1.5 rounded-full transition-colors ${role === 'candidate' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                      考生入口
                    </Link>
                    <Link href="/login?role=reviewer" className={`px-3 py-1.5 rounded-full transition-colors ${role === 'reviewer' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                      审核员入口
                    </Link>
                    <Link href="/login?role=admin" className={`px-3 py-1.5 rounded-full transition-colors ${role === 'admin' ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                      管理员入口
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-slate-400 text-sm">
            © 2024 端若数智考盟 · 智能招聘考试平台
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>}>
      <LoginForm />
    </Suspense>
  )
}
