'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
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

interface Application {
  id: string
  applicationNo: string
  candidateName: string
  examTitle: string
  positionTitle: string
  reviewStatus: string
  submittedAt: string
  reviewLevel: string
}

interface ReviewStatistics {
  totalPending: number
  primaryPending: number
  secondaryPending: number
  approvedToday: number
  rejectedToday: number
}

export default function ReviewsPageClient({ tenantSlug }: ReviewsPageClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentTab, setCurrentTab] = useState('pending')
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null)
  const [showBatchDialog, setShowBatchDialog] = useState(false)

  // Fetch pending reviews
  const { data: pendingReviews, isLoading: pendingLoading } = useQuery<Application[]>({
    queryKey: ['reviews', 'pending', currentTab],
    queryFn: async () => {
      return apiGet<Application[]>('/reviews/pending')
    },
  })

  // Fetch review statistics
  const { data: statistics, isLoading: statsLoading } = useQuery<ReviewStatistics>({
    queryKey: ['reviews', 'statistics'],
    queryFn: async () => {
      return apiGet<ReviewStatistics>('/reviews/statistics')
    },
  })

  // Batch decision mutation (using application-based batch review)
  const batchDecisionMutation = useMutation({
    mutationFn: async ({ applicationIds, approve }: { applicationIds: string[]; approve: boolean }) => {
      return apiPost('/reviews/batch-review', {
        applicationIds,
        approve,
        reason: approve ? '批量审核通过' : '批量审核拒绝',
      })
    },
    onSuccess: (data: any, variables) => {
      const action = variables.approve ? '通过' : '拒绝'
      const successCount = data.success || data.successCount || 0
      const failedCount = data.failed || data.failureCount || 0

      if (failedCount > 0) {
        toast.warning(`批量${action}完成：${successCount} 个成功，${failedCount} 个失败`)
      } else {
        toast.success(`批量${action}成功：${successCount} 个${action}`)
      }

      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      setSelectedApplications([])
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
      setSelectedApplications(filteredReviews.map((r) => r.id))
    } else {
      setSelectedApplications([])
    }
  }

  const handleSelectApplication = (applicationId: string, checked: boolean) => {
    if (checked) {
      setSelectedApplications([...selectedApplications, applicationId])
    } else {
      setSelectedApplications(selectedApplications.filter((id) => id !== applicationId))
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
        applicationIds: selectedApplications,
        approve: batchAction === 'approve',
      })
    }
  }

  // Filter reviews
  const filteredReviews = Array.isArray(pendingReviews)
    ? pendingReviews.filter((review) => {
        const matchesSearch =
          review.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.applicationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.examTitle.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || review.reviewStatus === statusFilter

        return matchesSearch && matchesStatus
      })
    : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PRIMARY_REVIEW':
        return <Badge variant="outline">待初审</Badge>
      case 'PENDING_SECONDARY_REVIEW':
        return <Badge variant="default">待复审</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-600">已通过</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">已拒绝</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (pendingLoading || statsLoading) {
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
          待审核: {statistics?.totalPending || 0}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核总数</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalPending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待初审</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics?.primaryPending || 0}
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
              {statistics?.secondaryPending || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日通过</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.approvedToday || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日拒绝</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics?.rejectedToday || 0}
            </div>
          </CardContent>
        </Card>
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
                <SelectValue placeholder="审核状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="PENDING_PRIMARY_REVIEW">待初审</SelectItem>
                <SelectItem value="PENDING_SECONDARY_REVIEW">待复审</SelectItem>
                <SelectItem value="APPROVED">已通过</SelectItem>
                <SelectItem value="REJECTED">已拒绝</SelectItem>
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
      {selectedApplications.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  已选择 {selectedApplications.length} 项
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplications([])}
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
            共 {filteredReviews?.length || 0} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!filteredReviews || filteredReviews.length === 0 ? (
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
                          selectedApplications.length === filteredReviews.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>报名编号</TableHead>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>考试名称</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>审核状态</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedApplications.includes(review.id)}
                          onCheckedChange={(checked) =>
                            handleSelectApplication(review.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {review.applicationNo}
                      </TableCell>
                      <TableCell className="font-medium">{review.candidateName}</TableCell>
                      <TableCell>{review.examTitle}</TableCell>
                      <TableCell>{review.positionTitle}</TableCell>
                      <TableCell>{getStatusBadge(review.reviewStatus)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(review.submittedAt).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          data-testid="btn-view-detail"
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewApplication(review.id)}
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
              您确定要{batchAction === 'approve' ? '通过' : '拒绝'} {selectedApplications.length} 个报名申请吗？
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

