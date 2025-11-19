"use client"

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner, EmptyState } from '@/components/ui/loading'
import { useApplication, useTicketByApplication, useGenerateTicket, useTicketDownload } from '@/lib/api-hooks'
import { ArrowLeft, Ticket as TicketIcon, Download, Eye, AlertTriangle, MapPin, Clock, User, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'


export default function CandidateTicketPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = (params as any)?.applicationId as string

  const { data: application, isLoading: appLoading } = useApplication(applicationId)
  const { data: ticket, isLoading, refetch } = useTicketByApplication(applicationId)
  const generate = useGenerateTicket()
  const download = useTicketDownload()

  const canGenerate = useMemo(() => {
    const status = (application as any)?.status
    return status === 'PAID' || status === 'APPROVED' // 后端将控制冲突(409)
  }, [application])

  const handleBack = () => router.push('/candidate/applications')

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync(applicationId)
      await refetch()
      alert('准考证已生成')
    } catch (e) {
      console.error('generate ticket error', e)
      alert('生成失败，请确认已完成支付或稍后重试')
    }
  }

  const handleView = () => {
    if (!ticket) return
    const url = `/api/v1/tickets/${(ticket as any).id}/view`
    window.open(url, '_blank')
  }

  const handleDownload = async () => {
    if (!ticket) return
    try {
      await download.mutateAsync((ticket as any).id)
    } catch (e) {
      console.error('download ticket error', e)
    }
  }

  if (isLoading || appLoading) {
    return (
      <DashboardLayout>
        <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
      </DashboardLayout>
    )
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> 返回我的报名
            </Button>
          </div>
          <EmptyState
            icon={<AlertTriangle className="h-12 w-12" />}
            title="尚未生成准考证"
            description="请确认已完成缴费，生成后可查看与下载"
            action={
              <Button onClick={handleGenerate} disabled={!canGenerate || generate.isPending}>
                生成准考证
              </Button>
            }
            className="py-16"
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回我的报名
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">准考证</h1>
            <p className="text-gray-600">请核对信息并提前打印或保存</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" /> 准考证信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">准考证号</div>
                <div className="text-lg font-semibold">{(ticket as any).ticketNumber}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">状态</div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> {(ticket as any).status}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">考试</div>
                <div className="text-gray-900">{(ticket as any).examTitle}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">岗位</div>
                <div className="text-gray-900">{(ticket as any).positionTitle}</div>
              </div>
            </div>

            {/* Candidate & venue */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">考生</div>
                <div className="flex items-center gap-2 text-gray-900">
                  <User className="h-4 w-4" /> {(ticket as any).candidateName}（{(ticket as any).candidateIdNumber}）
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">考场</div>
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="h-4 w-4" /> {(ticket as any).venue} {(ticket as any).room}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">座位</div>
                <div className="text-gray-900">{(ticket as any).seat}</div>
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <div className="text-sm text-gray-500">考试时间</div>
              <div className="flex items-center gap-2 text-gray-900">
                <Clock className="h-4 w-4" />
                <span>{(ticket as any).examDate} {(ticket as any).examStartTime} - {(ticket as any).examEndTime}</span>
              </div>
            </div>

            {/* Subjects */}
            {Array.isArray((ticket as any).subjects) && (ticket as any).subjects.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">考试科目</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(ticket as any).subjects.map((s: any) => (
                    <div key={s.id} className="border rounded-lg p-3 text-sm">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-gray-600">{s.startTime} - {s.endTime}（{s.duration} 分钟）</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR */}
            {(ticket as any).qrCode && (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Image src={(ticket as any).qrCode} alt="ticket-qr" width={160} height={160} className="border rounded" unoptimized />
                <div className="text-sm text-gray-600">
                  <p>• 请妥善保管准考证，现场检票时需出示</p>
                  <p>• 建议提前打印纸质版，或保存至手机相册</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {Array.isArray((ticket as any).instructions) && (ticket as any).instructions.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">考试须知</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {(ticket as any).instructions.map((line: any, idx: number) => (
                    <li key={`${String(line)}-${idx}`}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div id="ticket-actions" className="flex flex-wrap gap-3 print:hidden">
              <Button variant="secondary" onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" /> 在线查看PDF
              </Button>
              <Button variant="default" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> 下载PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </DashboardLayout>
  )
}

