'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RegisterRequest } from '@/types/auth'
import { apiPost } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      // Validate form data
      const validatedData = RegisterRequest.parse(formData)

      // Call register API
      await apiPost('/auth/register', validatedData)

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?message=registration_success')
      }, 2000)

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
        setErrors({ general: error.message || '注册失败，请重试' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof RegisterRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev: RegisterRequest) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-success-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">✓</span>
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              注册成功！
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              您的账号已创建成功，正在跳转到登录页面...
            </p>
          </div>
        </div>
      </div>
    )
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
            候选人注册
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            创建您的考试报名账号
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
              <label htmlFor="fullName" className="label">
                姓名 *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className={`input ${errors.fullName ? 'border-danger-300 focus-visible:ring-danger-500' : ''}`}
                placeholder="请输入您的真实姓名"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-danger-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="label">
                用户名 *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`input ${errors.username ? 'border-danger-300 focus-visible:ring-danger-500' : ''}`}
                placeholder="3-50个字符，用于登录"
                value={formData.username}
                onChange={handleInputChange('username')}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-danger-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="label">
                邮箱 *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input ${errors.email ? 'border-danger-300 focus-visible:ring-danger-500' : ''}`}
                placeholder="用于接收考试通知"
                value={formData.email}
                onChange={handleInputChange('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                密码 *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`input ${errors.password ? 'border-danger-300 focus-visible:ring-danger-500' : ''}`}
                placeholder="至少8个字符"
                value={formData.password}
                onChange={handleInputChange('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                确认密码 *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`input ${errors.confirmPassword ? 'border-danger-300 focus-visible:ring-danger-500' : ''}`}
                placeholder="再次输入密码"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              已有账号？{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                立即登录
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
