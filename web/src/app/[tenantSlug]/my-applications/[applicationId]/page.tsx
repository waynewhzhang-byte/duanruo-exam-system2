'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGetWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle2, XCircle, Clock, CreditCard, Download, AlertTriangle, FileText, Award, TrendingUp, Eye, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useState } from 'react'

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
  payload: Record<string, any>
  attachments: Attachment[]
  feeRequired: boolean
  feeAmount: number
  feePaid: boolean
  primaryReviewComment?: string
  secondaryReviewComment?: string
  primaryReviewedAt?: string
  secondaryReviewedAt?: string
}

interface Attachment {
  fileId: string
  fieldKey: string
  fileName: string
  fileSize: number
  contentType: string
  virusScanStatus?: string
  uploadedAt?: string
}

interface FormField {
  fieldKey: string
  label: string
  fieldType: string
}

interface FormTemplate {
  fields: FormField[]
}

interface AuditLog {
  id: string
  fromStatus: string
  toStatus: string
  operator: string
  action: string
  comment: string
  createdAt: string
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  DRAFT: { label: '草稿', icon: Clock, color: 'text-gray-500' },
  SUBMITTED: { label: '已提交', icon: Clock, color: 'text-blue-600' },
  AUTO_REJECTED: { label: '自动审核未通过', icon: XCircle, color: 'text-red-600' },
  AUTO_PASSED: { label: '自动审核通过', icon: CheckCircle2, color: 'text-green-600' },
  PENDING_PRIMARY_REVIEW: { label: '待初审', icon: Clock, color: 'text-yellow-600' },
  PRIMARY_PASSED: { label: '初审通过', icon: CheckCircle2, color: 'text-green-600' },
  PRIMARY_REJECTED: { label: '初审未通过', icon: XCircle, color: 'text-red-600' },
  PENDING_SECONDARY_REVIEW: { label: '待复审', icon: Clock, color: 'text-yellow-600' },
  APPROVED: { label: '审核通过', icon: CheckCircle2, color: 'text-green-600' },
  SECONDARY_REJECTED: { label: '复审未通过', icon: XCircle, color: 'text-red-600' },
  PAID: { label: '已缴费', icon: CheckCircle2, color: 'text-green-600' },
  TICKET_ISSUED: { label: '已发证', icon: CheckCircle2, color: 'text-green-600' },
  COMPLETED: { label: '已完成', icon: CheckCircle2, color: 'text-gray-600' },
  WRITTEN_EXAM_COMPLETED: { label: '笔试已完成', icon: Clock, color: 'text-blue-600' },
  INTERVIEW_ELIGIBLE: { label: '有面试资格', icon: Award, color: 'text-green-600' },
  WRITTEN_EXAM_FAILED: { label: '笔试未通过', icon: XCircle, color: 'text-red-600' },
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const applicationId = params.applicationId as string
  const tenantSlug = params.tenantSlug as string
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useTenant()
  const [previewAttachment, setPreviewAttachment] = useState<{url: string, name: string, type: string} | null>(null)

