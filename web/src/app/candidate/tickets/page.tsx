'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Ticket, Eye, Download, Building, FileText, AlertCircle, CreditCard, MapPin, Clock } from 'lucide-react'
import { useExam, usePosition } from '@/lib/api-hooks'
import { apiGet, apiGetWithTenant } from '@/lib/api'

interface Tenant {
  id: string
  name: string
  code: string
  slug?: string
}

interface ApplicationWithTicket {
  id: string
  examId: string
  positionId: string
  status: string
  submittedAt: string | null
  examTitle?: string
  positionTitle?: string
  applicationNo?: string
  ticketNo?: string
  ticketIssuedAt?: string
  feeRequired?: boolean
  feeAmount?: number
  tenantCode?: string
  tenantSlug?: string
  venueName?: string
  roomNumber?: string
  seatNumber?: string
}

interface ApplicationListResponse {
  content: ApplicationWithTicket[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

function ExamTitle({ examId }: Readonly<{ examId: string }>) {
  const { data } = useExam(examId)
  return <div className="font-medium text-gray-900">{data?.title ?? examId}</div>
}

function PositionTitle({ positionId }: Readonly<{ positionId: string }>) {
  const { data } = usePosition(positionId)
  const name = (data as any)?.title || (data as any)?.name || positionId
  return <div className="text-gray-900">{name}</div>
}

// 可以显示准考证的状态列表（已通过审核及之后的状态）
const TICKET_ELIGIBLE_STATUSES = ['APPROVED', 'PAID', 'TICKET_ISSUED']
// 需要付费才能查看准考证的状态
const NEED_PAYMENT_STATUS = 'APPROVED'

export default function TicketsPage() {
  const router = useRouter()
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  // 获取用户关联的租户列表
  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => apiGet<Tenant[]>('/tenants/me'),
  })

  // 自动选择第一个租户
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

