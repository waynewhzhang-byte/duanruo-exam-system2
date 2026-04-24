'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon, UsersIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiGetPublic } from '@/lib/api'
import { buildPublicExamRegisterPath } from '@/lib/public-exams'
import { PublishedExamResponse, PositionResponse } from '@/lib/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type PublicExam = z.infer<typeof PublishedExamResponse>
type PublicPosition = z.infer<typeof PositionResponse>

function stripHtmlToText(html?: string | null): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function PublicExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const tenantCode = params.slug as string
  const examCode = params.examCode as string
  const registerPath = useMemo(
    () => buildPublicExamRegisterPath(tenantCode, examCode),
    [tenantCode, examCode],
  )

  const { data: exam, isLoading: examLoading, error: examError } = useQuery({
    queryKey: ['public-exam', tenantCode, examCode],
    queryFn: () =>
      apiGetPublic<PublicExam>(
        `/public/exams/tenant/${tenantCode}/code/${examCode}`,
        { schema: PublishedExamResponse },
      ),
    retry: false,
  })

  const { data: positions } = useQuery({
    queryKey: ['public-exam-positions', tenantCode, examCode],
    queryFn: () =>
      apiGetPublic<PublicPosition[]>(
        `/public/exams/tenant/${tenantCode}/code/${examCode}/positions`,
        { schema: z.array(PositionResponse) },
      ),
    enabled: !!exam,
    retry: false,
  })

  const { data: announcement } = useQuery({
    queryKey: ['public-exam-announcement', tenantCode, examCode],
    queryFn: () =>
      apiGetPublic<{ content: string }>(
        `/public/exams/tenant/${tenantCode}/code/${examCode}/announcement`,
      ),
    enabled: !!exam,
    retry: false,
  })

  const isRegistrationOpen = useMemo(() => {
    if (!exam?.registrationStart || !exam?.registrationEnd) return false
    const now = new Date()
    return (
      now >= new Date(exam.registrationStart) &&
      now <= new Date(exam.registrationEnd)
    )
  }, [exam])

  const handleRegister = () => {
    if (isAuthenticated) {
      router.push(registerPath)
      return
    }

    router.push(`/login?redirect=${encodeURIComponent(registerPath)}`)
  }

  if (examLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">加载考试信息中...</p>
        </div>
      </div>
    )
  }

  if (examError || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">考试不存在</h1>
          <p className="mb-8 text-gray-600">抱歉，您访问的考试页面不存在或已下线。</p>
          <Link href="/exams">
            <Button>返回考试列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  const formatDateTime = (dateTime: string) =>
    format(new Date(dateTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
            <p className="mt-1 text-gray-600">
              {exam.tenantName || tenantCode} · 考试代码: {exam.code}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isRegistrationOpen ? 'secondary' : 'outline'}>
              {isRegistrationOpen ? '报名开放' : '报名未开放'}
            </Badge>
            <Button size="lg" onClick={handleRegister} disabled={!isRegistrationOpen}>
              立即报名
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-6 lg:col-span-2">
          {exam.description && (
            <Card>
              <CardHeader>
                <CardTitle>考试简介</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700">{exam.description}</p>
              </CardContent>
            </Card>
          )}

          {announcement?.content && (
            <Card>
              <CardHeader>
                <CardTitle>考试公告</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700">
                  {stripHtmlToText(announcement.content)}
                </p>
              </CardContent>
            </Card>
          )}

          {positions && positions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UsersIcon className="mr-2 h-5 w-5" />
                  招聘岗位
                </CardTitle>
                <CardDescription>共 {positions.length} 个岗位开放报名</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {positions.map((position) => (
                    <div key={position.id} className="rounded-lg border p-4 transition-colors hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{position.name || position.title}</h3>
                          {position.description && (
                            <p className="mt-1 text-gray-600">{position.description}</p>
                          )}
                          {position.quota != null && (
                            <div className="mt-2 text-sm text-gray-500">
                              招聘 {position.quota} 人
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const target = `${registerPath}?position=${position.id}`
                            if (isAuthenticated) {
                              router.push(target)
                              return
                            }
                            router.push(`/login?redirect=${encodeURIComponent(target)}`)
                          }}
                          disabled={!isRegistrationOpen}
                        >
                          报名此岗位
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                报名信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exam.registrationStart && exam.registrationEnd && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-700">报名时间</p>
                    <p className="text-sm text-gray-600">{formatDateTime(exam.registrationStart)}</p>
                    <p className="text-sm text-gray-600">至 {formatDateTime(exam.registrationEnd)}</p>
                  </div>
                  <Separator />
                </>
              )}

              {exam.feeRequired && exam.feeAmount != null && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-700">报名费用</p>
                    <p className="text-lg font-semibold text-green-600">¥{exam.feeAmount}</p>
                  </div>
                  <Separator />
                </>
              )}

              <Button className="w-full" size="lg" onClick={handleRegister} disabled={!isRegistrationOpen}>
                {isRegistrationOpen ? '立即报名' : '报名未开放'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
