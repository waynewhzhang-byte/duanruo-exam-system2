'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Award, TrendingUp, Eye, AlertCircle } from 'lucide-react'
import { apiGet, apiGetWithTenant } from '@/lib/api'

interface Tenant {
  id: string
  name: string
  slug: string
  code?: string
}

interface ApplicationResponse {
  id: string
  examId: string
  positionId: string
  status: string
  submittedAt?: string
  examTitle?: string
  positionTitle?: string
  applicationNumber?: string
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

// 可以查看成绩的状态列表
const SCORE_ELIGIBLE_STATUSES = [
  'WRITTEN_EXAM_COMPLETED',
  'INTERVIEW_ELIGIBLE',
  'WRITTEN_EXAM_FAILED',
  'TICKET_ISSUED', // 已发证也可能有成绩
]

export default function ScoresPage() {
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

  // 获取当前租户下可以查看成绩的报名
  const { data, isLoading: applicationsLoading } = useQuery<ApplicationListResponse>({
    queryKey: ['applications', 'scores', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) throw new Error('No tenant selected')
      return apiGetWithTenant<ApplicationListResponse>(`/applications/my?size=100`, selectedTenantId)
    },
    enabled: !!selectedTenantId,
  })

  // 过滤出可以查看成绩的报名
  const scoreEligibleApplications = data?.content?.filter(
    app => SCORE_ELIGIBLE_STATUSES.includes(app.status)
  ) || []

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      WRITTEN_EXAM_COMPLETED: { label: '笔试完成', variant: 'default' },
      INTERVIEW_ELIGIBLE: { label: '可面试', variant: 'default' },
      WRITTEN_EXAM_FAILED: { label: '笔试不及格', variant: 'destructive' },
      TICKET_ISSUED: { label: '已发证', variant: 'default' },
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleViewScores = (applicationId: string) => {
    router.push(`/candidate/scores/${applicationId}`)
  }

  const selectedTenant = tenants?.find(t => t.id === selectedTenantId)

  // 加载状态
  if (tenantsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    )
  }

  // 无租户
  if (!tenants || tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">暂无关联租户</h3>
        <p className="text-gray-500 mt-1">您尚未在任何考试机构报名</p>
        <Button className="mt-4" onClick={() => router.push('/candidate/exams')}>
          浏览可报名的考试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和租户选择 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成绩查询</h1>
          <p className="text-gray-500 mt-1">查看您的考试成绩和排名</p>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-w-[200px]"
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
          >
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 当前租户信息卡片 */}
      {selectedTenant && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">当前查看：{selectedTenant.name}</span>
              <span className="text-blue-500 text-sm">（{selectedTenant.code || selectedTenant.slug}）</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 成绩列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            成绩列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applicationsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : scoreEligibleApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">暂无成绩数据</h3>
              <p className="text-gray-500 mt-1 max-w-md">
                只有笔试完成、可面试或已发证的报名才能查看成绩。
                请等待管理员录入成绩。
              </p>
              <Button className="mt-4" variant="outline" onClick={() => router.push('/candidate/applications')}>
                查看我的报名
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报名编号</TableHead>
                  <TableHead>考试名称</TableHead>
                  <TableHead>报考岗位</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoreEligibleApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-mono text-sm">
                      {application.applicationNumber || application.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{application.examTitle || application.examId}</div>
                    </TableCell>
                    <TableCell>
                      <div>{application.positionTitle || application.positionId}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(application.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {application.submittedAt
                        ? new Date(application.submittedAt).toLocaleDateString('zh-CN')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewScores(application.id)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        查看成绩
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

