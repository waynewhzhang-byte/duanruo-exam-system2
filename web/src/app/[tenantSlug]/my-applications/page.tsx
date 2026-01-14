'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGetWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Eye, CreditCard, Download, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Application {
  id: string
  applicationNumber: string
  examId: string
  examTitle: string
  positionId: string
  positionTitle: string
  status: string
  submittedAt: string
  updatedAt: string
  feeRequired: boolean
  feeAmount: number
  feePaid: boolean
}

interface ApplicationsResponse {
  content: Application[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

const STATUS_CONFIG: Record<string, { label: string; variant: any; color: string }> = {
  SUBMITTED: { label: '待初审', variant: 'outline', color: 'text-blue-600' },
  PRIMARY_PASSED: { label: '待复审', variant: 'outline', color: 'text-blue-600' },
  PRIMARY_REJECTED: { label: '初审未通过', variant: 'destructive', color: 'text-red-600' },
  APPROVED: { label: '审核通过', variant: 'default', color: 'text-green-600' },
  SECONDARY_REJECTED: { label: '复审未通过', variant: 'destructive', color: 'text-red-600' },
  PAID: { label: '已缴费', variant: 'default', color: 'text-green-600' },
  TICKET_ISSUED: { label: '已发证', variant: 'default', color: 'text-green-600' },
  COMPLETED: { label: '已完成', variant: 'secondary', color: 'text-gray-600' },
}

export default function MyApplicationsPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useTenant()

  // Fetch my applications
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery<ApplicationsResponse>({
    queryKey: ['my-applications', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant ID required')
      return apiGetWithTenant<ApplicationsResponse>('/applications/my', tenant.id)
    },
    enabled: !!tenant?.id,
  })

  const applications = applicationsData?.content || []

  const isLoading = tenantLoading || applicationsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || { label: status, variant: 'outline', color: 'text-gray-600' }
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getActionButtons = (application: Application) => {
    const buttons = []

    // 查看详情按钮（始终显示）
    buttons.push(
      <Button
        key="detail"
        variant="outline"
        size="sm"
        onClick={() => router.push(`/${tenantSlug}/my-applications/${application.id}`)}
      >
        <Eye className="h-4 w-4 mr-1" />
        查看详情
      </Button>
    )

    // 缴费按钮（审核通过且需要缴费且未缴费）
    if (
      application.status === 'APPROVED' &&
      application.feeRequired &&
      !application.feePaid
    ) {
      buttons.push(
        <Button
          key="pay"
          size="sm"
          onClick={() => router.push(`/${tenantSlug}/candidate/applications/${application.id}/payment`)}
        >
          <CreditCard className="h-4 w-4 mr-1" />
          立即缴费
        </Button>
      )
    }

    // 下载准考证按钮（已发证）
    if (application.status === 'TICKET_ISSUED' || application.status === 'COMPLETED') {
      buttons.push(
        <Button
          key="ticket"
          size="sm"
          onClick={() => router.push(`/${tenantSlug}/my-applications/${application.id}/ticket`)}
        >
          <Download className="h-4 w-4 mr-1" />
          准考证
        </Button>
      )
    }

    return buttons
  }

  // 统计数据
  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter((a) => a.status === 'SUBMITTED' || a.status === 'PRIMARY_PASSED').length || 0,
    approved: applications?.filter((a) => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'TICKET_ISSUED').length || 0,
    rejected: applications?.filter((a) => a.status === 'PRIMARY_REJECTED' || a.status === 'SECONDARY_REJECTED').length || 0,
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">我的报名</h1>
        <p className="text-muted-foreground mt-2">查看和管理您的所有报名申请</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>全部报名</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>审核中</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已通过</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>未通过</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>报名记录</CardTitle>
          <CardDescription>共 {applications?.length || 0} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {!applications || applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无报名记录</p>
              <Button className="mt-4" onClick={() => router.push(`/${tenantSlug}/exams`)}>
                浏览考试
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>报名编号</TableHead>
                    <TableHead>考试名称</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-mono text-sm">
                        {application.applicationNumber || application.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">{application.examTitle}</TableCell>
                      <TableCell>{application.positionTitle}</TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(application.submittedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(application.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {getActionButtons(application)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

