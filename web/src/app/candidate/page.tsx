'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMyApplications, useOpenExams } from '@/lib/api-hooks'
import { useAuth } from '@/contexts/AuthContext'
import { apiGet, apiGetWithTenant } from '@/lib/api'
import {
  FileText,
  Upload,
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  CreditCard,
  Bell
} from 'lucide-react'

// 租户类型
interface Tenant {
  id: string
  name: string
  slug: string
  code?: string
}

// 报名响应类型
interface ApplicationResponse {
  id: string
  examId: string
  positionId: string
  status: string
  submittedAt?: string
  examTitle?: string
  positionTitle?: string
  feeRequired?: boolean
  feeAmount?: number
  tenantCode?: string
  tenantSlug?: string
}

interface ApplicationListResponse {
  content: ApplicationResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

export default function CandidateDashboard() {
  const router = useRouter()
  const { user } = useAuth()

  const quickActions = [
    {
      icon: FileText,
      title: '新建报名',
      description: '开始新的考试报名',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      href: '/candidate/exams'
    },
    {
      icon: Upload,
      title: '上传文件',
      description: '上传证明材料',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      href: '/candidate/files'
    },
    {
      icon: Ticket,
      title: '准考证',
      description: '查看和下载准考证',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      href: '/candidate/tickets'
    },
    {
      icon: TrendingUp,
      title: '进度查询',
      description: '查看审核进度',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      href: '/candidate/applications'
    }
  ]

  return (
    <div data-testid="candidate-dashboard" className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">欢迎回来，{user?.fullName || '考生'}</h1>
        <p className="text-muted-foreground mt-2">
          管理您的考试报名和进度
        </p>
      </div>

      {/* 待办任务提示 */}
      <PendingTasksAlert />

      {/* Quick Stats */}
      <CandidateQuickStats />

      {/* Open Exams List */}
      <OpenExamsList />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>选择您要执行的操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.title}
                  onClick={() => router.push(action.href)}
                  className="group p-4 text-left border rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <CandidateRecentApplications />
    </div>
  )
}


