'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Ticket,
  XCircle,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Image as ImageIcon
} from 'lucide-react'
import { useApplication, useExam, usePosition, useWithdrawApplication, useReviewHistory } from '@/lib/api-hooks'
import { useToast } from '@/components/ui/use-toast'
import { apiGet, apiGetWithTenant } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Tenant {
  id: string
  name: string
  code: string
  slug?: string
}

interface ApplicationDetail {
  id: string
  examId: string
  positionId: string
  candidateId: string
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

// 默认的字段标签映射
const defaultFieldLabels: Record<string, string> = {
  fullName: '姓名',
  name: '姓名',
  idNumber: '身份证号',
  idCardNumber: '身份证号',
  phone: '手机号码',
  phoneNumber: '手机号码',
  email: '邮箱',
  gender: '性别',
  birthDate: '出生日期',
  education: '学历',
  major: '专业',
  graduateSchool: '毕业学校',
  graduationYear: '毕业年份',
  workExperience: '工作经验',
  address: '地址',
  idCardFiles: '身份证附件',
  diplomaFiles: '毕业证附件',
  degreeFiles: '学位证附件',
  photoFiles: '证件照',
  resumeFiles: '简历附件',
  certificateFiles: '资格证书附件',
  otherFiles: '其他附件',
}

// 获取字段的默认标签
function getFieldLabel(fieldKey: string): string {
  if (defaultFieldLabels[fieldKey]) {
    return defaultFieldLabels[fieldKey]
  }
  // 尝试将 camelCase 转换为可读格式
  const readable = fieldKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
  return readable || fieldKey
}

export default function CandidateApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = (params as any)?.id as string
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const { toast } = useToast()

