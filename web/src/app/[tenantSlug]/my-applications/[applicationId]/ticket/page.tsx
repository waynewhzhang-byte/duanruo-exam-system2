'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Download, Printer, MapPin, Calendar, Clock, User, FileText, Info } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Ticket {
  id: string
  ticketNumber: string
  applicationId: string
  candidateName: string
  idNumber: string
  examTitle: string
  examCode: string
  positionTitle: string
  venueName: string
  venueAddress: string
  seatNumber: number
  examDate: string
  examStartTime: string
  examEndTime: string
  issuedAt: string
}

export default function AdmissionTicketPage() {
  const params = useParams()
  const applicationId = params.applicationId as string
  const tenantSlug = params.tenantSlug as string
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useTenant()

  // Fetch ticket
  const { data: ticket, isLoading: ticketLoading, error } = useQuery<Ticket>({
    queryKey: ['ticket', applicationId],
    queryFn: async () => {
      return apiGet<Ticket>(`/tickets/application/${applicationId}`)
    },
    enabled: !!applicationId,
  })

  const isLoading = tenantLoading || ticketLoading

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: 生成PDF下载
    // 可以使用 jsPDF 或者调用后端API生成PDF
    alert('PDF下载功能开发中')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>准考证未生成</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>可能的原因：</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>报名审核尚未通过</li>
                  <li>报名费尚未缴纳</li>
                  <li>考场座位尚未分配</li>
                  <li>准考证尚未生成</li>
                </ul>
                <p className="mt-3">
                  请联系管理员或等待系统自动生成准考证。
                </p>
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push(`/${tenantSlug}/my-applications/${applicationId}`)}>
              返回报名详情
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar - Hidden when printing */}
      <div className="print:hidden bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.push(`/${tenantSlug}/my-applications/${applicationId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                下载PDF
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                打印准考证
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Content */}
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          {/* Print Instructions - Hidden when printing */}
          <Alert className="mb-6 print:hidden">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>打印提示：</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>请使用A4纸张打印</li>
                <li>建议使用彩色打印以便识别</li>
                <li>打印前请检查打印机设置</li>
                <li>考试当天请携带准考证和身份证</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Admission Ticket */}
          <Card className="bg-white shadow-lg print:shadow-none">
            <CardHeader className="text-center border-b-2 border-primary pb-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{ticket.examTitle}</h1>
                <h2 className="text-xl text-muted-foreground">准考证</h2>
                <p className="text-sm text-muted-foreground">Admission Ticket</p>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Candidate Info */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">考生信息</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">姓名</p>
                          <p className="font-semibold text-lg">{ticket.candidateName}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">身份证号</p>
                          <p className="font-mono">{ticket.idNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">准考证号</p>
                          <p className="font-mono font-semibold text-lg text-primary">{ticket.ticketNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">报考岗位</p>
                          <p className="font-medium">{ticket.positionTitle}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo Placeholder */}
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <div className="w-32 h-40 mx-auto bg-gray-100 rounded flex items-center justify-center">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">考生照片</p>
                  </div>
                </div>

                {/* Right Column - Exam Info */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">考试信息</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">考试日期</p>
                          <p className="font-semibold text-lg">{formatDate(ticket.examDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">考试时间</p>
                          <p className="font-semibold">
                            {formatTime(ticket.examStartTime)} - {formatTime(ticket.examEndTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">考场</p>
                          <p className="font-semibold">{ticket.venueName}</p>
                          <p className="text-sm text-muted-foreground mt-1">{ticket.venueAddress}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">座位号</p>
                          <p className="font-bold text-2xl text-primary">{ticket.seatNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">重要提示</h4>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>• 请提前30分钟到达考场</li>
                      <li>• 必须携带本人身份证原件</li>
                      <li>• 禁止携带手机等电子设备</li>
                      <li>• 迟到15分钟不得入场</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                <p>发证时间: {formatDate(ticket.issuedAt)}</p>
                <p className="mt-2">请妥善保管此准考证，考试当天凭准考证和身份证入场</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}

