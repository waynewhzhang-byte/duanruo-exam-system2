'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell, Pagination } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonTable, EmptyState } from '@/components/ui/loading'
import { Plus, FileText } from 'lucide-react'
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
            继续编辑
          </Button>
        )
      case 'APPROVED':
      case 'PAID':
      case 'TICKET_ISSUED':
        return (
          <Button size="sm" variant="outline" onClick={() => handleViewTicket(application.id)}>
            查看准考证
          </Button>
        )
      default:
        return (
          <Button size="sm" variant="outline" onClick={() => handleViewApplication(application.id)}>
            查看详情
          </Button>
        )
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">我的报名</h1>
              <p className="text-gray-600">管理您的考试报名申请</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <SkeletonTable rows={5} cols={6} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的报名</h1>
            <p className="text-gray-600">管理您的考试报名申请</p>
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
          <CardContent className="p-0">
            {!data || data.content.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="暂无报名记录"
                description="您还没有提交任何考试报名申请"
                action={
                  <Button onClick={handleNewApplication}>
                    <Plus className="h-4 w-4 mr-2" />
                    立即报名
                  </Button>
                }
                className="py-12"
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>考试</TableHeaderCell>
                      <TableHeaderCell>岗位</TableHeaderCell>
                      <TableHeaderCell>状态</TableHeaderCell>
                      <TableHeaderCell>提交时间</TableHeaderCell>
                      <TableHeaderCell>操作</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.content.map((application) => (
                      <TableRow key={application.id}>
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
                          <StatusBadge status={application.status as any} />
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900">{application.submittedAt || '-'}</div>
                        </TableCell>
                        <TableCell>
                          {getActionButton({ id: application.id, status: application.status, examId: application.examId, positionId: application.positionId })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <Pagination
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

