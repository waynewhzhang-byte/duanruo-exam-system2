'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoginRequest } from '@/types/auth'
import { apiPost, apiGetPublic, apiPostWithTenant } from '@/lib/api'
import { LogIn, AlertCircle, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function TenantLoginForm() {
    const router = useRouter()
    const params = useParams()
    const tenantSlug = params.tenantSlug as string
    const { login } = useAuth()

    const [formData, setFormData] = useState<LoginRequest>({
        username: '',
        password: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [tenantName, setTenantName] = useState<string>('')
    const [tenantId, setTenantId] = useState<string | null>(null)
    const [pageLoading, setPageLoading] = useState(true)
    const [pageError, setPageError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTenantInfo = async () => {
            try {
                setPageLoading(true)
                const response = await fetch(`/api/v1/tenants/slug/${tenantSlug}`)
                if (response.ok) {
                    const data = await response.json()
                    if (data && data.id) {
                        setTenantId(data.id)
                        setTenantName(data.name)
                    } else {
                        setPageError('未找到该租户信息')
                    }
                } else {
                    setPageError('未找到该租户信息')
                }
            } catch (error) {
                console.error('Failed to fetch tenant info:', error)
                setPageError('无法加载租户信息，请检查链接是否正确')
            } finally {
                setPageLoading(false)
            }
        }

        if (tenantSlug) {
            fetchTenantInfo()
        }
    }, [tenantSlug])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setIsLoading(true)

        try {
            if (!tenantId) {
                throw new Error('无法获取租户ID，无法登录')
            }

            // Validate form data
            const validatedData = LoginRequest.parse(formData)

            // Normalize payload
            const payload = {
                username: validatedData.username.trim(),
                password: validatedData.password,
            }

            // Call login API with Tenant ID header
            // Note: The backend /auth/login endpoint might ignore the X-Tenant-ID header
            // so we need to explicitly call /auth/select-tenant afterwards to get tenant roles
            const loginResponse = await apiPostWithTenant<any>('/auth/login', tenantId, payload)

            if (!loginResponse.token || !loginResponse.user) {
                throw new Error('登录响应格式错误：缺少 token 或 user 信息')
            }

            let finalToken = loginResponse.token
            let finalUser = loginResponse.user

            // If we have a tenantId, try to select the tenant to get tenant-specific roles
            if (tenantId) {
                try {
                    const selectTenantResponse = await fetch('/api/proxy/auth/select-tenant', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${finalToken}`
                        },
                        body: JSON.stringify({ tenantId })
                    })

                    // If direct proxy call fails, try using the api helper but we need to handle the token manually
                    // Actually, let's use the apiPost helper but we need to pass the token in headers
                    // Since apiPost uses the token from localStorage/cookie which isn't set yet,
                    // we should use a direct fetch or a helper that accepts a token.

                    // Let's try to use the backend URL directly since we are on the client
                    const backendUrl = '/api/v1/auth/select-tenant'
                    const response = await fetch(backendUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${finalToken}`
                        },
                        body: JSON.stringify({ tenantId })
                    })

                    if (response.ok) {
                        const data = await response.json()
                        if (data.token && data.user) {
                            console.log('✅ Successfully selected tenant, upgraded token')
                            finalToken = data.token
                            finalUser = data.user
                        }
                    } else {
                        console.warn('⚠️ Failed to select tenant, proceeding with global token', await response.text())
                    }
                } catch (e) {
                    console.error('Error selecting tenant:', e)
                }
            }

            // Store token in Web Storage (required for api.ts helper)
            try {
                window.localStorage.setItem('token', finalToken)
                window.sessionStorage.setItem('token', finalToken)
            } catch { }

            // Store user info
            localStorage.setItem('user', JSON.stringify(finalUser))

            // Store tenant ID for API client
            if (tenantId) {
                localStorage.setItem('tenant_id', tenantId)
                localStorage.setItem('tenantId', tenantId) // For consistency with other possible naming
            }

            // Update Auth Context and Server Session
            // This ensures the UI (AppNavigation) updates immediately with the correct user role
            await login(finalToken, finalUser)

            // Route users based on their roles
            const userRoles = finalUser.roles || []
            if (userRoles.includes('TENANT_ADMIN')) {
                router.push(`/${tenantSlug}/admin`)
            } else if (userRoles.includes('PRIMARY_REVIEWER') || userRoles.includes('SECONDARY_REVIEWER')) {
                router.push(`/${tenantSlug}/reviewer`)
            } else {
                // Default fallback
                router.push(`/${tenantSlug}/admin`)
            }
        } catch (error: any) {
            console.error('Login error:', error)
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

    const handleInputChange = (field: keyof LoginRequest) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData((prev: LoginRequest) => ({ ...prev, [field]: e.target.value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    if (pageLoading) {
        return <div className="min-h-screen flex items-center justify-center">加载中...</div>
    }

    if (pageError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-destructive">错误</CardTitle>
                        <CardDescription>{pageError}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/" className="text-primary hover:underline">返回首页</Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">{tenantName}</CardTitle>
                    <CardDescription>企业/机构专属登录入口</CardDescription>
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

export default function TenantLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <TenantLoginForm />
        </Suspense>
    )
}
