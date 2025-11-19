'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle, Eye, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'

interface Application {
  id: string
  applicationNumber: string
  examTitle: string
  positionTitle: string
  candidateName: string
  status: string
  submittedAt: string
  payload: Record<string, any>
}

export default function ReviewerApplicationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewComment, setReviewComment] = useState('')
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

  // Fetch pending applications
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['reviewer-applications'],
    queryFn: async () => {
      return apiGet<Application[]>('/applications/pending-review')
    },
  })

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async (data: { applicationIds: string[]; approve: boolean; comment: string; stage: string }) => {
      return apiPost('/applications/review/batch', data)
    },
    onSuccess: () => {
      toast.success('审核完成')
      setSelectedIds([])
      setReviewComment('')
      setReviewDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['reviewer-applications'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || '审核失败')
    },
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(applications?.map((a) => a.id) || [])
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleBatchReview = (approve: boolean) => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要审核的报名')
      return
    }
    setReviewAction(approve ? 'approve' : 'reject')
    setReviewDialogOpen(true)
  }

  const handleConfirmReview = async () => {
    if (!reviewComment.trim() && reviewAction === 'reject') {
      toast.error('拒绝时必须填写审核意见')
      return
    }

    await reviewMutation.mutateAsync({
      applicationIds: selectedIds,
      approve: reviewAction === 'approve',
      comment: reviewComment,
      stage: 'PRIMARY', // TODO: 根据当前用户角色判断是初审还是复审
    })
  }

  const handleViewDetail = (application: Application) => {
    setSelectedApplication(application)
    setDetailDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  const stats = {
    total: applications?.length || 0,
    selected: selectedIds.length,
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">报名审核</h1>
        <p className="text-muted-foreground mt-2">审核候选人的报名申请</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>待审核</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已选择</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.selected}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>操作</CardDescription>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => handleBatchReview(true)}
                disabled={selectedIds.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                批量通过
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBatchReview(false)}
                disabled={selectedIds.length === 0}
              >
                <XCircle className="h-4 w-4 mr-1" />
                批量拒绝
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>待审核列表</CardTitle>
          <CardDescription>共 {applications?.length || 0} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {!applications || applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无待审核的报名</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === applications.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>报名编号</TableHead>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>考试名称</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(application.id)}
                          onCheckedChange={(checked) => handleSelectOne(application.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {application.applicationNumber || application.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">{application.candidateName}</TableCell>
                      <TableCell>{application.examTitle}</TableCell>
                      <TableCell>{application.positionTitle}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{application.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(application.submittedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(application)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedIds([application.id])
                              handleBatchReview(true)
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedIds([application.id])
                              handleBatchReview(false)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒绝
                          </Button>
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? '批量通过' : '批量拒绝'}
            </DialogTitle>
            <DialogDescription>
              您正在审核 {selectedIds.length} 条报名申请
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>审核意见 {reviewAction === 'reject' && <span className="text-destructive">*</span>}</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={reviewAction === 'approve' ? '选填' : '请填写拒绝原因'}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleConfirmReview}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? '处理中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>报名详情</DialogTitle>
            <DialogDescription>
              报名编号: {selectedApplication?.applicationNumber || selectedApplication?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">考生姓名</p>
                  <p className="font-medium">{selectedApplication.candidateName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">考试名称</p>
                  <p className="font-medium">{selectedApplication.examTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">报考岗位</p>
                  <p className="font-medium">{selectedApplication.positionTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">提交时间</p>
                  <p className="font-medium">{formatDate(selectedApplication.submittedAt)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">报名信息</h4>
                <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                  {Object.entries(selectedApplication.payload || {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4">
                      <div className="text-sm text-muted-foreground">{key}</div>
                      <div className="col-span-2 text-sm">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


