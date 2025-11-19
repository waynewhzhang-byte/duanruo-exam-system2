'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, FileText, Eye, Edit, Ticket } from 'lucide-react'
import { useMyApplications, useExam, usePosition } from '@/lib/api-hooks'

function ExamTitle({ examId }: Readonly<{ examId: string }>) {
  const { data } = useExam(examId)
  return (
    <div>
      <div className="font-medium text-gray-900">{data?.title ?? examId}</div>
    </div>
  )
}

function PositionTitle({ positionId }: Readonly<{ positionId: string }>) {
  const { data } = usePosition(positionId)
  const name = (data as any)?.title || (data as any)?.name || positionId
  return <div className="text-gray-900">{name}</div>
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')
  const [examIdFilter, setExamIdFilter] = useState('')
  const [positionIdFilter, setPositionIdFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'submittedAt,desc' | 'submittedAt,asc'>('submittedAt,desc')

  const { data, isLoading } = useMyApplications({
    page: currentPage - 1,
    size: pageSize,
    status: statusFilter || undefined,
    examId: examIdFilter || undefined,
    positionId: positionIdFilter || undefined,
    sort: sortOrder,
  })

  const pagination = data ? {
    currentPage: data.currentPage + 1,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    pageSize: data.pageSize,
    hasNext: data.hasNext,
    hasPrevious: data.hasPrevious,
  } : {
    currentPage,
    totalPages: 0,
    totalElements: 0,
    pageSize,
    hasNext: false,
    hasPrevious: false,
  }

  const handleNewApplication = () => {
    // 直接进入新建报名页面（页面内可选择考试/岗位）
    router.push('/candidate/applications/new')
  }

  const handleViewApplication = (id: string) => {
    router.push(`/candidate/applications/${id}`)
  }

  const handleViewTicket = (applicationId: string) => {
    router.push(`/candidate/tickets/${applicationId}`)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: '草稿', variant: 'secondary' },
      SUBMITTED: { label: '已提交', variant: 'default' },
      PENDING_PRIMARY_REVIEW: { label: '待初审', variant: 'outline' },
      PENDING_SECONDARY_REVIEW: { label: '待复审', variant: 'outline' },
      APPROVED: { label: '已通过', variant: 'default' },
      REJECTED: { label: '已拒绝', variant: 'destructive' },
      PAID: { label: '已缴费', variant: 'default' },
      TICKET_ISSUED: { label: '已发证', variant: 'default' }
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getApplicationProgress = (status: string) => {
    const progressMap: Record<string, { percentage: number; color: string }> = {
      DRAFT: { percentage: 10, color: 'bg-gray-400' },
      SUBMITTED: { percentage: 25, color: 'bg-blue-500' },
      PENDING_PRIMARY_REVIEW: { percentage: 40, color: 'bg-yellow-500' },
      PENDING_SECONDARY_REVIEW: { percentage: 60, color: 'bg-yellow-500' },
      APPROVED: { percentage: 80, color: 'bg-green-500' },
      REJECTED: { percentage: 100, color: 'bg-red-500' },
      PAID: { percentage: 90, color: 'bg-green-500' },
      TICKET_ISSUED: { percentage: 100, color: 'bg-green-600' },
      AUTO_PASSED: { percentage: 80, color: 'bg-green-500' },
      AUTO_REJECTED: { percentage: 100, color: 'bg-red-500' },
    }
    return progressMap[status] || { percentage: 0, color: 'bg-gray-400' }
  }

  const getActionButton = (application: { id: string; status: string; examId?: string; positionId?: string }) => {
    switch (application.status) {
      case 'DRAFT':
        return (
          <Button size="sm" onClick={() => {
            const sp = new URLSearchParams()
            if (application.id) sp.set('draftId', application.id)
            if (application.examId) sp.set('examId', application.examId)
            if (application.positionId) sp.set('positionId', application.positionId)
            router.push(`/candidate/applications/new?${sp.toString()}`)
          }}>
            <Edit className="h-4 w-4 mr-1" />
            继续编辑
          </Button>
        )
      case 'APPROVED':
      case 'PAID':
      case 'TICKET_ISSUED':
        return (
          <Button size="sm" variant="outline" onClick={() => handleViewTicket(application.id)}>
            <Ticket className="h-4 w-4 mr-1" />
            查看准考证
          </Button>
        )
      default:
        return (
          <Button size="sm" variant="outline" onClick={() => handleViewApplication(application.id)}>
            <Eye className="h-4 w-4 mr-1" />
            查看详情
          </Button>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的报名</h1>
          <p className="text-muted-foreground mt-2">管理您的考试报名申请</p>
        </div>
          <div className="flex items-center space-x-3">
            <input
              className="border border-gray-300 rounded-md px-2 py-1 text-sm w-56"
              placeholder="按考试ID过滤（可选）"
              value={examIdFilter}
              onChange={(e) => { setCurrentPage(1); setExamIdFilter(e.target.value.trim()) }}
            />
            <input
              className="border border-gray-300 rounded-md px-2 py-1 text-sm w-56"
              placeholder="按岗位ID过滤（可选）"
              value={positionIdFilter}
              onChange={(e) => { setCurrentPage(1); setPositionIdFilter(e.target.value.trim()) }}
            />
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={sortOrder}
              onChange={(e) => { setCurrentPage(1); setSortOrder(e.target.value as any) }}
            >
              <option value="submittedAt,desc">提交时间 降序</option>
              <option value="submittedAt,asc">提交时间 升序</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => { setCurrentPage(1); setStatusFilter(e.target.value) }}
            >
              <option value="">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="SUBMITTED">已提交</option>
              <option value="PENDING_PRIMARY_REVIEW">待一级审核</option>
              <option value="PENDING_SECONDARY_REVIEW">待复核</option>
              <option value="APPROVED">审核通过</option>
              <option value="REJECTED">审核拒绝</option>
              <option value="AUTO_PASSED">自动通过</option>
              <option value="AUTO_REJECTED">自动拒绝</option>
            </select>
            <Button
              variant="outline"
              onClick={() => router.push('/candidate/applications/template')}
            >
              <FileText className="h-4 w-4 mr-2" />
              模板报名
            </Button>
            <Button onClick={handleNewApplication}>
              <Plus className="h-4 w-4 mr-2" />
              新建报名
            </Button>
          </div>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>报名列表</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !data || data.content.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">暂无报名记录</h3>
                <p className="text-sm text-muted-foreground mb-4">您还没有提交任何考试报名申请</p>
                <Button onClick={handleNewApplication}>
                  <Plus className="h-4 w-4 mr-2" />
                  立即报名
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>报名号</TableHead>
                      <TableHead>考试</TableHead>
                      <TableHead>岗位</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>进度</TableHead>
                      <TableHead>提交时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.content.map((application) => {
                      const progress = getApplicationProgress(application.status)
                      return (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {(application as any).applicationNo || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            { (application as any).examTitle ? (
                              <div className="font-medium text-gray-900">{(application as any).examTitle}</div>
                            ) : (
                              <ExamTitle examId={application.examId} />
                            )}
                          </TableCell>
                          <TableCell>
                            { (application as any).positionTitle ? (
                              <div className="text-gray-900">{(application as any).positionTitle}</div>
                            ) : (
                              <PositionTitle positionId={application.positionId} />
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(application.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${progress.color}`}
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {progress.percentage}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {application.submittedAt ? new Date(application.submittedAt).toLocaleString('zh-CN') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {getActionButton({ id: application.id, status: application.status, examId: application.examId, positionId: application.positionId })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
