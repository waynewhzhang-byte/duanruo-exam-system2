'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGetWithTenant, apiGetBlob } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Download, FileText, AlertCircle, Eye, Printer, MapPin, Clock, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RouteGuard } from '@/components/auth/RouteGuard'

interface TicketsPageProps {
  params: {
    tenantSlug: string
  }
}

interface Ticket {
  id: string
  ticketNo: string
  examTitle: string
  positionTitle: string
  venueName?: string
  roomNumber?: string
  seatNumber?: string
  examStartTime?: string
  examEndTime?: string
  candidateName?: string
  candidateIdNumber?: string
  status: string
  issuedAt?: string
  qrCode?: string
}

export default function TicketsPage({ params }: TicketsPageProps) {
  const { tenantSlug } = params
  const { tenant, isLoading: tenantLoading } = useTenant()

  const [searchTerm, setSearchTerm] = useState('')
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null)

  // Fetch my tickets - must use apiGetWithTenant because tickets are tenant-scoped
  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', 'my', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not loaded')
      return apiGetWithTenant<Ticket[]>('/tickets/my', tenant.id)
    },
    enabled: !!tenant?.id,
  })

  const isLoading = tenantLoading || ticketsLoading

  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownloadTicket = async (ticket: Ticket) => {
    if (downloadingId) return
    setDownloadingId(ticket.id)
    try {
      const blob = await apiGetBlob(`/tickets/${ticket.id}/download`, { tenantId: tenant?.id })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `准考证_${ticket.ticketNo}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '下载失败')
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePrintTicket = async (ticket: Ticket) => {
    try {
      const blob = await apiGetBlob(`/tickets/${ticket.id}/download`, { tenantId: tenant?.id })
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '打印加载失败')
    }
  }

  // Filter tickets
  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch =
      ticket.examTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.positionTitle?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Only show ISSUED tickets
  const issuedTickets = filteredTickets?.filter((t) => t.status === 'ISSUED')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return <Badge variant="default" className="bg-green-600">已发放</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return '-'
    try {
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateTimeStr
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <RouteGuard roles={['CANDIDATE', 'SUPER_ADMIN']}>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">我的准考证</h1>
          <p className="text-muted-foreground">查看和下载您的准考证</p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>搜索</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索考试名称、准考证号、岗位..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        {!issuedTickets || issuedTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>暂无准考证</AlertTitle>
                <AlertDescription>
                  您还没有已发放的准考证。请等待管理员完成座位安排并发放准考证后再查看。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issuedTickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{ticket.examTitle}</CardTitle>
                      <CardDescription>{ticket.positionTitle}</CardDescription>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">准考证号</span>
                      <p className="font-mono font-medium">{ticket.ticketNo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> 考生姓名
                      </span>
                      <p className="font-medium">{ticket.candidateName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> 考场
                      </span>
                      <p className="font-medium">{ticket.venueName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">座位号</span>
                      <p className="font-mono font-medium">{ticket.seatNumber || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 考试时间
                      </span>
                      <p className="font-medium">
                        {formatDateTime(ticket.examStartTime)}
                        {ticket.examEndTime && ` - ${formatDateTime(ticket.examEndTime)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTicket(ticket)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      预览
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTicket(ticket)}
                      disabled={downloadingId === ticket.id}
                    >
                      {downloadingId === ticket.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {downloadingId === ticket.id ? '下载中...' : '下载'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintTicket(ticket)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      打印
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewTicket} onOpenChange={() => setPreviewTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>准考证预览 - {previewTicket?.ticketNo}</DialogTitle>
            </DialogHeader>
            {previewTicket && (
              <div className="space-y-4 p-4 border rounded-lg bg-white">
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">{previewTicket.examTitle}</h2>
                  <p className="text-lg text-muted-foreground">准考证</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">准考证号：</span>
                    <span className="font-mono font-bold">{previewTicket.ticketNo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">姓名：</span>
                    <span className="font-medium">{previewTicket.candidateName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">身份证号：</span>
                    <span className="font-mono">{previewTicket.candidateIdNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">报考岗位：</span>
                    <span className="font-medium">{previewTicket.positionTitle}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">考场：</span>
                    <span className="font-medium">{previewTicket.venueName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">座位号：</span>
                    <span className="font-mono font-bold">{previewTicket.seatNumber || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">考试时间：</span>
                    <span className="font-medium">
                      {formatDateTime(previewTicket.examStartTime)}
                      {previewTicket.examEndTime && ` - ${formatDateTime(previewTicket.examEndTime)}`}
                    </span>
                  </div>
                </div>

                {previewTicket.qrCode && (
                  <div className="flex justify-center pt-4 border-t">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewTicket.qrCode} alt="QR Code" className="w-24 h-24" />
                  </div>
                )}

                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p>注意事项：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>请携带本人身份证原件参加考试</li>
                    <li>考试开始30分钟后不得入场</li>
                    <li>考试期间不得使用手机等电子设备</li>
                    <li>请提前30分钟到达考场</li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RouteGuard>
  )
}

