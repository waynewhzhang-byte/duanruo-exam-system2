'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant, apiPost } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Download, Send, Search, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

interface TicketsPageProps {
  params: Promise<{
    tenantSlug: string
    examId: string
  }>
}

interface Exam {
  id: string
  title: string
  status: string
}

interface Ticket {
  id: string
  ticketNo: string
  candidateName: string
  positionTitle: string
  venueName: string
  roomName: string
  seatNo: string
  examDate: string
  examTime: string
  isPublished: boolean
  pdfUrl?: string
  applicationId: string
}

export default function TicketsPage({ params }: TicketsPageProps) {
  const { tenantSlug, examId } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { tenant } = useTenant()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)

  // Fetch exam details
  const { data: exam } = useQuery<Exam>({
    queryKey: ['exam', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Exam>(`/exams/${examId}`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch tickets
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Ticket[]>(`/exams/${examId}/tickets`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Batch generate mutation
  const batchGenerateMutation = useMutation({
    mutationFn: async () => {
      return apiPost(`/exams/${examId}/tickets/batch-generate`, {})
    },
    onSuccess: () => {
      toast.success('准考证批量生成成功')
      queryClient.invalidateQueries({ queryKey: ['tickets', examId] })
    },
    onError: (error: any) => {
      toast.error(error?.message || '准考证批量生成失败')
    },
  })

  // Batch publish mutation
  const batchPublishMutation = useMutation({
    mutationFn: async (ticketIds: string[]) => {
      return apiPost(`/tickets/batch-publish`, { ticketIds })
    },
    onSuccess: () => {
      toast.success('准考证批量发布成功')
      queryClient.invalidateQueries({ queryKey: ['tickets', examId] })
      setSelectedTickets([])
      setIsPublishDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || '准考证批量发布失败')
    },
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(filteredTickets?.map((t) => t.id) || [])
    } else {
      setSelectedTickets([])
    }
  }

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId])
    } else {
      setSelectedTickets(selectedTickets.filter((id) => id !== ticketId))
    }
  }

  const handleBatchPublish = () => {
    if (selectedTickets.length === 0) {
      toast.error('请选择要发布的准考证')
      return
    }
    setIsPublishDialogOpen(true)
  }

  const confirmBatchPublish = () => {
    batchPublishMutation.mutate(selectedTickets)
  }

  const handleDownloadTicket = (ticket: Ticket) => {
    if (!ticket.pdfUrl) {
      toast.error('准考证PDF未生成')
      return
    }

    // Download PDF
    const link = document.createElement('a')
    link.href = ticket.pdfUrl
    link.download = `准考证_${ticket.ticketNo}.pdf`
    link.click()

    toast.success('准考证下载成功')
  }

  // Filter tickets
  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch =
      ticket.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.positionTitle.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Statistics
  const totalTickets = tickets?.length || 0
  const publishedTickets = tickets?.filter((t) => t.isPublished).length || 0
  const unpublishedTickets = totalTickets - publishedTickets

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回考试详情
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">准考证管理</h1>
          <p className="text-muted-foreground">{exam?.title}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => batchGenerateMutation.mutate()}
            disabled={batchGenerateMutation.isPending}
          >
            <FileText className="h-4 w-4 mr-2" />
            {batchGenerateMutation.isPending ? '生成中...' : '批量生成'}
          </Button>
          <Button
            onClick={handleBatchPublish}
            disabled={selectedTickets.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            批量发布 ({selectedTickets.length})
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总准考证数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发布</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未发布</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unpublishedTickets}</div>
          </CardContent>
        </Card>
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
              placeholder="搜索考生姓名、准考证号、岗位..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>准考证列表</CardTitle>
          <CardDescription>共 {filteredTickets?.length || 0} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {!filteredTickets || filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">暂无准考证数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTickets.length === filteredTickets.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>准考证号</TableHead>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>考场</TableHead>
                    <TableHead>教室</TableHead>
                    <TableHead>座位号</TableHead>
                    <TableHead>考试时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTickets.includes(ticket.id)}
                          onCheckedChange={(checked) =>
                            handleSelectTicket(ticket.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono">{ticket.ticketNo}</TableCell>
                      <TableCell className="font-medium">{ticket.candidateName}</TableCell>
                      <TableCell>{ticket.positionTitle}</TableCell>
                      <TableCell>{ticket.venueName}</TableCell>
                      <TableCell>{ticket.roomName}</TableCell>
                      <TableCell className="font-mono">{ticket.seatNo}</TableCell>
                      <TableCell>
                        {ticket.examDate} {ticket.examTime}
                      </TableCell>
                      <TableCell>
                        {ticket.isPublished ? (
                          <Badge variant="default" className="bg-green-600">
                            已发布
                          </Badge>
                        ) : (
                          <Badge variant="secondary">未发布</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadTicket(ticket)}
                          disabled={!ticket.pdfUrl}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish Confirmation Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认批量发布</DialogTitle>
            <DialogDescription>
              您确定要发布选中的 {selectedTickets.length} 张准考证吗？
              <br />
              发布后，考生将能够查看和下载准考证。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={confirmBatchPublish}
              disabled={batchPublishMutation.isPending}
            >
              {batchPublishMutation.isPending ? '发布中...' : '确认发布'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