  // 获取当前考生的所有准考证（需要租户上下文）
  const { data: tickets, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: ['tickets', 'my', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) throw new Error('No tenant selected')
      // 使用带租户的API调用
      return apiGetWithTenant<any[]>('/tickets/my', selectedTenantId)
    },
    enabled: !!selectedTenantId,
  })

  // 获取当前租户下的报名（用于显示状态和缴费信息）
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery<ApplicationListResponse>({
    queryKey: ['applications', 'tickets', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) throw new Error('No tenant selected')
      return apiGetWithTenant<ApplicationListResponse>(`/applications/my?size=100`, selectedTenantId)
    },
    enabled: !!selectedTenantId,
  })

  // 构建报名ID到报名信息的映射
  const applicationMap = new Map<string, ApplicationWithTicket>()
  applicationsData?.content?.forEach(app => {
    applicationMap.set(app.id, app)
  })

  // 合并准考证和报名信息
  const ticketsWithApplications = (tickets || []).map(ticket => {
    const application = applicationMap.get(ticket.applicationId)
    return {
      ...ticket,
      application: application,
      examTitle: ticket.examTitle || application?.examTitle,
      positionTitle: ticket.positionTitle || application?.positionTitle,
      status: application?.status || 'TICKET_ISSUED',
      feeRequired: application?.feeRequired,
      feeAmount: application?.feeAmount,
      tenantSlug: application?.tenantSlug,
    }
  })

  const isLoading = ticketsLoading || applicationsLoading

  // 根据状态和费用获取状态徽章
  const getStatusBadge = (app: ApplicationWithTicket) => {
    const status = app.status
    const feeAmount = app.feeAmount ?? 0

    if (status === 'TICKET_ISSUED') {
      return <Badge variant="default" className="bg-green-500">已发证</Badge>
    }
    if (status === 'PAID') {
      return <Badge variant="default" className="bg-blue-500">待生成准考证</Badge>
    }
    if (status === 'APPROVED') {
      if (feeAmount > 0) {
        return <Badge variant="outline" className="border-orange-500 text-orange-600">待缴费</Badge>
      } else {
        return <Badge variant="default" className="bg-blue-500">待生成准考证</Badge>
      }
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  const handleViewTicket = (applicationId: string) => {
    router.push(`/candidate/tickets/${applicationId}`)
  }

  const handlePayment = (applicationId: string, tenantSlug: string) => {
    router.push(`/${tenantSlug}/candidate/applications/${applicationId}/payment`)
  }

  // 检查是否需要付费（收费考试 + 审核通过状态）
  const needsPayment = (app: ApplicationWithTicket) => {
    // 使用 feeRequired 或回退到 feeAmount > 0
    const isFeeRequired = app.feeRequired ?? (app.feeAmount ?? 0) > 0
    return app.status === NEED_PAYMENT_STATUS && isFeeRequired
  }

  // 检查是否免费考试已通过审核
  const isFreeApproved = (app: ApplicationWithTicket) => {
    // 免费考试：feeRequired 为 false 或 feeAmount 为 0
    const isFreeExam = app.feeRequired === false || (app.feeAmount ?? 0) === 0
    return app.status === NEED_PAYMENT_STATUS && isFreeExam
  }

  // 检查是否可以查看准考证（已付费或已发证，或免费考试已通过）
  const canViewTicket = (app: ApplicationWithTicket) => {
    return app.status === 'PAID' || app.status === 'TICKET_ISSUED'
  }

  const selectedTenant = tenants?.find(t => t.id === selectedTenantId)

  // 加载状态
  if (tenantsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    )
  }

  // 无租户
  if (!tenants || tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">暂无关联租户</h3>
        <p className="text-gray-500 mt-1">您尚未在任何考试机构报名</p>
        <Button className="mt-4" onClick={() => router.push('/candidate/exams')}>
          <FileText className="mr-2 h-4 w-4" />浏览可报名的考试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和租户选择 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">准考证管理</h1>
          <p className="text-gray-500 mt-1">查看和下载您的准考证</p>
        </div>
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-w-[200px]"
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
          >
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 当前租户信息卡片 */}
      {selectedTenant && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Building className="h-4 w-4" />
              <span className="font-medium">当前查看：{selectedTenant.name}</span>
              <span className="text-blue-500 text-sm">（{selectedTenant.code || selectedTenant.slug}）</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 准考证列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            准考证列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : ticketsWithApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">暂无可查看的准考证</h3>
              <p className="text-gray-500 mt-1 max-w-md">
                只有审核通过、已缴费或已发证的报名才能查看准考证。
                请先完成报名流程。
              </p>
              <Button className="mt-4" variant="outline" onClick={() => router.push('/candidate/applications')}>
                查看我的报名
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>考试名称</TableHead>
                  <TableHead>报考岗位</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>准考证号</TableHead>
                  <TableHead>座位安排</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsWithApplications.map((ticket) => {
                  const application = ticket.application
                  const applicationId = ticket.applicationId
                  return (
                  <TableRow key={ticket.id || applicationId} className={application && needsPayment(application) ? 'bg-yellow-50' : ''}>
                    <TableCell>
                      {ticket.examTitle ? (
                        <div className="font-medium">{ticket.examTitle}</div>
                      ) : application ? (
                        <ExamTitle examId={application.examId} />
                      ) : (
                        <span className="text-gray-400">未知考试</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ticket.positionTitle ? (
                        <div>{ticket.positionTitle}</div>
                      ) : application ? (
                        <PositionTitle positionId={application.positionId} />
                      ) : (
                        <span className="text-gray-400">未知岗位</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {application ? getStatusBadge(application) : (
                          <Badge variant="default" className="bg-green-500">已发证</Badge>
                        )}
                        {application && needsPayment(application) && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            需缴费 ¥{(application.feeAmount ?? 0).toFixed(2)}
                          </span>
                        )}
                        {application && isFreeApproved(application) && (
                          <span className="text-xs text-green-600">免费考试 · 等待生成</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {ticket.ticketNo || '待生成'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ticket.venueName || ticket.roomNumber || ticket.seatNumber ? (
                        <div className="text-sm space-y-1">
                          {ticket.venueName && (
                            <div className="flex items-center gap-1 text-gray-700">
                              <MapPin className="h-3 w-3" />
                              {ticket.venueName}
                            </div>
                          )}
                          {(ticket.roomNumber || ticket.seatNumber) && (
                            <div className="text-gray-500">
                              {ticket.roomNumber && `教室: ${ticket.roomNumber}`}
                              {ticket.roomNumber && ticket.seatNumber && ' / '}
                              {ticket.seatNumber && `座位: ${ticket.seatNumber}`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">待安排</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {application && needsPayment(application) ? (
                          // 收费考试待缴费 - 显示去缴费按钮
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={() => handlePayment(application.id, ticket.tenantSlug || selectedTenant?.slug || selectedTenant?.code || '')}
                          >
                            <CreditCard className="mr-1 h-4 w-4" />
                            去缴费
                          </Button>
                        ) : ticket.ticketNo ? (
                          // 已发证 - 可以查看/下载准考证
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTicket(applicationId)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              查看
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                if (ticket.id && selectedTenantId) {
                                  try {
                                    // 使用fetch API获取PDF，传递租户ID
                                    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
                                    const response = await fetch(`/api/v1/tickets/${ticket.id}/download`, {
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'X-Tenant-ID': selectedTenantId,
                                      },
                                      credentials: 'include',
                                    })
                                    
                                    if (!response.ok) {
                                      throw new Error('下载失败')
                                    }
                                    
                                    const blob = await response.blob()
                                    const url = window.URL.createObjectURL(blob)
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.download = `ticket_${ticket.id}.pdf`
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                    window.URL.revokeObjectURL(url)
                                  } catch (error) {
                                    console.error('Download error:', error)
                                    alert('下载失败，请重试')
                                  }
                                } else {
                                  handleViewTicket(applicationId)
                                }
                              }}
                            >
                              <Download className="mr-1 h-4 w-4" />
                              下载
                            </Button>
                          </>
                        ) : (
                          // 等待生成准考证
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                          >
                            <Clock className="mr-1 h-4 w-4" />
                            等待生成
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

