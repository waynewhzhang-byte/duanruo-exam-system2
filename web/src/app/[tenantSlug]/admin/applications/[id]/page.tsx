'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiGetWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ArrowLeft, FileText, Image as ImageIcon, Download, Eye, ExternalLink } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { useTenant } from '@/hooks/useTenant'
import { useState } from 'react'

interface ApplicationDetail {
  id: string
  examId: string
  positionId: string
  candidateId: string
  // 候选人信息（从用户表获取）
  candidateName?: string
  candidateIdCardNumber?: string
  candidatePhone?: string
  candidateEmail?: string
  formVersion: number
  payload: Record<string, any>
  status: string
  autoCheckResult?: Record<string, any>
  finalDecision?: Record<string, any>
  submittedAt: string
  statusUpdatedAt?: string
  createdAt: string
  updatedAt: string
  attachments: Attachment[]
}

interface Attachment {
  fileId: string
  fieldKey: string
  fileName: string
  fileSize: number
  contentType: string
}

interface FormField {
  fieldKey: string
  label: string
  fieldType: string
}

interface FormTemplate {
  fields: FormField[]
}

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  AUTO_REJECTED: '自动审核拒绝',
  AUTO_PASSED: '自动审核通过',
  PENDING_PRIMARY_REVIEW: '待初审',
  PRIMARY_REJECTED: '初审拒绝',
  PRIMARY_PASSED: '初审通过',
  PENDING_SECONDARY_REVIEW: '待复审',
  SECONDARY_REJECTED: '复审拒绝',
  APPROVED: '审核通过',
  PAID: '已缴费',
  TICKET_ISSUED: '已发放准考证',
  WRITTEN_EXAM_COMPLETED: '笔试完成',
  INTERVIEW_ELIGIBLE: '有面试资格',
  INTERVIEW_COMPLETED: '面试完成',
  FINAL_PASSED: '最终通过',
  FINAL_REJECTED: '最终拒绝',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SUBMITTED: 'outline',
  AUTO_REJECTED: 'destructive',
  AUTO_PASSED: 'default',
  PENDING_PRIMARY_REVIEW: 'outline',
  PRIMARY_REJECTED: 'destructive',
  PRIMARY_PASSED: 'default',
  PENDING_SECONDARY_REVIEW: 'outline',
  SECONDARY_REJECTED: 'destructive',
  APPROVED: 'default',
  PAID: 'default',
  TICKET_ISSUED: 'default',
}

// 默认的字段标签映射（当表单模板中找不到时使用）
const defaultFieldLabels: Record<string, string> = {
  idCardFiles: '身份证附件',
  idCard: '身份证',
  idCardFront: '身份证正面',
  idCardBack: '身份证背面',
  diplomaFiles: '毕业证附件',
  diploma: '毕业证',
  diplomaCertificate: '毕业证书',
  degreeCertificate: '学位证书',
  degreeFiles: '学位证附件',
  educationFiles: '学历证明附件',
  education: '学历证明',
  photo: '证件照',
  photoFiles: '证件照附件',
  avatar: '头像照片',
  resume: '个人简历',
  resumeFiles: '简历附件',
  certificate: '资格证书',
  certificateFiles: '资格证书附件',
  otherFiles: '其他附件',
  attachment: '附件',
}

