'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Download, FileText, AlertCircle, Eye, Printer } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import dynamic from 'next/dynamic'

const PDFViewer = dynamic(() => import('react-pdf').then((mod) => mod.Document), { ssr: false })
const PDFPage = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false })

interface TicketsPageProps {
  params: Promise<{
    tenantSlug: string
  }>
}

interface Ticket {
  id: string
  ticketNo: string
  examTitle: string
  positionTitle: string
  venueName: string
  roomName: string
  seatNo: string
  examDate: string
  examTime: string
  isPublished: boolean
  pdfUrl?: string
  qrCode?: string
}

export default function TicketsPage({ params }: TicketsPageProps) {
  const { tenantSlug } = use(params)
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState('')
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null)
  const [numPages, setNumPages] = useState<number>(0)

  // Fetch my tickets
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', 'my'],
    queryFn: async () => {
      return apiGet<Ticket[]>('/tickets/my')
    },
  })

  const handleDownloadTicket = (ticket: Ticket) => {
    if (!ticket.pdfUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = ticket.pdfUrl
    link.download = `准考证_${ticket.ticketNo}.pdf`
    link.click()
  }

  const handlePrintTicket = (ticket: Ticket) => {
    if (!ticket.pdfUrl) {
      return
    }

    const printWindow = window.open(ticket.pdfUrl, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  // Filter tickets
  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch =
      ticket.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.positionTitle.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Published tickets
  const publishedTickets = filteredTickets?.filter((t) => t.isPublished)

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
      {!publishedTickets || publishedTickets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>暂无准考证</AlertTitle>
              <AlertDescription>
                您还没有已发布的准考证。请等待管理员发布准考证后再查看。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publishedTickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{ticket.examTitle}</CardTitle>
                    <CardDescription>{ticket.positionTitle}</CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    已发布
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">准考证号</span>
                    <p className="font-mono font-medium">{ticket.ticketNo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">考场</span>
                    <p className="font-medium">{ticket.venueName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">教室</span>
                    <p className="font-medium">{ticket.roomName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">座位号</span>
                    <p className="font-mono font-medium">{ticket.seatNo}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">考试时间</span>
                    <p className="font-medium">
                      {ticket.examDate} {ticket.examTime}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTicket(ticket)}
                    disabled={!ticket.pdfUrl}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    预览
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadTicket(ticket)}
                    disabled={!ticket.pdfUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintTicket(ticket)}
                    disabled={!ticket.pdfUrl}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>准考证预览 - {previewTicket?.ticketNo}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {previewTicket?.pdfUrl ? (
              <PDFViewer
                file={previewTicket.pdfUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <PDFPage key={`page_${index + 1}`} pageNumber={index + 1} />
                ))}
              </PDFViewer>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">PDF未生成</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