  // Fetch application details
  const { data: application, isLoading: applicationLoading } = useQuery<Application>({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded')
      return apiGetWithTenant<Application>(`/applications/${applicationId}`, tenant.id)
    },
    enabled: !!applicationId && !!tenant?.id,
  })

  // Fetch form template to get field labels
  const { data: formTemplate } = useQuery<FormTemplate>({
    queryKey: ['form-template', application?.positionId],
    queryFn: async () => {
      if (!tenant?.id || !application?.positionId) throw new Error('Position not available')
      const resp = await apiGetWithTenant<{ templateJson: string }>(`/positions/${application.positionId}/form-template`, tenant.id)
      return JSON.parse(resp.templateJson || '{"fields":[]}')
    },
    enabled: !!application?.positionId && !!tenant?.id,
  })

  // Fetch audit logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ['application-audit-logs', applicationId],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded')
      return apiGetWithTenant<AuditLog[]>(`/applications/${applicationId}/audit-logs`, tenant.id)
    },
    enabled: !!applicationId && !!tenant?.id,
  })

  // Build field key to label map
  const fieldLabelMap = new Map<string, string>()
  if (formTemplate?.fields) {
    formTemplate.fields.forEach(field => {
      fieldLabelMap.set(field.fieldKey, field.label)
    })
  }

  // Get download URL for attachment
  const handleViewAttachment = async (attachment: Attachment) => {
    if (!tenant?.id) return
    try {
      const resp = await apiGetWithTenant<{ url: string }>(`/files/${attachment.fileId}/download-url`, tenant.id)
      setPreviewAttachment({
        url: resp.url,
        name: attachment.fileName,
        type: attachment.contentType
      })
    } catch (error) {
      console.error('Failed to get download URL', error)
    }
  }

  const handleDownloadAttachment = async (attachment: Attachment) => {
    if (!tenant?.id) return
    try {
      const resp = await apiGetWithTenant<{ url: string }>(`/files/${attachment.fileId}/download-url`, tenant.id)
      window.open(resp.url, '_blank')
    } catch (error) {
      console.error('Failed to get download URL', error)
    }
  }

  const isLoading = tenantLoading || applicationLoading || logsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">报名记录不存在</p>
        <Button onClick={() => router.push(`/${tenantSlug}/my-applications`)}>返回列表</Button>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  const statusConfig = STATUS_CONFIG[application.status] || {
    label: application.status,
    icon: Clock,
    color: 'text-gray-600',
  }
  const StatusIcon = statusConfig.icon

  // 判断当前可以执行的操作
  const canPay = application.status === 'APPROVED' && application.feeRequired && !application.feePaid
  const canDownloadTicket = application.status === 'TICKET_ISSUED' || application.status === 'COMPLETED'
  const isRejected = application.status === 'PRIMARY_REJECTED' || application.status === 'SECONDARY_REJECTED'

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/${tenantSlug}/my-applications`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">报名详情</h1>
            <p className="text-muted-foreground mt-1">
              报名编号: {application.applicationNumber || application.id.substring(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
          <span className={`text-lg font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {(canPay || canDownloadTicket) && (
        <div className="flex gap-3">
          {canPay && (
            <Button size="lg" onClick={() => router.push(`/${tenantSlug}/candidate/applications/${applicationId}/payment`)}>
              <CreditCard className="h-5 w-5 mr-2" />
              立即缴费 (¥{application.feeAmount})
            </Button>
          )}
          {canDownloadTicket && (
            <Button size="lg" onClick={() => router.push(`/${tenantSlug}/my-applications/${applicationId}/ticket`)}>
              <Download className="h-5 w-5 mr-2" />
              下载准考证
            </Button>
          )}
        </div>
      )}

      {/* Interview Eligibility Alert */}
      {application.status === 'INTERVIEW_ELIGIBLE' && (
        <Alert className="border-green-200 bg-green-50">
          <Award className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong className="text-green-900">恭喜！您已获得面试资格</strong>
            <p className="mt-2 text-green-800">
              您的笔试成绩已达到面试要求，请关注后续面试通知。
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Written Exam Failed Alert */}
      {application.status === 'WRITTEN_EXAM_FAILED' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>笔试未通过</strong>
            <p className="mt-2">
              很遗憾，您的笔试成绩未达到面试要求。感谢您的参与，期待下次机会。
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Rejection Alert */}
      {isRejected && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>审核未通过</strong>
            <p className="mt-2">
              {application.status === 'PRIMARY_REJECTED' && application.primaryReviewComment}
              {application.status === 'SECONDARY_REJECTED' && application.secondaryReviewComment}
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">考试名称</p>
                  <p className="font-medium">{application.examTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">报考岗位</p>
                  <p className="font-medium">{application.positionTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">提交时间</p>
                  <p className="font-medium">{formatDate(application.submittedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">更新时间</p>
                  <p className="font-medium">{formatDate(application.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Data */}
          <Card>
            <CardHeader>
              <CardTitle>报名信息</CardTitle>
              <CardDescription>您提交的报名表单数据</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(application.payload || {}).map(([key, value]) => {
                  // 使用中文标签，如果没有则显示原始 key
                  const label = fieldLabelMap.get(key) || key
                  // 格式化值
                  let displayValue = ''
                  if (typeof value === 'boolean') {
                    displayValue = value ? '是' : '否'
                  } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value, null, 2)
                  } else {
                    displayValue = String(value || '-')
                  }
                  return (
                    <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
                      <div className="text-sm text-muted-foreground">{label}</div>
                      <div className="col-span-2 text-sm font-medium">{displayValue}</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {application.attachments && application.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>附件材料</CardTitle>
                <CardDescription>您上传的证明材料 (共 {application.attachments.length} 个)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.attachments.map((attachment) => {
                    const fieldLabel = fieldLabelMap.get(attachment.fieldKey) || attachment.fieldKey
                    return (
                      <div key={attachment.fileId} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          {attachment.contentType?.startsWith('image/') ? (
                            <ImageIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                          ) : (
                            <FileText className="h-8 w-8 text-orange-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{attachment.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {fieldLabel} · {(attachment.fileSize / 1024).toFixed(2)} KB
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAttachment(attachment)}
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
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>审核进度</CardTitle>
              <CardDescription>报名流程时间线</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log, index) => {
                    const config = STATUS_CONFIG[log.toStatus] || { label: log.toStatus, icon: Clock, color: 'text-gray-600' }
                    const Icon = config.icon
                    return (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 ${index === 0 ? 'bg-primary' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${index === 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          </div>
                          {index < auditLogs.length - 1 && (
                            <div className="w-0.5 h-12 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</p>
                          {log.comment && (
                            <p className="text-sm mt-1 text-muted-foreground">{log.comment}</p>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">暂无审核记录</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fee Info */}
          {application.feeRequired && (
            <Card>
              <CardHeader>
                <CardTitle>缴费信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">报名费</span>
                  <span className="font-semibold text-lg">¥{application.feeAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">缴费状态</span>
                  {application.feePaid ? (
                    <Badge variant="default">已缴费</Badge>
                  ) : (
                    <Badge variant="outline">未缴费</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">{previewAttachment.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewAttachment(null)}>
                关闭
              </Button>
            </div>
            <div className="p-4">
              {previewAttachment.type?.startsWith('image/') ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-w-full h-auto"
                />
              ) : (
                <iframe
                  src={previewAttachment.url}
                  className="w-full h-[600px]"
                  title={previewAttachment.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

