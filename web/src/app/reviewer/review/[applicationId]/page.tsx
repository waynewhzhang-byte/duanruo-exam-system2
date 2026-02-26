'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, Eye, Check, X } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { downloadFile } from '@/lib/helpers'

interface Application {
  id: string
  candidateName: string
  candidateIdCard: string
  candidatePhone: string
  candidateEmail: string
  examTitle: string
  positionTitle: string
  submittedAt: string
  status: string
  formData: Record<string, any>
  attachments: Attachment[]
  reviewHistory: ReviewRecord[]
  fieldReviews?: Record<string, { status: 'APPROVED' | 'REJECTED' | 'PENDING'; comment?: string }>
}

interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  url: string
}

interface ReviewRecord {
  id: string
  reviewerName: string
  reviewLevel: number
  result: 'APPROVED' | 'REJECTED'
  comments: string
  reviewedAt: string
}

function AttachmentPreviewModal({ 
  attachment, 
  onClose 
}: { 
  attachment: Attachment
  onClose: () => void 
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await apiGet<{ previewUrl: string }>(`/files/${attachment.id}/preview-url`)
        setPreviewUrl(res.previewUrl)
      } catch (e) {
        console.error('Preview failed:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchPreview()
  }, [attachment.id])

  const isImage = attachment.fileType.startsWith('image/')
  const isPdf = attachment.fileType === 'application/pdf'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{attachment.fileName}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {loading && <div className="flex justify-center py-8"><Skeleton className="h-64 w-full" /></div>}
          {!loading && previewUrl && (
            <>
              {isImage && <img src={previewUrl} alt={attachment.fileName} className="max-w-full h-auto" />}
              {isPdf && <iframe src={previewUrl} className="w-full h-[70vh]" />}
              {!isImage && !isPdf && (
                <div className="text-center py-8">
                  <p className="mb-4">该文件类型不支持预览</p>
                  <Button onClick={() => downloadFile(previewUrl, attachment.fileName)}>下载文件</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReviewDetailPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.applicationId as string

  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<Application | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null)

  useEffect(() => {
    fetchApplicationDetail()
  }, [applicationId])

  const fetchApplicationDetail = async () => {
    try {
      setIsLoading(true)
      const data = await apiGet<Application>(`/applications/${applicationId}`)
      setApplication(data)
    } catch (error) {
      console.error('Failed to fetch application:', error)
      alert('获取报名详情失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const res = await apiGet<{ downloadUrl: string }>(`/files/${attachment.id}/download-url`)
      downloadFile(res.downloadUrl, attachment.fileName)
    } catch (error) {
      console.error('Download failed:', error)
      alert('下载失败，请重试')
    }
  }

  const handleApprove = async () => {
    try {
      setIsSubmitting(true)
      await apiPost(`/reviews/${applicationId}/approve`, { comments: reviewComments })
      setShowApproveDialog(false)
      alert('审核通过成功')
      router.push('/reviewer/queue')
    } catch (error) {
      console.error('Failed to approve:', error)
      alert('审核失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsSubmitting(true)
      await apiPost(`/reviews/${applicationId}/reject`, { comments: reviewComments })
      setShowRejectDialog(false)
      alert('审核拒绝成功')
      router.push('/reviewer/queue')
    } catch (error) {
      console.error('Failed to reject:', error)
      alert('审核失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">未找到申请信息</p>
        <Button onClick={() => router.back()} className="mt-4">
          返回
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">审核详情</h1>
            <p className="text-gray-600">申请编号: {application.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            data-testid="btn-approve"
            variant="default"
            onClick={() => setShowApproveDialog(true)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            审核通过
          </Button>
          <Button
            data-testid="btn-reject"
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            审核拒绝
          </Button>
        </div>
      </div>

      {/* Candidate Info */}
      <Card>
        <CardHeader>
          <CardTitle>考生信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">姓名</Label>
              <p className="font-medium">{application.candidateName}</p>
            </div>
            <div>
              <Label className="text-gray-600">身份证号</Label>
              <p className="font-medium">{application.candidateIdCard}</p>
            </div>
            <div>
              <Label className="text-gray-600">手机号</Label>
              <p className="font-medium">{application.candidatePhone}</p>
            </div>
            <div>
              <Label className="text-gray-600">邮箱</Label>
              <p className="font-medium">{application.candidateEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Info */}
      <Card>
        <CardHeader>
          <CardTitle>报考信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">考试名称</Label>
              <p className="font-medium">{application.examTitle}</p>
            </div>
            <div>
              <Label className="text-gray-600">报考岗位</Label>
              <p className="font-medium">{application.positionTitle}</p>
            </div>
            <div>
              <Label className="text-gray-600">提交时间</Label>
              <p className="font-medium">{application.submittedAt}</p>
            </div>
            <div>
              <Label className="text-gray-600">当前状态</Label>
              <Badge>{application.status}</Badge>
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
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(application.formData).map(([key, value]) => (
              <div key={key}>
                <Label className="text-gray-600">{key}</Label>
                <p className="font-medium">{String(value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle>附件材料 ({application.attachments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {application.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{attachment.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(attachment.fileSize)} • {attachment.uploadedAt}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewAttachment(attachment)}>
                    <Eye className="h-4 w-4 mr-1" />
                    预览
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(attachment)}>
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review History */}
      {application.reviewHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>审核历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {application.reviewHistory.map((record) => (
                <div key={record.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={record.result === 'APPROVED' ? 'default' : 'destructive'}>
                      {record.result === 'APPROVED' ? '通过' : '拒绝'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {record.reviewerName} • {record.reviewedAt}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{record.comments}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核通过</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-comments">审核意见</Label>
              <Textarea
                id="approve-comments"
                data-testid="input-review-comments"
                placeholder="请输入审核意见（选填）"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              取消
            </Button>
            <Button
              data-testid="btn-submit-approve"
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核拒绝</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-comments">拒绝原因 *</Label>
              <Textarea
                id="reject-comments"
                data-testid="input-reject-reason"
                placeholder="请输入拒绝原因（必填）"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              取消
            </Button>
            <Button
              data-testid="btn-submit-reject"
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !reviewComments.trim()}
            >
              {isSubmitting ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </div>
  )
}

