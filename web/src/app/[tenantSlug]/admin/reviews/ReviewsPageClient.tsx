'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant, apiPostWithTenant } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ClipboardList, Search, Filter, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ReviewsPageClientProps {
  tenantSlug: string
}

interface QueueTask {
  id: string
  applicationId: string
  stage: string
  status: string
  assignedTo: string | null
  lockedAt: Date | null
  createdAt: Date
  applicationNo?: string
  candidateName?: string
  examTitle?: string
  positionTitle?: string
}

interface ReviewStatistics {
  totalReviews: number
  pendingPrimary: number
  pendingSecondary: number
  approved: number
  rejected: number
  averageReviewTime: number
}

export default function ReviewsPageClient({ tenantSlug }: ReviewsPageClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { tenant } = useTenant()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentTab, setCurrentTab] = useState('primary')
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState('')

  // Fetch exam list for selector
  const { data: exams } = useQuery<{ content: Array<{ id: string; title: string; code: string }> }>({
    queryKey: ['admin-exams-for-review', tenant?.id],
    queryFn: () => apiGetWithTenant('/exams', tenant!.id),
    enabled: !!tenant?.id,
  })

  // Fetch review queue from correct endpoint
  const { data: reviewQueue, isLoading: queueLoading, refetch } = useQuery({
    queryKey: ['reviews', 'queue', currentTab, selectedExamId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id || !selectedExamId) return { content: [], totalElements: 0 }
      const stage = currentTab === 'primary' ? 'PRIMARY' : 'SECONDARY'
      return apiGetWithTenant(
        `/reviews/queue?examId=${selectedExamId}&stage=${stage}&page=0&size=50`,
        tenant.id
      )
    },
    enabled: !!tenant?.id && !!selectedExamId,
  })

  // Fetch review statistics from correct endpoint
  const { data: statistics, isLoading: statsLoading } = useQuery<ReviewStatistics>({
    queryKey: ['statistics', 'reviews', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant')
      return apiGetWithTenant<ReviewStatistics>('/statistics/reviews', tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Batch decision mutation using correct endpoint
  const batchDecisionMutation = useMutation({
    mutationFn: async ({ taskIds, decision }: { taskIds: string[]; decision: 'APPROVED' | 'REJECTED' }) => {
      if (!tenant?.id) throw new Error('No tenant')
      const decisions = taskIds.map(taskId => ({
        taskId,
        decision,
        comment: decision === 'APPROVED' ? '批量审核通过' : '批量审核拒绝',
      }))
      return apiPostWithTenant('/reviews/batch-decide', tenant.id, { decisions })
    },
    onSuccess: () => {
      toast.success('批量操作成功')
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      setSelectedTaskIds([])
      setShowBatchDialog(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || '批量操作失败')
    },
  })

  const handleViewApplication = (applicationId: string) => {
    router.push(`/${tenantSlug}/admin/reviews/${applicationId}`)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredReviews) {
      setSelectedTaskIds(filteredReviews.map((r) => r.id))
    } else {
      setSelectedTaskIds([])
    }
  }

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds([...selectedTaskIds, taskId])
    } else {
      setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId))
    }
  }

  const handleBatchApprove = () => {
    setBatchAction('approve')
    setShowBatchDialog(true)
  }

  const handleBatchReject = () => {
    setBatchAction('reject')
    setShowBatchDialog(true)
  }

  const handleConfirmBatchAction = () => {
    if (batchAction) {
      batchDecisionMutation.mutate({
        taskIds: selectedTaskIds,
        decision: batchAction === 'approve' ? 'APPROVED' : 'REJECTED',
      })
    }
  }

  // Filter queue items
  const queueContent: QueueTask[] = Array.isArray((reviewQueue as any)?.content)
    ? (reviewQueue as any).content
    : []

  const filteredReviews = queueContent.filter((review) => {
    const matchesSearch =
      (review.candidateName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.applicationNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.examTitle || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || review.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">待审核</Badge>
      case 'ASSIGNED':
        return <Badge variant="default">已分配</Badge>
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-600">已完成</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">审核管理</h1>
          <p className="text-muted-foreground">管理报名申请的审核流程</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <ClipboardList className="h-5 w-5 mr-2" />
          待初审: {statistics?.pendingPrimary || 0}
        </Badge>
      </div>

      {/* Exam Selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">选择考试</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              <option value="">请选择考试...</option>
              {(exams?.content || []).map((exam: any) => (
                <option key={exam.id} value={exam.id}>{exam.title} ({exam.code})</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">审核总数</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalReviews || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待初审</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics?.pendingPrimary || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待复审</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics?.pendingSecondary || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已通过</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.approved || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2">
        <Button
          variant={currentTab === 'primary' ? 'default' : 'outline'}
          onClick={() => { setCurrentTab('primary'); setSelectedTaskIds([]) }}
        >
          初审队列
        </Button>
        <Button
          variant={currentTab === 'secondary' ? 'default' : 'outline'}
          onClick={() => { setCurrentTab('secondary'); setSelectedTaskIds([]) }}
        >
          复审队列
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索考生姓名、报名编号、考试名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="任务状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="PENDING">待审核</SelectItem>
                <SelectItem value="ASSIGNED">已分配</SelectItem>
                <SelectItem value="COMPLETED">已完成</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
            >
              重置筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  已选择 {selectedTaskIds.length} 项
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTaskIds([])}
                >
                  取消选择
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  onClick={handleBatchApprove}
                  disabled={batchDecisionMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  批量通过
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBatchReject}
                  disabled={batchDecisionMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  批量拒绝
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>审核列表</CardTitle>
          <CardDescription>
            {!selectedExamId
              ? '请先选择考试以查看审核队列'
              : `共 ${filteredReviews?.length || 0} 条记录`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !selectedExamId ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">请先在上方选择考试</p>
            </div>
          ) : !filteredReviews || filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">暂无待审核的报名</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredReviews.length > 0 &&
                          selectedTaskIds.length === filteredReviews.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>报名编号</TableHead>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>考试名称</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>任务状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTaskIds.includes(review.id)}
                          onCheckedChange={(checked) =>
                            handleSelectTask(review.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {review.applicationNo || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{review.candidateName || '-'}</TableCell>
                      <TableCell>{review.examTitle || '-'}</TableCell>
                      <TableCell>{review.positionTitle || '-'}</TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          data-testid="btn-view-detail"
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewApplication(review.applicationId)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
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

      {/* Batch Action Confirmation Dialog */}
      <AlertDialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {batchAction === 'approve' ? '批量审核通过' : '批量审核拒绝'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              您确定要{batchAction === 'approve' ? '通过' : '拒绝'} {selectedTaskIds.length} 个审核任务吗？
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBatchAction}
              className={batchAction === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              确认{batchAction === 'approve' ? '通过' : '拒绝'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