// 待办任务和消息提示组件
function PendingTasksAlert() {
  const router = useRouter()
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  // 获取用户关联的租户列表
  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => apiGet<Tenant[]>('/tenants/me'),
  })

  // 自动选择第一个租户
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

  // 获取当前租户下的报名
  const { data, isLoading } = useQuery<ApplicationListResponse>({
    queryKey: ['applications', 'my', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) throw new Error('No tenant selected')
      return apiGetWithTenant<ApplicationListResponse>(`/applications/my?size=100`, selectedTenantId)
    },
    enabled: !!selectedTenantId,
  })

  const list = data?.content || []
  const selectedTenant = tenants?.find(t => t.id === selectedTenantId)

  // 分类报名状态
  // 1. 需要付费的报名（审核通过 + 收费考试）
  const needPaymentApps = list.filter(app => {
    const isFeeRequired = app.feeRequired ?? (app.feeAmount ?? 0) > 0
    return app.status === 'APPROVED' && isFeeRequired
  })

  // 2. 免费考试已通过审核（等待生成准考证）
  const freeApprovedApps = list.filter(app => {
    const isFreeExam = app.feeRequired === false || (app.feeAmount ?? 0) === 0
    return app.status === 'APPROVED' && isFreeExam
  })

  // 3. 已付费待生成准考证
  const paidApps = list.filter(app => app.status === 'PAID')

  // 4. 已发证（可以查看准考证和座位）
  const ticketIssuedApps = list.filter(app => app.status === 'TICKET_ISSUED')

  // 5. 笔试完成（可以查看成绩）
  const writtenExamCompletedApps = list.filter(app => app.status === 'WRITTEN_EXAM_COMPLETED')

  // 6. 可面试（已确认面试资格）
  const interviewEligibleApps = list.filter(app => app.status === 'INTERVIEW_ELIGIBLE')

  // 7. 笔试不及格
  const writtenExamFailedApps = list.filter(app => app.status === 'WRITTEN_EXAM_FAILED')

  // 8. 审核中的报名
  const pendingPrimaryApps = list.filter(app => app.status === 'PENDING_PRIMARY_REVIEW')
  const pendingSecondaryApps = list.filter(app => app.status === 'PENDING_SECONDARY_REVIEW')
  const pendingReviewApps = [...pendingPrimaryApps, ...pendingSecondaryApps]

  // 9. 被拒绝的报名
  const rejectedApps = list.filter(app =>
    app.status === 'PRIMARY_REJECTED' ||
    app.status === 'SECONDARY_REJECTED' ||
    app.status === 'AUTO_REJECTED'
  )

  // 10. 草稿状态（需要继续填写）
  const draftApps = list.filter(app => app.status === 'DRAFT')

  // 如果没有关联的租户
  if (!tenantsLoading && (!tenants || tenants.length === 0)) {
    return null
  }

  // 如果还在加载
  if (tenantsLoading || isLoading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 如果没有任何状态的报名，只显示租户选择器
  const hasAnyStatus = needPaymentApps.length > 0 || freeApprovedApps.length > 0 ||
    paidApps.length > 0 || ticketIssuedApps.length > 0 || writtenExamCompletedApps.length > 0 ||
    interviewEligibleApps.length > 0 || writtenExamFailedApps.length > 0 ||
    pendingReviewApps.length > 0 || rejectedApps.length > 0 || draftApps.length > 0

  return (
    <div className="space-y-3">
      {/* 租户选择器和任务概览标题 */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">我的任务中心</h3>
                <p className="text-sm text-blue-600">
                  查看您在各租户下的报名状态和待办事项
                </p>
              </div>
            </div>
            {tenants && tenants.length > 1 && (
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger className="w-[180px] bg-white">
                  <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                  <SelectValue placeholder="选择租户" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedTenant && tenants && tenants.length === 1 && (
            <div className="mt-2 text-sm text-blue-600">
              当前租户：<span className="font-medium">{selectedTenant.name}</span>
            </div>
          )}
          {!hasAnyStatus && (
            <div className="mt-3 p-3 bg-white/50 rounded-lg text-center">
              <p className="text-gray-600">
                在 <span className="font-medium">{selectedTenant?.name}</span> 下暂无待办任务
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push('/candidate/exams')}
              >
                去报名考试
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🎫 准考证已生成 - 最重要的好消息 */}
      {ticketIssuedApps.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <Ticket className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                  🎉 准考证已生成
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                  您有 <span className="font-bold">{ticketIssuedApps.length}</span> 个考试的准考证和座位已安排完成，请及时查看并打印：
                </p>
                <div className="mt-3 space-y-2">
                  {ticketIssuedApps.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100 shadow-sm">
                      <div>
                        <div className="font-medium text-gray-900">
                          {app.examTitle || app.examId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.positionTitle || app.positionId}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600"
                        onClick={() => router.push(`/candidate/tickets/${app.id}`)}
                      >
                        查看准考证
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 📊 笔试完成 - 可以查看成绩 */}
      {writtenExamCompletedApps.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800">
                  📊 笔试已完成 ({writtenExamCompletedApps.length})
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  以下考试的笔试已完成，可以查看成绩：
                </p>
                <div className="mt-3 space-y-2">
                  {writtenExamCompletedApps.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
                      <div>
                        <div className="font-medium text-gray-900">
                          {app.examTitle || app.examId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.positionTitle || app.positionId}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => router.push(`/candidate/scores/${app.id}`)}
                      >
                        查看成绩
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ 可面试 - 已确认面试资格 */}
      {interviewEligibleApps.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">
                  ✅ 面试资格已确认 ({interviewEligibleApps.length})
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  恭喜！您已获得以下考试的面试资格：
                </p>
                <div className="mt-3 space-y-2">
                  {interviewEligibleApps.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-100">
                      <div>
                        <div className="font-medium text-gray-900">
                          {app.examTitle || app.examId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.positionTitle || app.positionId}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100"
                          onClick={() => router.push(`/candidate/scores/${app.id}`)}
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ❌ 笔试不及格 */}
      {writtenExamFailedApps.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  ❌ 笔试未通过 ({writtenExamFailedApps.length})
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  以下考试的笔试未达到面试资格线：
                </p>
                <div className="mt-3 space-y-2">
                  {writtenExamFailedApps.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                      <div>
                        <div className="font-medium text-gray-900">
                          {app.examTitle || app.examId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.positionTitle || app.positionId}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => router.push(`/candidate/scores/${app.id}`)}
                      >
                        查看成绩
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 💳 需要付费 */}
      {needPaymentApps.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  待缴费 ({needPaymentApps.length})
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  报名已通过审核，请尽快完成缴费：
                </p>
                <div className="mt-3 space-y-2">
                  {needPaymentApps.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-100">
                      <div>
                        <div className="font-medium text-gray-900">
                          {app.examTitle || app.examId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.positionTitle || app.positionId} ·
                          <span className="text-orange-600 font-medium"> ¥{(app.feeAmount ?? 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={() => router.push(`/${selectedTenant?.slug || selectedTenant?.code || app.tenantSlug || app.tenantCode}/candidate/applications/${app.id}/payment`)}
                      >
                        去缴费
                      </Button>
                    </div>
                  ))}
                  {needPaymentApps.length > 3 && (
                    <div className="text-sm text-orange-600 text-center">
                      还有 {needPaymentApps.length - 3} 个待缴费...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ❌ 被拒绝的报名 - 需要关注 */}
      {rejectedApps.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  报名未通过 ({rejectedApps.length})
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  以下报名审核未通过，请查看详情了解原因：
                </p>
                <div className="mt-3 space-y-2">
                  {rejectedApps.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                      <div>
                        <div className="font-medium text-gray-900">
                          {app.examTitle || app.examId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.positionTitle || app.positionId}
                          <Badge variant="destructive" className="ml-2 text-xs">
                            {app.status === 'AUTO_REJECTED' ? '自动审核不通过' :
                             app.status === 'PRIMARY_REJECTED' ? '初审不通过' :
                             app.status === 'SECONDARY_REJECTED' ? '复审不通过' : '已拒绝'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => router.push(`/candidate/applications/${app.id}`)}
                      >
                        查看原因
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ 免费考试已通过审核 */}
      {freeApprovedApps.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">
                  ✓ 审核通过 ({freeApprovedApps.length})
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  报名已通过审核，等待管理员生成准考证和安排座位。
                </p>
                <div className="mt-2 space-y-1">
                  {freeApprovedApps.slice(0, 2).map(app => (
                    <div key={app.id} className="text-sm text-green-800 bg-white/50 rounded px-2 py-1">
                      • {app.examTitle || app.examId} - {app.positionTitle || app.positionId}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 💰 已付费待生成准考证 */}
      {paidApps.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800">
                  已缴费，等待准考证 ({paidApps.length})
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  缴费成功，等待管理员生成准考证和安排座位。
                </p>
                <div className="mt-2 space-y-1">
                  {paidApps.slice(0, 2).map(app => (
                    <div key={app.id} className="text-sm text-blue-800 bg-white/50 rounded px-2 py-1">
                      • {app.examTitle || app.examId} - {app.positionTitle || app.positionId}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ⏳ 审核中 */}
      {pendingReviewApps.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">
                  审核中 ({pendingReviewApps.length})
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  报名正在审核中，请耐心等待：
                </p>
                <div className="mt-2 space-y-1">
                  {pendingReviewApps.slice(0, 3).map(app => (
                    <div key={app.id} className="text-sm text-yellow-800 bg-white/50 rounded px-2 py-1 flex items-center justify-between">
                      <span>• {app.examTitle || app.examId}</span>
                      <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">
                        {app.status === 'PENDING_PRIMARY_REVIEW' ? '待初审' : '待复审'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 📝 草稿 */}
      {draftApps.length > 0 && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">
                  未完成的报名 ({draftApps.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  您有未提交的报名草稿：
                </p>
                <div className="mt-3 space-y-2">
                  {draftApps.slice(0, 2).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <div>
                        <div className="font-medium text-gray-900">
                          {app.examTitle || app.examId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.positionTitle || app.positionId}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/candidate/applications/${app.id}/edit`)}
                      >
                        继续填写
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CandidateQuickStats() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  // 获取用户关联的租户列表
  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => apiGet<Tenant[]>('/tenants/me'),
  })

  // 自动选择第一个租户
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

  // 获取当前租户下的报名
  const { data, isLoading } = useQuery<ApplicationListResponse>({
    queryKey: ['applications', 'my-stats', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) throw new Error('No tenant selected')
      return apiGetWithTenant<ApplicationListResponse>(`/applications/my?size=100`, selectedTenantId)
    },
    enabled: !!selectedTenantId,
  })

  const list = data?.content || []
  const inProgress = list.filter(a => a.status === 'DRAFT' || a.status === 'SUBMITTED').length
  const approved = list.filter(a => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'TICKET_ISSUED').length
  const pending = list.filter(a => a.status === 'PENDING_PRIMARY_REVIEW' || a.status === 'PENDING_SECONDARY_REVIEW').length

  const stats = [
    {
      icon: Clock,
      title: '进行中的报名',
      value: inProgress,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: CheckCircle2,
      title: '已通过审核',
      value: approved,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: AlertCircle,
      title: '待审核',
      value: pending,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10'
    }
  ]

  if (tenantsLoading || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function CandidateRecentApplications() {
  const router = useRouter()
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  // 获取用户关联的租户列表
  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => apiGet<Tenant[]>('/tenants/me'),
  })

  // 自动选择第一个租户
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

  // 获取当前租户下的报名
  const { data, isLoading } = useQuery<ApplicationListResponse>({
    queryKey: ['applications', 'my-recent', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) throw new Error('No tenant selected')
      return apiGetWithTenant<ApplicationListResponse>(`/applications/my?size=5`, selectedTenantId)
    },
    enabled: !!selectedTenantId,
  })

  const list = data?.content || []

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: '草稿', variant: 'secondary' },
      SUBMITTED: { label: '已提交', variant: 'default' },
      PENDING_PRIMARY_REVIEW: { label: '待初审', variant: 'outline' },
      PENDING_SECONDARY_REVIEW: { label: '待复审', variant: 'outline' },
      APPROVED: { label: '已通过', variant: 'default' },
      REJECTED: { label: '已拒绝', variant: 'destructive' },
      PAID: { label: '已缴费', variant: 'default' },
      TICKET_ISSUED: { label: '已发证', variant: 'default' },
      WRITTEN_EXAM_COMPLETED: { label: '笔试完成', variant: 'default' },
      INTERVIEW_ELIGIBLE: { label: '可面试', variant: 'default' },
      WRITTEN_EXAM_FAILED: { label: '笔试不及格', variant: 'destructive' },
      AUTO_REJECTED: { label: '自动审核不通过', variant: 'destructive' },
      PRIMARY_REJECTED: { label: '初审不通过', variant: 'destructive' },
      SECONDARY_REJECTED: { label: '复审不通过', variant: 'destructive' }
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (tenantsLoading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近的报名</CardTitle>
          <CardDescription>查看您最近的报名记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (list.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近的报名</CardTitle>
          <CardDescription>查看您最近的报名记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无报名记录</h3>
            <p className="text-sm text-muted-foreground mb-4">开始您的第一次考试报名吧</p>
            <Button onClick={() => router.push('/candidate/exams')}>
              浏览考试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>最近的报名</CardTitle>
            <CardDescription>查看您最近的报名记录</CardDescription>
          </div>
          <Button variant="ghost" onClick={() => router.push('/candidate/applications')}>
            查看全部
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {list.map((application) => (
            <div
              key={application.id}
              onClick={() => router.push(`/candidate/applications/${application.id}`)}
              className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {application.examTitle || application.examId} - {application.positionTitle || application.positionId}
                </h3>
                <p className="text-sm text-muted-foreground">
                  提交时间：{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('zh-CN') : '-'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(application.status)}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function OpenExamsList() {
  const router = useRouter()
  const { data: exams, isLoading, error } = useOpenExams()

  // 按发布时间排序（最新的在前面）
  const sortedExams = exams?.slice().sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return dateB - dateA
  }) || []

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatFee = (feeRequired: boolean | null | undefined, feeAmount: number | null | undefined) => {
    if (!feeRequired) return '免费'
    if (feeAmount) return `¥${feeAmount.toFixed(2)}`
    return '待定'
  }

  const isRegistrationOpen = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start || !end) return false
    const now = new Date()
    return now >= new Date(start) && now <= new Date(end)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            正在招考的考试
          </CardTitle>
          <CardDescription>查看所有开放报名的考试</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            正在招考的考试
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">获取考试列表失败</h3>
            <p className="text-sm text-muted-foreground">请稍后重试</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sortedExams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            正在招考的考试
          </CardTitle>
          <CardDescription>查看所有开放报名的考试</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无开放报名的考试</h3>
            <p className="text-sm text-muted-foreground">请稍后再来查看</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              正在招考的考试
            </CardTitle>
            <CardDescription>查看所有开放报名的考试，共 {sortedExams.length} 个</CardDescription>
          </div>
          <Button variant="ghost" onClick={() => router.push('/candidate/exams')}>
            查看全部
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedExams.map((exam) => (
            <div
              key={exam.id}
              onClick={() => router.push(`/candidate/exams/${exam.examId}?tenantId=${exam.tenantId}`)}
              className="group p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {exam.title}
                    </h3>
                    {isRegistrationOpen(exam.registrationStart, exam.registrationEnd) && (
                      <Badge variant="default" className="bg-green-500">报名中</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{exam.tenantName || exam.tenantCode || '未知机构'}</span>
                    <span className="text-gray-300">|</span>
                    <span>考试编号: {exam.code}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {formatFee(exam.feeRequired, exam.feeAmount)}
                  </div>
                  {exam.positionCount && (
                    <div className="text-sm text-muted-foreground">
                      {exam.positionCount} 个岗位
                    </div>
                  )}
                </div>
              </div>

              {exam.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {exam.description}
                </p>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>报名时间: {formatDate(exam.registrationStart)} - {formatDate(exam.registrationEnd)}</span>
                </div>
                {exam.examStart && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>考试时间: {formatDate(exam.examStart)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
