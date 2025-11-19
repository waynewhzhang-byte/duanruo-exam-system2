'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner, EmptyState } from '@/components/ui/loading'
import { useApplication, useReviewTaskHeartbeat, useReviewTaskDecision, useReviewHistory } from '@/lib/api-hooks'
import { apiGet } from '@/lib/api'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import {
  ArrowLeft,
  User,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  AlertTriangle
} from 'lucide-react'

interface ReviewDecision {
  decision: 'APPROVE' | 'REJECT'
  comments: string
  stage: 'PRIMARY' | 'SECONDARY'
}

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const applicationId = params.id as string
  const taskId = useMemo(() => (searchParams?.get('taskId') || ''), [searchParams])
  const errorHandler = useErrorHandler()

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [stageFilter, setStageFilter] = useState<'ALL'|'PRIMARY'|'SECONDARY'|'AUTO'>('ALL')
  const [sortOrder, setSortOrder] = useState<'DESC'|'ASC'>('DESC')

  const [keyword, setKeyword] = useState('')


  const {
    data: application,
    isLoading,
    error
  } = useApplication(applicationId)

  const heartbeat = useReviewTaskHeartbeat()
  const reviewMutation = useReviewTaskDecision()

  if (error) {
    errorHandler.handleError(error)
  }

  const { data: reviewHistoryData, isLoading: historyLoading } = useReviewHistory(applicationId)

  const historyItems: any[] = useMemo(() => {
    if (Array.isArray((reviewHistoryData as any)?.content)) {
      return (reviewHistoryData as any).content
    }
    if (Array.isArray(reviewHistoryData)) {
      return reviewHistoryData as any[]
    }
    return []
  }, [reviewHistoryData])

  const displayedHistory = useMemo(() => {
    const list = Array.isArray(historyItems) ? [...historyItems] : []
    let filtered = stageFilter === 'ALL' ? list : list.filter((x:any)=>x?.stage===stageFilter)
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      filtered = filtered.filter((x:any)=> (x?.comment||'').toLowerCase().includes(kw) || (x?.reviewerName||'').toLowerCase().includes(kw))
    }
    filtered.sort((a:any,b:any)=>{
      const ta = a?.reviewedAt ? Date.parse(a.reviewedAt) : 0
      const tb = b?.reviewedAt ? Date.parse(b.reviewedAt) : 0
      return sortOrder === 'DESC' ? (tb - ta) : (ta - tb)
    })
    return filtered
  }, [historyItems, stageFilter, sortOrder, keyword])

  const handleBack = () => {
    router.push('/reviewer/queue')
  }

  const handleStartReview = () => {
    setShowReviewForm(true)
  }

  const handleSubmitReview = async () => {
    if (!reviewDecision || !reviewComments.trim()) {

      alert('请选择审核结果并填写审核意见')
      return
    }
    if (!taskId) {
      alert('缺少任务ID，无法提交审核决策')
      return
    }

    setIsSubmittingReview(true)
    try {
      await reviewMutation.mutateAsync({
        taskId,
        decision: reviewDecision,
        comment: reviewComments,
      } as any)

      alert('审核提交成功')
      router.push('/reviewer/queue')
    } catch (error) {
      console.error('Review submission error:', error)
      alert('审核提交失败，请重试')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleFileDownload = async (fileId: string) => {
    try {
      const resp: any = await apiGet(`/files/${fileId}/download-url`)
      const url = resp?.downloadUrl || resp?.url || null
      if (url) {
        window.open(url, '_blank')
      }
    } catch (e) {
      console.error('Download file error:', e)
    }
  }

  const handleFilePreview = async (fileId: string, fileName: string) => {
    try {
      const resp: any = await apiGet(`/files/${fileId}/download-url`)


      const url = resp?.previewUrl || resp?.downloadUrl || resp?.url || null
      if (url) setPreviewUrl(url)
    } catch (e) {
      console.error('Preview file error:', e)
    }
  }

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'SUBMITTED': return 'secondary'
      case 'PENDING_PRIMARY_REVIEW': return 'secondary'
      case 'PENDING_SECONDARY_REVIEW': return 'secondary'
      case 'APPROVED': return 'default'
      case 'REJECTED': return 'destructive'
      case 'AUTO_PASSED': return 'default'
      case 'AUTO_REJECTED': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return '已提交'
      case 'PENDING_PRIMARY_REVIEW': return '待一级审核'
      case 'PENDING_SECONDARY_REVIEW': return '待复核'
      case 'APPROVED': return '审核通过'
      case 'REJECTED': return '审核拒绝'
      case 'AUTO_PASSED': return '自动通过'
      case 'AUTO_REJECTED': return '自动拒绝'
      default: return status
    }

  }

  const handleExportCsv = () => {
    try {
      const headers = ['ID','阶段','结果','审核人','时间','备注']
      const rows = (displayedHistory as any[]).map((r:any)=>[
        r.id,
        r.stage,
        r.decision,
        r.reviewerName || '',
        r.reviewedAt || '',
        (r.comment || '').toString().replace(/\n/g,' ')
      ])
      const csv = [headers, ...rows]
        .map(row => row.map((f:any)=>`"${String(f ?? '').replace(/"/g,'""')}"`).join(','))
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `review-history-${applicationId}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export CSV error:', e)
    }
  }


  useEffect(() => {
    if (!taskId) return
    // fire immediately once
    heartbeat.mutate({ taskId })
    const t = setInterval(() => {
      heartbeat.mutate({ taskId })
    }, 15000)
    return () => clearInterval(t)
  }, [taskId, heartbeat])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回队列
            </Button>
          </div>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!application) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title="申请不存在"
          description="未找到指定的申请信息"
          action={
            <Button onClick={handleBack}>
              返回队列
            </Button>
          }
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回队列
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">申请详情</h1>
              <p className="text-gray-600">申请编号: {application.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getStatusColor(application.status)}>
              {getStatusText(application.status)}
            </Badge>
            {!showReviewForm && application.status === 'PENDING_PRIMARY_REVIEW' && (
              <Button onClick={handleStartReview}>
                开始审核
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.payload && Object.keys(application.payload).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(application.payload).map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <label className="text-sm font-medium text-gray-700 break-words">{key}</label>
                        <p className="text-gray-900 break-words text-sm">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">暂无表单数据</p>
                )}
              </CardContent>
            </Card>

            {/* Education Background */}
            <Card>
              <CardHeader>
                <CardTitle>教育背景</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">学校</label>
                        <p className="text-gray-900">清华大学</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">专业</label>
                        <p className="text-gray-900">计算机科学与技术</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">学历</label>
                        <p className="text-gray-900">本科</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">毕业时间</label>
                        <p className="text-gray-900">2015-06</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card>
              <CardHeader>
                <CardTitle>工作经历</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">公司</label>
                        <p className="text-gray-900">阿里巴巴</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">职位</label>
                        <p className="text-gray-900">高级前端工程师</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">工作时间</label>
                        <p className="text-gray-900">2018-03 至 2023-12</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">工作描述</label>
                        <p className="text-gray-900">负责前端架构设计和团队管理</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Exam and Position Info */}
            <Card>
              <CardHeader>
                <CardTitle>考试信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">考试名称</label>
                  <p className="text-gray-900">软件工程师 - 初级</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">报考岗位</label>
                  <p className="text-gray-900">前端开发工程师</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">提交时间</label>
                  <p className="text-gray-900">2024-01-15 14:30:00</p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  附件文件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray((application.payload as any)?.attachments) && (application.payload as any).attachments.length > 0 ? (
                    (application.payload as any).attachments.map((file: any) => (
                      <div key={file.fileId || file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.fileName || file.name || (file.fileId || file.id)}</p>
                          {file.size && <p className="text-xs text-gray-500">{file.size}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleFilePreview(file.fileId || file.id, file.fileName || file.name)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleFileDownload(file.fileId || file.id)}>
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">暂无附件</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Review History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  审核历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!historyLoading && (
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <div className="flex gap-2">
                      <select
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        value={stageFilter}
                        onChange={(e)=>setStageFilter(e.target.value as any)}
                      >
                        <option value="ALL">全部阶段</option>
                        <option value="PRIMARY">初审</option>
                        <option value="SECONDARY">复审</option>
                        <option value="AUTO">自动审核</option>
                      </select>
                      <select
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        value={sortOrder}
                        onChange={(e)=>setSortOrder(e.target.value as any)}
                      >
                        <option value="DESC">时间倒序</option>
                        <option value="ASC">时间正序</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e)=>setKeyword(e.target.value)}
                        placeholder="搜索备注/审核人"
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-48"
                      />
                      <Button variant="outline" onClick={handleExportCsv}>导出 CSV</Button>
                    </div>
                  </div>
                )}

                {historyLoading ? (
                  <div className="py-8 flex justify-center"><Spinner /></div>
                ) : (
                  displayedHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无历史</p>
                  ) : (
                    <div className="space-y-4">
                      {displayedHistory.map((review: any) => (
                        <div key={review.id} className="border-l-4 border-blue-200 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {review.stage === 'PRIMARY' ? '初审' : review.stage === 'SECONDARY' ? '复审' : review.stage === 'AUTO' ? '自动审核' : (review.stage || '—')}
                            </span>
                            {review.decision === 'APPROVED' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {review.decision === 'REJECTED' && <XCircle className="h-4 w-4 text-red-500" />}
                            {review.decision === 'PENDING' && <Clock className="h-4 w-4 text-yellow-500" />}
                          </div>
                          <p className="text-xs text-gray-600">审核人: {review.reviewerName || '—'}</p>
                          {review.reviewedAt && (
                            <p className="text-xs text-gray-600">时间: {review.reviewedAt}</p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Review Form */}
            {showReviewForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    审核决策
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">审核结果</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="decision"
                          value="APPROVE"
                          checked={reviewDecision === 'APPROVE'}
                          onChange={(e) => setReviewDecision(e.target.value as 'APPROVE')}
                          className="text-green-600"
                        />
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>通过</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="decision"
                          value="REJECT"
                          checked={reviewDecision === 'REJECT'}
                          onChange={(e) => setReviewDecision(e.target.value as 'REJECT')}
                          className="text-red-600"
                        />
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>拒绝</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">审核意见</label>
                    <textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="请填写审核意见..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || !reviewDecision || !reviewComments.trim()}
                      className="flex-1"
                    >
                      {isSubmittingReview ? <Spinner size="sm" /> : '提交审核'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                      disabled={isSubmittingReview}
                    >
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex">
          <div className="bg-white w-full h-full flex flex-col">
            <div className="p-2 border-b flex justify-end">
              <Button variant="outline" onClick={()=>setPreviewUrl(null)}>关闭预览</Button>
            </div>
            <iframe src={previewUrl} className="w-full flex-1" />
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