// 获取字段的默认标签
function getDefaultFieldLabel(fieldKey: string): string {
  // 1. 首先检查默认映射
  if (defaultFieldLabels[fieldKey]) {
    return defaultFieldLabels[fieldKey]
  }

  // 2. 尝试将 camelCase 转换为可读格式
  // 例如: idCardFiles -> Id Card Files -> 身份证附件（如果能匹配）
  const readable = fieldKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()

  // 3. 如果包含 Files 后缀，标记为附件类型
  if (fieldKey.toLowerCase().includes('files') || fieldKey.toLowerCase().includes('attachment')) {
    return readable + '（附件）'
  }

  return readable || fieldKey
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tenant } = useTenant()
  const tenantSlug = params.tenantSlug as string
  const applicationId = params.id as string
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const { data: application, isLoading, error } = useQuery<ApplicationDetail>({
    queryKey: ['application-detail', applicationId],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded')
      return apiGetWithTenant<ApplicationDetail>(`/applications/${applicationId}`, tenant.id)
    },
    enabled: !!applicationId && !!tenant?.id,
  })

  // 获取表单模板以显示中文标签（使用 examId 而非 positionId）
  const { data: formTemplate } = useQuery<FormTemplate>({
    queryKey: ['form-template', application?.examId],
    queryFn: async () => {
      if (!tenant?.id || !application?.examId) throw new Error('Missing data')
      return apiGetWithTenant<FormTemplate>(`/exams/${application.examId}/form-template`, tenant.id)
    },
    enabled: !!application?.examId && !!tenant?.id,
  })

  // 构建字段标签映射
  const fieldLabelMap: Record<string, string> = {}
  if (formTemplate?.fields) {
    formTemplate.fields.forEach((field) => {
      fieldLabelMap[field.fieldKey] = field.label
    })
  }

  // 获取附件下载 URL
  const handleViewAttachment = async (attachment: Attachment) => {
    if (!tenant?.id) return
    setSelectedAttachment(attachment)
    setPreviewLoading(true)
    try {
      const response = await apiGetWithTenant<{ url: string }>(
        `/files/${attachment.fileId}/download-url`,
        tenant.id
      )
      setPreviewUrl(response.url)
    } catch (err) {
      console.error('Failed to get download URL:', err)
      setPreviewUrl(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownloadAttachment = async (attachment: Attachment) => {
    if (!tenant?.id) return
    try {
      const response = await apiGetWithTenant<{ url: string }>(
        `/files/${attachment.fileId}/download-url`,
        tenant.id
      )
      window.open(response.url, '_blank')
    } catch (err) {
      console.error('Failed to get download URL:', err)
    }
  }

  const closePreview = () => {
    setSelectedAttachment(null)
    setPreviewUrl(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {error ? '加载报名详情失败' : '报名申请不存在'}
            </p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const applicationNumber = 'APP-' + application.id.substring(0, 8).toUpperCase()

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">报名详情</h1>
          <p className="text-muted-foreground">报名编号: {applicationNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[application.status] || 'outline'}>
            {statusLabels[application.status] || application.status}
          </Badge>
          {(application.status === 'PENDING_PRIMARY_REVIEW' || 
            application.status === 'PENDING_SECONDARY_REVIEW') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${tenantSlug}/admin/reviews/${applicationId}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              去审核
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* 考生基本信息（从用户表获取） */}
          <Card>
            <CardHeader>
              <CardTitle>考生基本信息</CardTitle>
              <CardDescription>考生账户注册信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">姓名</Label>
                  <p className="mt-1 font-medium">{application.candidateName || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">身份证号</Label>
                  <p className="mt-1 font-medium">{application.candidateIdCardNumber || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">手机号码</Label>
                  <p className="mt-1 font-medium">{application.candidatePhone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">邮箱</Label>
                  <p className="mt-1 font-medium">{application.candidateEmail || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Data */}
          <Card>
            <CardHeader>
              <CardTitle>报名表单内容</CardTitle>
              <CardDescription>考生填写的报名信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(application.payload || {}).map(([key, value]) => {
                  // 如果 payload 中的值为空，尝试从候选人基本信息获取
                  let displayValue = value;
                  if (!value || (typeof value === 'string' && value.trim() === '')) {
                    if (key === 'fullName' || key === 'name') {
                      displayValue = application.candidateName || '';
                    } else if (key === 'idNumber' || key === 'idCardNumber') {
                      displayValue = application.candidateIdCardNumber || '';
                    } else if (key === 'phone' || key === 'phoneNumber') {
                      displayValue = application.candidatePhone || '';
                    } else if (key === 'email') {
                      displayValue = application.candidateEmail || '';
                    }
                  }
                  return (
                    <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
                      <Label className="text-muted-foreground col-span-1">
                        {fieldLabelMap[key] || key}
                      </Label>
                      <p className="font-medium col-span-2">
                        {typeof displayValue === 'boolean'
                          ? (displayValue ? '是' : '否')
                          : String(displayValue || '-')}
                      </p>
                    </div>
                  );
                })}
                {Object.keys(application.payload || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无表单数据</p>
                )}
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
                <div className="space-y-4">
                  {application.attachments.map((attachment) => {
                    // 获取字段标签，优先使用表单模板中的标签
                    const fieldLabel = fieldLabelMap[attachment.fieldKey] || getDefaultFieldLabel(attachment.fieldKey)

                    return (
                      <div
                        key={attachment.fileId}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        {/* 字段标签 - 醒目显示 */}
                        <div className="mb-3 pb-2 border-b">
                          <Badge variant="secondary" className="text-sm font-medium">
                            {fieldLabel}
                          </Badge>
                        </div>

                        <div className="flex items-start gap-3">
                          {attachment.contentType?.startsWith('image/') ? (
                            <ImageIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                          ) : (
                            <FileText className="h-8 w-8 text-orange-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{attachment.fileName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {attachment.contentType} · {(attachment.fileSize / 1024).toFixed(2)} KB
                            </p>
                            <div className="flex gap-2 mt-3">
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Meta Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>申请信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">申请ID</Label>
                <p className="font-mono text-sm break-all">{application.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">考试ID</Label>
                <p className="font-mono text-sm break-all">{application.examId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">岗位ID</Label>
                <p className="font-mono text-sm break-all">{application.positionId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">候选人ID</Label>
                <p className="font-mono text-sm break-all">{application.candidateId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">表单版本</Label>
                <p className="font-medium">{application.formVersion}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">提交时间</Label>
                <p className="font-medium">
                  {application.submittedAt 
                    ? new Date(application.submittedAt).toLocaleString('zh-CN')
                    : '-'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">状态更新时间</Label>
                <p className="font-medium">
                  {application.statusUpdatedAt 
                    ? new Date(application.statusUpdatedAt).toLocaleString('zh-CN')
                    : '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Auto Check Result */}
          {application.autoCheckResult && Object.keys(application.autoCheckResult).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>自动审核结果</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(application.autoCheckResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Attachment Preview Modal */}
      {selectedAttachment && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="mb-1">
                  {fieldLabelMap[selectedAttachment.fieldKey] || getDefaultFieldLabel(selectedAttachment.fieldKey)}
                </Badge>
                <h3 className="font-medium">{selectedAttachment.fileName}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={closePreview}>
                关闭
              </Button>
            </div>
            <div className="p-4">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                  <span className="ml-2 text-muted-foreground">加载中...</span>
                </div>
              ) : previewUrl ? (
                selectedAttachment.contentType?.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt={selectedAttachment.fileName}
                    className="max-w-full h-auto"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px]"
                    title={selectedAttachment.fileName}
                  />
                )
              ) : (
                <p className="text-center text-muted-foreground py-12">无法加载预览</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

