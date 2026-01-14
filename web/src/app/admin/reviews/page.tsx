'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGetWithTenant } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Search, Filter, Calendar, User, CheckCircle2, XCircle, RotateCcw, Clock } from 'lucide-react'

interface ReviewAuditRecord {
  id: string
  applicationId: string
  candidateName: string
  examId: string
  examTitle: string
  positionId: string
  positionTitle: string
  reviewerId: string
  reviewerName: string
  reviewerUsername: string
  stage: string
  stageLabel: string
  decision: string
  decisionLabel: string
  comment: string
  reviewedAt: string
  createdAt: string
}

interface TenantInfo {
  id: string
  name: string
  code: string
  slug: string
}

export default function ReviewAuditPage() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [stage, setStage] = useState<string>('')
  const [decision, setDecision] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all')

  // 获取用户关联的租户列表
  const { data: tenants = [] } = useQuery<TenantInfo[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/v1/tenants/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) return []
      return res.json()
    }
  })

  // 自动选择第一个租户
  const currentTenantId = selectedTenantId || (tenants.length > 0 ? tenants[0].id : '')
  const currentTenant = tenants.find(t => t.id === currentTenantId)

  // 构建查询参数
  const buildQueryParams = () => {
    const params = new URLSearchParams()
    if (stage) params.append('stage', stage)
    if (decision) params.append('decision', decision)
    if (startDate) params.append('startDate', `${startDate} 00:00:00`)
    if (endDate) params.append('endDate', `${endDate} 23:59:59`)
    return params.toString()
  }

  // 获取审核记录
  const { data: records = [], isLoading, refetch } = useQuery<ReviewAuditRecord[]>({
    queryKey: ['review-audit', currentTenantId, viewMode, stage, decision, startDate, endDate],
    queryFn: async () => {
      if (!currentTenantId) return []
      const endpoint = viewMode === 'all' ? '/reviews/audit/all' : '/reviews/audit/my'
      const queryStr = buildQueryParams()
      const url = queryStr ? `${endpoint}?${queryStr}` : endpoint
      return apiGetWithTenant<ReviewAuditRecord[]>(url, currentTenantId)
    },
    enabled: !!currentTenantId
  })

  // 获取审核员统计
  const { data: stats } = useQuery<{ totalReviews: number; approvedCount: number; rejectedCount: number; approvalRate: number }>({
    queryKey: ['review-audit-stats', currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return { totalReviews: 0, approvedCount: 0, rejectedCount: 0, approvalRate: 0 }
      return apiGetWithTenant('/reviews/audit/stats', currentTenantId)
    },
    enabled: !!currentTenantId
  })

  const getDecisionBadge = (decision: string, label: string) => {
    switch (decision?.toUpperCase()) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />{label}</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />{label}</Badge>
      case 'RETURNED':
        return <Badge className="bg-yellow-100 text-yellow-800"><RotateCcw className="w-3 h-3 mr-1" />{label}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />{label || '待审核'}</Badge>
    }
  }

  const getStageBadge = (stage: string, label: string) => {
    switch (stage?.toUpperCase()) {
      case 'PRIMARY':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">{label}</Badge>
      case 'SECONDARY':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">{label}</Badge>
      default:
        return <Badge variant="outline">{label || stage}</Badge>
    }
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            审核记录审计
          </h1>
          <p className="text-gray-600 mt-1">查看审核员的审核历史记录，支持按阶段、决策、时间筛选</p>
        </div>
        {tenants.length > 1 && (
          <Select value={currentTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择租户" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">总审核数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">通过数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">拒绝数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejectedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">通过率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.approvalRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">查看模式</label>
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'my')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有审核记录</SelectItem>
                  <SelectItem value="my">我的审核记录</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">审核阶段</label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value="PRIMARY">初审</SelectItem>
                  <SelectItem value="SECONDARY">复审</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">审核决策</label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value="APPROVED">通过</SelectItem>
                  <SelectItem value="REJECTED">拒绝</SelectItem>
                  <SelectItem value="RETURNED">退回修改</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">开始日期</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">结束日期</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => refetch()} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              查询
            </Button>
            <Button variant="outline" onClick={() => {
              setStage('')
              setDecision('')
              setStartDate('')
              setEndDate('')
            }}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 审核记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            审核记录列表
            {currentTenant && <span className="text-sm font-normal text-gray-500 ml-2">（{currentTenant.name}）</span>}
          </CardTitle>
          <CardDescription>共 {records.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无审核记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>考试</TableHead>
                  <TableHead>岗位</TableHead>
                  <TableHead>考生</TableHead>
                  <TableHead>审核员</TableHead>
                  <TableHead>阶段</TableHead>
                  <TableHead>决策</TableHead>
                  <TableHead>审核意见</TableHead>
                  <TableHead>审核时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.examTitle}</TableCell>
                    <TableCell>{record.positionTitle}</TableCell>
                    <TableCell>{record.candidateName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        {record.reviewerName}
                      </div>
                    </TableCell>
                    <TableCell>{getStageBadge(record.stage, record.stageLabel)}</TableCell>
                    <TableCell>{getDecisionBadge(record.decision, record.decisionLabel)}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={record.comment}>
                      {record.comment || '-'}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDateTime(record.reviewedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