  // 获取用户关联的租户列表
  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => {
      return apiGet<Tenant[]>('/tenants/me')
    },
  })

  // 自动选择第一个租户
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

  // 使用带租户 ID 的 API 获取报名详情
  const { data: application, isLoading: applicationLoading } = useQuery<ApplicationDetail>({
    queryKey: ['application-detail', id, selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) throw new Error('No tenant selected')
      return apiGetWithTenant<ApplicationDetail>(`/applications/${id}`, selectedTenantId)
    },
    enabled: !!id && !!selectedTenantId,
  })

  const withdraw = useWithdrawApplication()
  const { data: reviewHistory, isLoading: historyLoading } = useReviewHistory(id)

  const examId = application?.examId || ''
  const positionId = application?.positionId || ''
  const { data: exam } = useExam(examId)
  const { data: position } = usePosition(positionId)

  // 处理附件预览
  const handleViewAttachment = async (attachment: Attachment) => {
    if (!selectedTenantId) return
    setPreviewLoading(true)
    try {
      const response = await apiGetWithTenant<{ url: string }>(
        `/files/${attachment.fileId}/download-url`,
        selectedTenantId
      )
      setPreviewUrl(response.url)
    } catch (err) {
      console.error('Failed to get download URL:', err)
      toast({
        title: "错误",
        description: "获取文件预览失败",
        variant: "destructive"
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownloadAttachment = async (attachment: Attachment) => {
    if (!selectedTenantId) return
    try {
      const response = await apiGetWithTenant<{ url: string }>(
        `/files/${attachment.fileId}/download-url`,
        selectedTenantId
      )
      window.open(response.url, '_blank')
    } catch (err) {
      console.error('Failed to get download URL:', err)
      toast({
        title: "错误",
        description: "获取文件下载链接失败",
        variant: "destructive"
      })
    }
  }

  const isLoading = tenantsLoading || applicationLoading

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      DRAFT: { label: '草稿', variant: 'secondary', icon: FileText },
      SUBMITTED: { label: '已提交', variant: 'default', icon: CheckCircle2 },
      PENDING_PRIMARY_REVIEW: { label: '待初审', variant: 'outline', icon: Clock },
      PENDING_SECONDARY_REVIEW: { label: '待复审', variant: 'outline', icon: Clock },
      APPROVED: { label: '已通过', variant: 'default', icon: CheckCircle2 },
      REJECTED: { label: '已拒绝', variant: 'destructive', icon: AlertCircle },
      PAID: { label: '已缴费', variant: 'default', icon: CheckCircle2 },
      TICKET_ISSUED: { label: '已发证', variant: 'default', icon: Ticket }
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const, icon: FileText }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (!id) return null
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const status: string = application?.status || '-'
  const createdAt: string = application?.createdAt || application?.submittedAt || '-'
  const ticketIssued: boolean = (application?.status === 'TICKET_ISSUED') || Boolean((application as any)?.ticketId)
  const canPay: boolean = (application as any)?.paymentStatus === 'PENDING' || ['APPROVED','PENDING_PAYMENT','PAYMENT_PENDING'].includes(status)
  const canWithdraw: boolean = !['DRAFT','WITHDRAWN','TICKET_ISSUED','EXPIRED'].includes(status)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push('/candidate/applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回我的报名
        </Button>
        {/* 租户选择器 */}
        {tenants && tenants.length > 1 && (
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择考试机构" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 考生基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>考生基本信息</CardTitle>
          <CardDescription>您的账户信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">姓名</Label>
              <p className="mt-1 font-medium">{application?.candidateName || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">身份证号</Label>
              <p className="mt-1 font-medium">{application?.candidateIdCardNumber || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">手机号码</Label>
              <p className="mt-1 font-medium">{application?.candidatePhone || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">邮箱</Label>
              <p className="mt-1 font-medium">{application?.candidateEmail || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 报名基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>报名详情</CardTitle>
            {getStatusBadge(status)}
          </div>
          <CardDescription>查看您的报名信息和审核状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">考试</div>
              <div className="text-base font-semibold">{(exam as any)?.title || (exam as any)?.name || examId || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">应聘岗位</div>
              <div className="text-base font-semibold">{(position as any)?.title || (position as any)?.name || positionId || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">提交时间</div>
              <div className="text-base">{createdAt}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">申请编号</div>
              <div className="text-base font-mono text-sm">{id}</div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {canPay && (
              <Button onClick={() => {
                const tenantSlug = tenants?.find(t => t.id === selectedTenantId)?.slug || 'default'
                router.push(`/${tenantSlug}/candidate/applications/${id}/payment`)
              }}>
                <CreditCard className="h-4 w-4 mr-2" />
                去支付
              </Button>
            )}
            {ticketIssued && (
              <Button variant="outline" onClick={() => router.push(`/candidate/tickets/${id}`)}>
                <Ticket className="h-4 w-4 mr-2" />
                查看准考证
              </Button>
            )}
            {canWithdraw && (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm('确认撤回报名？撤回后需重新提交审核。')) return
                  try {
                    await withdraw.mutateAsync(id)
                    toast({
                      title: "成功",
                      description: "撤回成功"
                    })
                    router.push('/candidate/applications')
                  } catch (e) {
                    console.error('withdraw error', e)
                    toast({
                      title: "错误",
                      description: "撤回失败，请稍后再试",
                      variant: "destructive"
                    })
                  }
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                撤回报名
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 报名表单内容 */}
      <Card>
        <CardHeader>
          <CardTitle>报名表单内容</CardTitle>
          <CardDescription>您填写的报名信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(application?.payload || {}).map(([key, value]) => {
              // 如果 payload 中的值为空，尝试从候选人基本信息获取
              let displayValue = value;
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                if (key === 'fullName' || key === 'name') {
                  displayValue = application?.candidateName || '';
                } else if (key === 'idNumber' || key === 'idCardNumber') {
                  displayValue = application?.candidateIdCardNumber || '';
                } else if (key === 'phone' || key === 'phoneNumber') {
                  displayValue = application?.candidatePhone || '';
                } else if (key === 'email') {
                  displayValue = application?.candidateEmail || '';
                }
              }
              return (
                <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
                  <Label className="text-muted-foreground col-span-1">
                    {getFieldLabel(key)}
                  </Label>
                  <p className="font-medium col-span-2">
                    {typeof displayValue === 'boolean'
                      ? (displayValue ? '是' : '否')
                      : String(displayValue || '-')}
                  </p>
                </div>
              );
            })}
            {Object.keys(application?.payload || {}).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无表单数据</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 附件材料 */}
      <Card>
        <CardHeader>
          <CardTitle>附件材料</CardTitle>
          <CardDescription>共 {application?.attachments?.length || 0} 个附件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {application?.attachments && application.attachments.length > 0 ? (
              application.attachments.map((attachment) => (
                <div
                  key={attachment.fileId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {attachment.contentType?.startsWith('image/') ? (
                      <ImageIcon className="h-8 w-8 text-blue-500" />
                    ) : (
                      <FileText className="h-8 w-8 text-orange-500" />
                    )}
                    <div>
                      <p className="font-medium">{attachment.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {getFieldLabel(attachment.fieldKey)} · {(attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewAttachment(attachment)}
                      disabled={previewLoading}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      预览
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      下载
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">暂无附件</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 支付与截止信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>支付信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">是否收费</div>
            <div className="font-medium">{(exam as any)?.feeRequired ? '是' : '否'}</div>
            {(exam as any)?.feeRequired && (
              <div>
                <div className="text-sm text-muted-foreground">金额</div>
                <div className="font-medium">￥{(exam as any)?.feeAmount ?? '-'}</div>
              </div>
            )}
            {(application as any)?.paymentStatus && (
              <div>
                <div className="text-sm text-muted-foreground">支付状态</div>
                <div className="font-medium">{(application as any)?.paymentStatus}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>报名截止</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">截止时间</div>
            <div className="font-medium">{(exam as any)?.registrationEnd || '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* 审核历史 */}
      <Card>
        <CardHeader>
          <CardTitle>审核历史</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="py-4 flex justify-center">
              <Skeleton className="h-20 w-full" />
            </div>
          ) : Array.isArray(reviewHistory) && reviewHistory.length > 0 ? (
            <div className="space-y-3">
              {reviewHistory.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {h.stage === 'PRIMARY' ? '初审' : h.stage === 'SECONDARY' ? '复审' : '自动'}
                      <span className="mx-2">·</span>
                      {h.decision === 'APPROVED' ? '通过' : h.decision === 'REJECTED' ? '拒绝' : '待定'}
                    </div>
                    <div className="font-medium text-sm">
                      {h.reviewerName || h.reviewerId || '—'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {h.reviewedAt || '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">暂无审核历史</p>
          )}
        </CardContent>
      </Card>

      {/* 预览模态框 */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex">
          <div className="bg-white w-full h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <span className="font-medium">文件预览</span>
              <Button variant="outline" onClick={() => setPreviewUrl(null)}>关闭预览</Button>
            </div>
            <iframe src={previewUrl} title="attachment-preview" className="w-full flex-1" />
          </div>
        </div>
      )}
    </div>
  )
}

