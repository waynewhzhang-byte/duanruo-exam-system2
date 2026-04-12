'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiGet, APIError } from '@/lib/api'
import { selectTenant } from '@/lib/auth-api'
import { TenantListResponseType, TenantType } from '@/types/tenant'
import { useQuery } from '@tanstack/react-query'
import { Search, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
/** `GET /users/me/tenants` 返回项（与后端 UserTenantRoleResponse 对齐） */
interface UserTenantRoleRow {
  id: string
  userId: string
  tenantId: string
  role: string
  active: boolean
  tenant?: {
    id: string
    name: string
    code: string
    schemaName: string
    status: string
    contactEmail: string
    contactPhone?: string
    createdAt: string
  }
}

function toIso(d: string | Date): string {
  if (typeof d === 'string') return d
  return d.toISOString()
}

function mapMyTenantsToPage(rows: UserTenantRoleRow[]): TenantListResponseType {
  const byId = new Map<string, TenantType>()
  for (const row of rows) {
    const t = row.tenant
    if (!t) continue
    if (byId.has(t.id)) continue
    const created = toIso(t.createdAt)
    const status = t.status as TenantType['status']
    byId.set(t.id, {
      id: t.id,
      name: t.name,
      code: t.code,
      slug: t.code,
      schemaName: t.schemaName,
      description: null,
      status,
      contactEmail: t.contactEmail,
      contactPhone: t.contactPhone ?? null,
      createdAt: created,
      updatedAt: created,
    })
  }
  const content = [...byId.values()]
  return {
    content,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    size: content.length,
    number: 0,
  }
}

export default function TenantSelectionPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)

  // Get user roles from cookie
  useEffect(() => {
    try {
      const userInfoCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user-info='))

      if (userInfoCookie) {
        const userInfo = JSON.parse(decodeURIComponent(userInfoCookie.split('=')[1]))
        setUserRoles(userInfo.roles || [])
      }
    } catch (error) {
      console.error('Failed to parse user info:', error)
    }
  }, [])

  // Determine if user is a candidate
  const isCandidate = userRoles.includes('CANDIDATE') &&
    !userRoles.includes('TENANT_ADMIN') &&
    !userRoles.includes('SUPER_ADMIN')

  // For candidates, fetch public exams across all tenants
  // For other roles: 后端列表为 GET /users/me/tenants（无 GET /tenants）
  const { data: tenantsData, isLoading, error } = useQuery({
    queryKey: ['tenants', 'my-tenants', isCandidate],
    queryFn: async () => {
      if (isCandidate) {
        router.push('/exams/public')
        return { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 }
      }
      const rows = await apiGet<UserTenantRoleRow[]>('/users/me/tenants')
      return mapMyTenantsToPage(rows)
    },
  })

  const filteredTenants = tenantsData?.content?.filter(tenant =>
    searchQuery === '' ||
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleTenantSelect = async (tenant: TenantType) => {
    if (isSelecting) return

    setIsSelecting(true)

    try {
      // 1. 调用select-tenant API获取新Token
      const response = await selectTenant({ tenantId: tenant.id })

      // 2. 更新Token到localStorage
      if (response.token) {
        localStorage.setItem('token', response.token)

        // 也更新到cookie（如果需要）
        document.cookie = `auth-token=${response.token}; path=/; max-age=86400`

        toast.success('租户选择成功')
      }

      // 3. 跳转到相应页面（基于用户在该租户下的角色）
      // 注意：新Token中已经包含了租户特定的角色
      if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('TENANT_ADMIN')) {
        router.push(`/${tenant.slug}/admin`)
      } else if (userRoles.includes('PRIMARY_REVIEWER') || userRoles.includes('SECONDARY_REVIEWER')) {
        router.push(`/${tenant.slug}/reviewer`)
      } else {
        // Candidates and others
        router.push(`/${tenant.slug}/candidate`)
      }
    } catch (error: any) {
      console.error('Failed to select tenant:', error)
      toast.error(error.message || '选择租户失败，请重试')
      setIsSelecting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'INACTIVE':
        return <XCircle className="h-5 w-5 text-gray-400" />
      case 'SUSPENDED':
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '进行中'
      case 'INACTIVE':
        return '已结束'
      case 'SUSPENDED':
        return '已暂停'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const detail = error instanceof APIError ? error.message : '请稍后重试'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            无法加载租户列表：{detail}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">端</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            选择租户
          </h1>
          <p className="text-xl text-gray-600">
            请选择要进入的租户（管理端、审核或考生入口）
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="搜索租户名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tenant Grid */}
        {filteredTenants.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无可用的租户</h3>
            <p className="text-gray-600">当前账号未关联任何租户，请联系管理员</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-white rounded-lg shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => handleTenantSelect(tenant)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTenantSelect(tenant); } }}
                aria-label={`选择租户 ${tenant.name}`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tenant.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{tenant.slug}</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tenant.status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tenant.status)}`}>
                        {getStatusText(tenant.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {tenant.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {tenant.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>创建时间：{formatDate(tenant.createdAt)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${tenant.status === 'ACTIVE'
                      ? 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  disabled={tenant.status !== 'ACTIVE' || isSelecting}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTenantSelect(tenant)
                  }}
                >
                  {isSelecting ? '选择中...' : tenant.status === 'ACTIVE' ? '进入' : '不可用'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-600">
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              返回登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

