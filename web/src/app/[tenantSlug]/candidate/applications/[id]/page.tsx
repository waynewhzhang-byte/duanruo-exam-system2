'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Edit, FileText, AlertCircle, CheckCircle2, XCircle, CreditCard } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ApplicationPageProps {
  params: {
    tenantSlug: string
    id: string
  }
}

interface Application {
  id: string
  applicationNo: string
  examTitle: string
  positionTitle: string
  reviewStatus: string
  paymentStatus: string
  formData: Record<string, any>
  attachments: Attachment[]
  reviews: Review[]
  canEdit: boolean
  canPay: boolean
}

interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  downloadUrl: string
}

interface Review {
  id: string
  reviewLevel: string
  reviewerName: string
  reviewResult: string
  reviewComments: string
  reviewedAt: string
}

export default function ApplicationPage({ params }: ApplicationPageProps) {
  const { tenantSlug, id } = params
  const router = useRouter()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editedFormData, setEditedFormData] = useState<Record<string, any>>({})

  // Fetch application details
  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ['application', id],
    queryFn: async () => {
      return apiGet<Application>(`/applications/${id}`)
    },
    enabled: !!id,
  })

  // Update application mutation
  const updateMutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      return apiPut(`/applications/${id}`, { formData })
    },
    onSuccess: () => {
      toast.success('报名信息已更新')
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['application', id] })
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败')
    },
  })

  // Resubmit application mutation
  const resubmitMutation = useMutation({
    mutationFn: async () => {
      return apiPost(`/applications/${id}/resubmit`, {})
    },
    onSuccess: () => {
      toast.success('报名已重新提交审核')
      queryClient.invalidateQueries({ queryKey: ['application', id] })
    },
    onError: (error: any) => {
      toast.error(error?.message || '重新提交失败')
    },
  })

  const handleEdit = () => {
    setEditedFormData(application?.formData || {})
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedFormData({})
  }

  const handleSaveEdit = () => {
    if (!confirm('确定要保存修改吗？')) {
      return
    }

    updateMutation.mutate(editedFormData)
  }

  const handleResubmit = () => {
    if (!confirm('确定要重新提交审核吗？')) {
      return
    }

    resubmitMutation.mutate()
  }

  const handlePayment = () => {
    router.push(`/${tenantSlug}/candidate/applications/${id}/payment`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline">草稿</Badge>
      case 'SUBMITTED':
        return <Badge variant="default">已提交</Badge>
      case 'PENDING_PRIMARY_REVIEW':
        return <Badge variant="default" className="bg-orange-600">待初审</Badge>
      case 'PENDING_SECONDARY_REVIEW':
        return <Badge variant="default" className="bg-blue-600">待复审</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-600">审核通过</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">审核拒绝</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">待支付</Badge>
      case 'PAID':
        return <Badge variant="default" className="bg-green-600">已支付</Badge>
      case 'FAILED':
        return <Badge variant="destructive">支付失败</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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

  const isRejected = application.reviewStatus === 'REJECTED'
  const canEdit = application.canEdit || isRejected
  const canPay = application.canPay && application.reviewStatus === 'APPROVED' && application.paymentStatus === 'PENDING'

  // Get latest rejection reason
  const latestRejection = application.reviews
    ?.filter((r) => r.reviewResult === 'REJECTED')
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())[0]

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${tenantSlug}/candidate/applications`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回我的报名
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">报名详情</h1>
          <p className="text-muted-foreground">报名编号: {application.applicationNo}</p>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(application.reviewStatus)}
          {getPaymentStatusBadge(application.paymentStatus)}
        </div>
      </div>

      {/* Rejection Alert */}
      {isRejected && latestRejection && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>审核未通过</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p className="font-medium mb-1">拒绝原因：</p>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: latestRejection.reviewComments }}
              />
              <p className="text-xs mt-2">
                审核时间: {new Date(latestRejection.reviewedAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                修改报名信息
              </Button>
              <Button size="sm" onClick={handleResubmit} disabled={resubmitMutation.isPending}>
                {resubmitMutation.isPending ? '提交中...' : '重新提交审核'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Alert */}
      {canPay && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>审核已通过</AlertTitle>
          <AlertDescription>
            <p className="mb-3">您的报名申请已通过审核，请尽快完成缴费。</p>
            <Button onClick={handlePayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              立即缴费
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>基本信息</CardTitle>
                {canEdit && !isEditing && (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    编辑
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">考试名称</Label>
                  <p className="font-medium">{application.examTitle}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">报考岗位</Label>
                  <p className="font-medium">{application.positionTitle}</p>
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
              {isEditing ? (
                <div className="space-y-4">
                  {Object.entries(editedFormData).map(([key, value]) => (
                    <div key={key}>
                      <Label>{key}</Label>
                      <Input
                        value={String(value)}
                        onChange={(e) =>
                          setEditedFormData({ ...editedFormData, [key]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? '保存中...' : '保存修改'}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(application.formData || {}).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-muted-foreground">{key}</Label>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
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
                <div className="space-y-2">
                  {application.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(attachment.downloadUrl, '_blank')}
                      >
                        查看
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Review History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>审核历史</CardTitle>
            </CardHeader>
            <CardContent>
              {!application.reviews || application.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">暂无审核记录</p>
              ) : (
                <div className="space-y-4">
                  {application.reviews.map((review) => (
                    <div key={review.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {review.reviewLevel === 'PRIMARY' ? '初审' : '复审'}
                        </Badge>
                        <Badge
                          variant={review.reviewResult === 'APPROVED' ? 'default' : 'destructive'}
                        >
                          {review.reviewResult === 'APPROVED' ? '通过' : '拒绝'}
                        </Badge>
                      </div>
                      <div
                        className="text-sm text-muted-foreground prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: review.reviewComments }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.reviewedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

