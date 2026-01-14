'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { useAuth } from '@/contexts/AuthContext'
import { apiGetWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { RouteGuard } from '@/components/auth/RouteGuard'
import Link from 'next/link'
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  History,
  AlertCircle,
  User
} from 'lucide-react'

interface ReviewStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

// 后端响应格式
interface ReviewStatisticsResponse {
  totalReviews: number
  pendingPrimary: number
  pendingSecondary: number
  approved: number
  rejected: number
  averageReviewTime: number
}

function ReviewerDashboardContent() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenantSlug as string
  const { tenant, isLoading: tenantLoading } = useTenant()
  const { user, isLoading: authLoading } = useAuth()

  // 获取审核统计数据
  const { data: stats, isLoading: statsLoading } = useQuery<ReviewStats>({
    queryKey: ['reviewer-stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded')
      try {
        // 调用后端 /reviews/statistics 端点
        const response = await apiGetWithTenant<ReviewStatisticsResponse>('/reviews/statistics', tenant.id)
        // 转换为前端格式
        return {
          pending: response.pendingPrimary + response.pendingSecondary,
          approved: response.approved,
          rejected: response.rejected,
          total: response.totalReviews
        }
      } catch {
        // 如果API不存在，返回默认值
        return { pending: 0, approved: 0, rejected: 0, total: 0 }
      }
    },
    enabled: !!tenant?.id,
  })

  if (tenantLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  // Debug: Log user info
  console.log('Reviewer page - user info:', {
    username: user?.username,
    email: user?.email,
    fullName: user?.fullName,
    roles: user?.roles
  });

  const isReviewer = user?.roles?.includes('PRIMARY_REVIEWER') || user?.roles?.includes('SECONDARY_REVIEWER')
  const reviewerType = user?.roles?.includes('PRIMARY_REVIEWER') ? '初审员' : '复审员'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tenant?.name || '审核工作台'}</h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {user?.fullName || user?.username} · {reviewerType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/${tenantSlug}/reviewer/queue`}>
                <Button>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  待审核队列
                </Button>
              </Link>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                退出登录
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">待审核</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.pending ?? '-'}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">已通过</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.approved ?? '-'}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">已拒绝</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.rejected ?? '-'}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总计审核</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.total ?? '-'}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                待审核队列
              </CardTitle>
              <CardDescription>查看并处理待审核的报名申请</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${tenantSlug}/reviewer/queue`}>
                <Button className="w-full">
                  进入审核队列
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                审核历史
              </CardTitle>
              <CardDescription>查看已审核的申请记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${tenantSlug}/reviewer/history`}>
                <Button variant="outline" className="w-full">
                  查看历史记录
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              审核须知
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                <p>请仔细核对考生提交的个人信息和证明材料</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                <p>审核通过后考生将进入下一阶段或完成报名</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                <p>如需拒绝，请提供明确的拒绝原因以便考生修改</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                <p>审核决定一经提交不可撤销，请谨慎操作</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ReviewerDashboard() {
  return (
    <RouteGuard roles={['PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'TENANT_ADMIN']}>
      <ReviewerDashboardContent />
    </RouteGuard>
  )
}
