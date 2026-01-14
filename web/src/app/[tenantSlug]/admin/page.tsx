'use client'

import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Users, 
  Calendar, 
  Settings,
  BarChart3,
  ClipboardList,
  UserCheck,
  Building2
} from 'lucide-react'

export default function TenantAdminDashboard() {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const { tenant, isLoading } = useTenant()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const adminModules = [
    {
      title: '考试管理',
      description: '创建和管理本租户的考试',
      icon: <FileText className="h-8 w-8" />,
      href: `/${tenantSlug}/admin/exams`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '用户管理',
      description: '管理本租户的用户',
      icon: <Users className="h-8 w-8" />,
      href: `/${tenantSlug}/admin/users`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: '审核员管理',
      description: '配置审核人员',
      icon: <UserCheck className="h-8 w-8" />,
      href: `/${tenantSlug}/admin/reviewers`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: '数据分析',
      description: '查看统计报表',
      icon: <BarChart3 className="h-8 w-8" />,
      href: `/${tenantSlug}/admin/analytics`,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-600 mt-2">
            当前租户：<span className="font-medium">{tenant?.name || tenantSlug}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/tenants')}>
          切换租户
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总考试数</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">报名中</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总报名人数</p>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待审核</p>
                <p className="text-2xl font-bold text-orange-600">0</p>
              </div>
              <UserCheck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Modules */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">管理功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => (
            <Card 
              key={module.href}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(module.href)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${module.bgColor}`}>
                    <div className={module.color}>
                      {module.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {module.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

