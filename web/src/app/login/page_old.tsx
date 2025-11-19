'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoginRequest, type LoginRequestType } from '@/types/auth'
import { apiPost } from '@/lib/api'

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

      // Store token in cookie via API route
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.token, user: response.user }),
      })

      // Redirect to tenant selection page
      // Users will choose which exam (tenant) they want to access
      router.push('/tenants')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">端</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {getRoleTitle()}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            端若数智考盟 - 智能招聘考试平台
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="label">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`input ${errors.username ? 'border-danger-300 focus-visible:ring-danger-500' : ''}`}
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleInputChange('username')}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-danger-600">{errors.username}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`input ${errors.password ? 'border-danger-300 focus-visible:ring-danger-500' : ''}`}
                placeholder="请输入密码"
                value={formData.password}
                onChange={handleInputChange('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              还没有账号？{' '}
              <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                立即注册
              </Link>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <Link href="/" className="font-medium text-primary-600 hover:text-primary-500">
                返回首页
              </Link>
            </p>
          </div>
        </form>
      </div>
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
