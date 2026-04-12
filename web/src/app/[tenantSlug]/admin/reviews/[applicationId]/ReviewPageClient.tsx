'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle2, XCircle, FileText, Image as ImageIcon, Download, Eye } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// 动态导入 react-quill 以避免 SSR 问题
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface ReviewPageClientProps {
  tenantSlug: string
  applicationId: string
}

interface Application {
  id: string
  applicationNo: string
  candidateName: string
  examTitle: string
  positionTitle: string
  reviewStatus: string
  formData: Record<string, any>
  attachments: Attachment[]
  reviews: Review[]
}

interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  downloadUrl: string
}

interface Review {
  id: string
  reviewLevel?: string
  stage?: string
  reviewerName: string
  reviewResult?: string
  decision?: string
  reviewComments?: string
  comment?: string
  reviewedAt: string
}

export default function ReviewPageClient({ tenantSlug, applicationId }: ReviewPageClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [reviewComments, setReviewComments] = useState('')
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null)

  // Fetch application details
  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      return apiGet<Application>(`/applications/${applicationId}`)
    },
    enabled: !!applicationId,
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (comments: string) => {
      const isPrimaryReview = application?.reviewStatus === 'PENDING_PRIMARY_REVIEW'
      const endpoint = isPrimaryReview
        ? `/applications/${applicationId}/primary-approve`
        : `/applications/${applicationId}/secondary-approve`
      
      return apiPost(endpoint, { comments })
    },
    onSuccess: () => {
      toast.success('审核通过成功')
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      router.push(`/${tenantSlug}/admin/reviews`)
    },
    onError: (error: any) => {
      toast.error(error?.message || '审核失败')
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (comments: string) => {
      const isPrimaryReview = application?.reviewStatus === 'PENDING_PRIMARY_REVIEW'
      const endpoint = isPrimaryReview
        ? `/applications/${applicationId}/primary-reject`
        : `/applications/${applicationId}/secondary-reject`
      
      return apiPost(endpoint, { comments })
    },
    onSuccess: () => {
      toast.success('审核拒绝成功')
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      router.push(`/${tenantSlug}/admin/reviews`)
    },
    onError: (error: any) => {
      toast.error(error?.message || '审核失败')
    },
  })

  const handleApprove = () => {
    if (!reviewComments.trim()) {
      toast.error('请填写审核意见')
      return
    }

    if (!confirm('确定要通过此报名申请吗？')) {
      return
    }

    approveMutation.mutate(reviewComments)
  }

  const handleReject = () => {
    if (!reviewComments.trim()) {
      toast.error('请填写拒绝原因')
      return
    }

    if (!confirm('确定要拒绝此报名申请吗？')) {
      return
    }

    rejectMutation.mutate(reviewComments)
  }

  const handleDownloadAttachment = (attachment: Attachment) => {
    window.open(attachment.downloadUrl, '_blank')
  }

  const handlePreviewAttachment = (attachment: Attachment) => {
    setSelectedAttachment(attachment)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">报名申请不存在</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canReview =
    application.reviewStatus === 'PENDING_PRIMARY_REVIEW' ||
    application.reviewStatus === 'PENDING_SECONDARY_REVIEW'

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${tenantSlug}/admin/reviews`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回审核列表
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">审核详情</h1>
          <p className="text-muted-foreground">报名编号: {application.applicationNo}</p>
        </div>
        <Badge
          variant={
            application.reviewStatus === 'APPROVED'
              ? 'default'
              : application.reviewStatus === 'REJECTED'
              ? 'destructive'
              : 'outline'
          }
        >
          {application.reviewStatus === 'PENDING_PRIMARY_REVIEW' && '待初审'}
          {application.reviewStatus === 'PENDING_SECONDARY_REVIEW' && '待复审'}
          {application.reviewStatus === 'APPROVED' && '已通过'}
          {application.reviewStatus === 'REJECTED' && '已拒绝'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">考生姓名</Label>
                  <p className="font-medium">{application.candidateName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">考试名称</Label>
                  <p className="font-medium">{application.examTitle}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">报考岗位</Label>
                  <p className="font-medium">{application.positionTitle}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">报名编号</Label>
                  <p className="font-mono text-sm">{application.applicationNo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Data */}
          <Card>
            <CardHeader>
              <CardTitle>报名表单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(application.formData || {}).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-muted-foreground">{key}</Label>
                    <p className="font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>附件材料</CardTitle>
              <CardDescription>共 {application.attachments?.length || 0} 个附件</CardDescription>
            </CardHeader>
            <CardContent>
              {!application.attachments || application.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">暂无附件</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {attachment.fileType.startsWith('image/') ? (
                          <ImageIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        ) : (
                          <FileText className="h-8 w-8 text-orange-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.fileSize / 1024).toFixed(2)} KB
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewAttachment(attachment)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              预览
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              下载
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review History */}
          <Card>
            <CardHeader>
              <CardTitle>审核历史</CardTitle>
              <CardDescription>完整的审核记录和状态变更追踪</CardDescription>
            </CardHeader>
            <CardContent>
              {!application.reviews || application.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">暂无审核记录</p>
              ) : (
                <div className="space-y-4">
                  {application.reviews.map((review, index) => {
                    const stage = review.stage || review.reviewLevel
                    const decision = review.decision || review.reviewResult
                    const comments = review.comment || review.reviewComments

                    return (
                      <div key={review.id || index} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {stage === 'PRIMARY' ? '初审' : stage === 'SECONDARY' ? '复审' : '系统审核'}
                            </Badge>
                            <span className="font-medium">{review.reviewerName || '系统'}</span>
                          </div>
                          <Badge
                            variant={
                              decision === 'APPROVED' || decision === 'APPROVE'
                                ? 'default'
                                : decision === 'REJECTED' || decision === 'REJECT'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {decision === 'APPROVED' || decision === 'APPROVE'
                              ? '通过'
                              : decision === 'REJECTED' || decision === 'REJECT'
                              ? '拒绝'
                              : decision || '处理中'}
                          </Badge>
                        </div>
                        {comments && (
                          <div className="text-sm text-muted-foreground prose prose-sm max-w-none mb-2">
                            {comments.startsWith('<') ? (
                              <div dangerouslySetInnerHTML={{ __html: comments }} />
                            ) : (
                              <p>{comments}</p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.reviewedAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Review Actions */}
        <div className="space-y-6">
          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>审核操作</CardTitle>
                <CardDescription>
                  {application.reviewStatus === 'PENDING_PRIMARY_REVIEW' ? '初审' : '复审'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comments">审核意见 *</Label>
                  <ReactQuill
                    theme="snow"
                    value={reviewComments}
                    onChange={setReviewComments}
                    placeholder="请输入审核意见..."
                    className="bg-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    data-testid="btn-approve"
                    onClick={handleApprove}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="w-full"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {approveMutation.isPending ? '处理中...' : '审核通过'}
                  </Button>

                  <Button
                    data-testid="btn-reject"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {rejectMutation.isPending ? '处理中...' : '审核拒绝'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Attachment Preview Modal */}
      {selectedAttachment && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAttachment(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAttachment(null); } }}
          aria-label="关闭预览"
        >
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }} aria-label="预览内容">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">{selectedAttachment.fileName}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAttachment(null)}>
                关闭
              </Button>
            </div>
            <div className="p-4">
              {selectedAttachment.fileType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedAttachment.downloadUrl}
                  alt={selectedAttachment.fileName}
                  className="max-w-full h-auto"
                />
              ) : (
                <iframe
                  src={selectedAttachment.downloadUrl}
                  className="w-full h-[600px]"
                  title={selectedAttachment.fileName}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

