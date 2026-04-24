"use client"

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner, EmptyState } from '@/components/ui/loading'
import { useApplication, useTicketByApplication, useGenerateTicket, useTicketDownload } from '@/lib/api-hooks'
import { apiGet } from '@/lib/api'
import { parseTenantListResponse } from '@/lib/schemas'
import type { TenantListResponseType } from '@/lib/schemas'
import { ArrowLeft, Ticket as TicketIcon, Download, Eye, AlertTriangle, MapPin, Clock, User, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

export default function CandidateTicketPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = String(params?.applicationId ?? '')
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  const { data: tenantResponse } = useQuery<TenantListResponseType>({
    queryKey: ['my-tenants'],
    queryFn: async () => parseTenantListResponse(await apiGet('/tenants/me')),
  })

  useEffect(() => {
    const tenants = tenantResponse?.content ?? []
    if (tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenantResponse, selectedTenantId])

  const { data: application, isLoading: appLoading } = useApplication(applicationId)
  const { data: ticket, isLoading, refetch } = useTicketByApplication(applicationId)
  const generate = useGenerateTicket()
  const download = useTicketDownload()

  const canGenerate = useMemo(() => {
    const status = application?.status
    return status === 'PAID' || status === 'APPROVED'
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

  const handleView = async () => {
    if (!ticket || !selectedTenantId) return
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const response = await fetch(`/api/v1/tickets/${ticket.id}/view`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'X-Tenant-ID': selectedTenantId,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('查看失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('View error:', error)
      alert('查看失败，请重试')
    }
  }

  const handleDownload = async () => {
    if (!ticket || !selectedTenantId) return
    try {
      await download.mutateAsync({ ticketId: ticket.id, tenantId: selectedTenantId })
    } catch (e) {
      console.error('download ticket error', e)
      alert('下载失败，请重试')
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

  const venueDisplay = ticket.venue || '待安排'
  const roomDisplay = ticket.room || '待安排'
  const seatDisplay = ticket.seat || '待安排'
  const hasVenue = !!ticket.venue

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">准考证号</div>
                <div className="text-lg font-semibold">{ticket.ticketNumber}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">状态</div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> {ticket.status}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">考试</div>
                <div className="text-gray-900">{ticket.examTitle}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">岗位</div>
                <div className="text-gray-900">{ticket.positionTitle}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-500">考生信息</div>
              <div className="flex items-center gap-2 text-gray-900">
                <User className="h-4 w-4" /> {ticket.candidateName}（{ticket.candidateIdNumber}）
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                座位安排
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">考场地点</div>
                  <div className="font-semibold text-gray-900">{venueDisplay}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">教室/考场</div>
                  <div className="font-semibold text-gray-900">{roomDisplay}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">座位号</div>
                  <div className="font-semibold text-xl text-blue-600">{seatDisplay}</div>
                </div>
              </div>
              {!hasVenue && (
                <div className="mt-3 text-xs text-blue-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  座位尚未分配，请等待管理员安排后再查看
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-500">考试时间</div>
              <div className="flex items-center gap-2 text-gray-900">
                <Clock className="h-4 w-4" />
                <span>{ticket.examDate} {ticket.examStartTime} - {ticket.examEndTime}</span>
              </div>
            </div>

            {ticket.subjects.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">考试科目</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ticket.subjects.map((s) => (
                    <div key={s.id} className="border rounded-lg p-3 text-sm">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-gray-600">{s.startTime} - {s.endTime}（{s.duration} 分钟）</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ticket.qrCode && (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Image src={ticket.qrCode} alt="ticket-qr" width={160} height={160} className="border rounded" unoptimized />
                <div className="text-sm text-gray-600">
                  <p>• 请妥善保管准考证，现场检票时需出示</p>
                  <p>• 建议提前打印纸质版，或保存至手机相册</p>
                </div>
              </div>
            )}

            {ticket.instructions.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">考试须知</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {ticket.instructions.map((line, idx) => (
                    <li key={`${line}-${idx}`}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

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
