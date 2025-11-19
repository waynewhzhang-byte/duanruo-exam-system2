'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { apiGetPublic } from '@/lib/api'
import { ExamResponse, PositionResponse } from '@/lib/schemas'
import { z } from 'zod'

type ExamResponseType = z.infer<typeof ExamResponse>
type PositionResponseType = z.infer<typeof PositionResponse>

interface PublicExamPageProps {
  params: Promise<{ slug: string }>
}

export default function PublicExamPage({ params }: PublicExamPageProps) {
  const { slug } = use(params)

  // 获取考试信息
  const { data: exam, isLoading: examLoading, error: examError } = useQuery({
    queryKey: ['public-exam', slug],
    queryFn: () => apiGetPublic<ExamResponseType>(`/public/exams/slug/${slug}`),
    retry: false
  })

  // 获取岗位列表
  const { data: positions } = useQuery({
    queryKey: ['public-exam-positions', slug],
    queryFn: () => apiGetPublic<PositionResponseType[]>(`/public/exams/slug/${slug}/positions`),
    enabled: !!exam,
    retry: false
  })

  // 获取考试公告
  const { data: announcement } = useQuery({
    queryKey: ['public-exam-announcement', slug],
    queryFn: () => apiGetPublic<{ content: string }>(`/public/exams/slug/${slug}/announcement`),
    enabled: !!exam,
    retry: false
  })

  if (examLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载考试信息中...</p>
        </div>
      </div>
    )
  }

  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">考试不存在</h1>
          <p className="text-gray-600 mb-8">抱歉，您访问的考试页面不存在或已被删除。</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    )
  }

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  }

  const isRegistrationOpen = () => {
    if (!exam.registrationStart || !exam.registrationEnd) return false
    const now = new Date()
    const start = new Date(exam.registrationStart)
    const end = new Date(exam.registrationEnd)
    return now >= start && now <= end
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-gray-600 mt-1">考试代码: {exam.code}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={exam.status === 'OPEN' ? 'secondary' : 'outline'}>
                {exam.status === 'OPEN' ? '报名开放' : exam.status === 'CLOSED' ? '报名结束' : '草稿'}
              </Badge>
              {isRegistrationOpen() && (
                <Link href={`/exam/${slug}/register`}>
                  <Button size="lg">立即报名</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 考试描述 */}
            {exam.description && (
              <Card>
                <CardHeader>
                  <CardTitle>考试简介</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{exam.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 考试公告 */}
            {announcement && announcement.content && (
              <Card>
                <CardHeader>
                  <CardTitle>考试公告</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div 
                      className="text-gray-700"
                      dangerouslySetInnerHTML={{ __html: announcement.content }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 招聘岗位 */}
            {positions && positions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2" />
                    招聘岗位
                  </CardTitle>
                  <CardDescription>
                    共 {positions.length} 个岗位开放报名
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {positions.map((position) => (
                      <div key={position.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{position.name}</h3>
                            {position.description && (
                              <p className="text-gray-600 mt-1">{position.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              {position.quota && (
                                <div className="flex items-center">
                                  <UsersIcon className="h-4 w-4 mr-1" />
                                  招聘 {position.quota} 人
                                </div>
                              )}
                            </div>
                          </div>
                          {isRegistrationOpen() && (
                            <Link href={`/exam/${slug}/register?position=${position.id}`}>
                              <Button variant="outline" size="sm">
                                报名此岗位
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 报名信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  报名信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exam.registrationStart && exam.registrationEnd && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-700">报名时间</p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(exam.registrationStart)}
                      </p>
                      <p className="text-sm text-gray-600">
                        至 {formatDateTime(exam.registrationEnd)}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}
                
                {exam.feeRequired && exam.feeAmount && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-700">报名费用</p>
                      <p className="text-lg font-semibold text-green-600">
                        ¥{exam.feeAmount}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="text-center">
                  {isRegistrationOpen() ? (
                    <Link href={`/exam/${slug}/register`}>
                      <Button className="w-full" size="lg">
                        立即报名
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full" size="lg">
                      {exam.status === 'DRAFT' ? '报名未开始' : '报名已结束'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 联系信息 */}
            <Card>
              <CardHeader>
                <CardTitle>联系我们</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    如有疑问，请联系考试组织方
                  </p>
                  <p className="text-gray-600">
                    工作时间：周一至周五 9:00-17:00
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
