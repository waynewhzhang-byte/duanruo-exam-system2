'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Ticket,
  XCircle,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useApplication, useExam, usePosition, useWithdrawApplication, useReviewHistory } from '@/lib/api-hooks'
import { useToast } from '@/components/ui/use-toast'
import { apiGet } from '@/lib/api'

export default function CandidateApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = (params as any)?.id as string
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const { data, isLoading } = useApplication(id)
  const withdraw = useWithdrawApplication()
  const { data: reviewHistory, isLoading: historyLoading } = useReviewHistory(id)

  const examId = (data as any)?.examId || (data as any)?.exam?.id
  const positionId = (data as any)?.positionId || (data as any)?.position?.id
  const { data: exam } = useExam(examId)
  const { data: position } = usePosition(positionId)

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

  const status: string = (data as any)?.status || '-'
  const createdAt: string = (data as any)?.createdAt || (data as any)?.submittedAt || '-'
  const ticketIssued: boolean = ((data as any)?.status === 'TICKET_ISSUED') || Boolean((data as any)?.ticketId)
  const canPay: boolean = (data as any)?.paymentStatus === 'PENDING' || ['APPROVED','PENDING_PAYMENT','PAYMENT_PENDING'].includes(status)
  const canWithdraw: boolean = !['DRAFT','WITHDRAWN','TICKET_ISSUED','EXPIRED'].includes(status)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push('/candidate/applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回我的报名
        </Button>
      </div>

      {/* Basic Info Card */}
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
                // 需要获取tenantSlug，这里先尝试从context或params获取
                const tenantSlug = window.location.pathname.split('/')[1] || 'default'
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

          {/* 支付与截止信息 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>支付信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-gray-600">是否收费</div>
                <div className="text-gray-900">{(exam as any)?.feeRequired ? '是' : '否'}</div>
                {(exam as any)?.feeRequired && (
                  <div>
                    <div className="text-sm text-gray-600">金额</div>
                    <div className="text-gray-900">￥{(exam as any)?.feeAmount ?? '-'}</div>
                  </div>
                )}
                {(data as any)?.paymentStatus && (
                  <div>
                    <div className="text-sm text-gray-600">支付状态</div>
                    <div className="text-gray-900">{(data as any)?.paymentStatus}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>报名截止</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">截止时间</div>
                <div className="text-gray-900">{(exam as any)?.registrationEnd || '-'}</div>
              </CardContent>
            </Card>
          </div>

          {/* 附件列表 */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>已提交材料</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray((data as any)?.payload?.attachments) && (data as any).payload.attachments.length > 0 ? (
                    (data as any).payload.attachments.map((file: any) => (
                      <div key={file.fileId || file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.fileName || file.name || (file.fileId || file.id)}</p>
                          {file.size && <p className="text-xs text-gray-500">{file.size}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              const resp: any = await apiGet(`/files/${file.fileId || file.id}/download-url`)
                              const url = resp?.previewUrl || resp?.downloadUrl || resp?.url
                              if (url) setPreviewUrl(url)
                            } catch (e) { console.error('preview file error', e) }
                          }}>
                            预览
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              const resp: any = await apiGet(`/files/${file.fileId || file.id}/download-url`)
                              const url = resp?.downloadUrl || resp?.url
                              if (url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.click() }
                            } catch (e) { console.error('download file error', e) }
                          }}>
                            下载
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">暂无材料</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 审核历史 */}
          <div className="mt-8">
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
                      <div key={h.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">
                            {h.stage === 'PRIMARY' ? '初审' : h.stage === 'SECONDARY' ? '复审' : '自动'}
                            <span className="mx-2">·</span>
                            {h.decision === 'APPROVED' ? '通过' : h.decision === 'REJECTED' ? '拒绝' : '待定'}
                          </div>
                          <div className="text-gray-900 text-sm">
                            {h.reviewerName || h.reviewerId || '—'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {h.reviewedAt || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">暂无历史</p>
                )}
              </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex">
          <div className="bg-white w-full h-full flex flex-col">
            <div className="p-2 border-b flex justify-end">
              <Button variant="outline" onClick={() => setPreviewUrl(null)}>关闭预览</Button>
            </div>
            <iframe src={previewUrl} title="attachment-preview" className="w-full flex-1" />
          </div>
        </div>
      )}

    </div>
  )
}

