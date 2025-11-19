'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/loading'
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Application {
  id: string
  applicationNumber: string
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  examId: string
  examTitle: string
  positionId: string
  positionTitle: string
  status: string
  submittedAt: string
  updatedAt: string
  reviewedAt?: string
  reviewerName?: string
  reviewComments?: string
}

interface ExamApplicationsProps {
  examId: string
}

export default function ExamApplications({ examId }: ExamApplicationsProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [positionFilter, setPositionFilter] = useState<string>('ALL')

  // 获取报名列表
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['exam-applications', examId, statusFilter, positionFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (positionFilter !== 'ALL') params.append('positionId', positionFilter)
      
      return apiGet<Application[]>(`/exams/${examId}/applications?${params.toString()}`)
    },
  })

  // 获取岗位列表（用于筛选）
  const { data: positions } = useQuery<Array<{ id: string; title: string }>>({
    queryKey: ['exam-positions', examId],
    queryFn: () => apiGet(`/exams/${examId}/positions`),
  })

  // 导出报名数据
  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (positionFilter !== 'ALL') params.append('positionId', positionFilter)
      
      const response = await fetch(`/api/v1/exams/${examId}/applications/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (!response.ok) throw new Error('导出失败')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exam-${examId}-applications-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onSuccess: () => {
      toast.success('导出成功')
    },
    onError: () => {
      toast.error('导出失败')
    },
  })

  // 过滤报名列表
  const filteredApplications = applications?.filter(app => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      app.candidateName?.toLowerCase().includes(term) ||
      app.applicationNumber?.toLowerCase().includes(term) ||
      app.candidateEmail?.toLowerCase().includes(term) ||
      app.candidatePhone?.includes(term)
    )
  })

  // 统计数据
  const stats = {
    total: applications?.length || 0,
    submitted: applications?.filter(a => a.status === 'SUBMITTED').length || 0,
    approved: applications?.filter(a => a.status === 'APPROVED' || a.status === 'PRIMARY_PASSED').length || 0,
    rejected: applications?.filter(a => a.status === 'PRIMARY_REJECTED' || a.status === 'SECONDARY_REJECTED').length || 0,
  }

  // 状态映射
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    DRAFT: { label: '草稿', variant: 'outline', icon: FileText },
    SUBMITTED: { label: '已提交', variant: 'default', icon: Clock },
    PENDING_PRIMARY_REVIEW: { label: '待初审', variant: 'default', icon: Clock },
    PRIMARY_PASSED: { label: '初审通过', variant: 'default', icon: CheckCircle },
    PRIMARY_REJECTED: { label: '初审拒绝', variant: 'destructive', icon: XCircle },
    PENDING_SECONDARY_REVIEW: { label: '待复审', variant: 'default', icon: Clock },
    APPROVED: { label: '审核通过', variant: 'default', icon: CheckCircle },
    SECONDARY_REJECTED: { label: '复审拒绝', variant: 'destructive', icon: XCircle },
    PAID: { label: '已缴费', variant: 'default', icon: CheckCircle },
    TICKET_ISSUED: { label: '已发证', variant: 'default', icon: CheckCircle },
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, variant: 'outline' as const, icon: FileText }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总报名数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">所有报名申请</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">等待审核的申请</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已通过</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">审核通过的申请</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已拒绝</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">审核拒绝的申请</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和操作栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>报名考生列表</CardTitle>
              <CardDescription>共 {filteredApplications?.length || 0} 条记录</CardDescription>
            </div>
            <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选器 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索考生姓名、报名编号、邮箱或手机号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="SUBMITTED">已提交</SelectItem>
                <SelectItem value="PENDING_PRIMARY_REVIEW">待初审</SelectItem>
                <SelectItem value="PRIMARY_PASSED">初审通过</SelectItem>
                <SelectItem value="PRIMARY_REJECTED">初审拒绝</SelectItem>
                <SelectItem value="APPROVED">审核通过</SelectItem>
                <SelectItem value="SECONDARY_REJECTED">复审拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="筛选岗位" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部岗位</SelectItem>
                {positions?.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 报名列表表格 */}
          {!filteredApplications || filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无报名记录</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>报名编号</TableHead>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>联系方式</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-mono text-sm">
                        {application.applicationNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {application.candidateName || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{application.candidateEmail || '-'}</div>
                          <div className="text-muted-foreground">{application.candidatePhone || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{application.positionTitle}</TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell>
                        {application.submittedAt
                          ? format(new Date(application.submittedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/admin/applications/${application.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看详情
                        </Button>
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


