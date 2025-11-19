'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Calendar, DollarSign, Users, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Exam {
  id: string
  code: string
  title: string
  description: string
  status: string
  registrationStartTime: string
  registrationEndTime: string
  examStartTime: string
  examEndTime: string
  feeRequired: boolean
  feeAmount: number
  announcement: string
}

export default function CandidateExamsPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useTenant()

  // Fetch open exams
  const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ['open-exams', tenant?.id],
    queryFn: async () => {
      return apiGet<Exam[]>('/exams/open')
    },
    enabled: !!tenant?.id,
  })

  const isLoading = tenantLoading || examsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">开放报名的考试</h1>
        <p className="text-muted-foreground mt-2">
          选择您想要报名的考试，查看详情并提交报名申请
        </p>
      </div>

      {/* Exams Grid */}
      {!exams || exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无开放报名的考试</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription className="mt-1">
                      考试代码: {exam.code}
                    </CardDescription>
                  </div>
                  <Badge variant="default">报名中</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {exam.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {exam.description}
                  </p>
                )}

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>报名截止: {formatDate(exam.registrationEndTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>考试时间: {formatDate(exam.examStartTime)}</span>
                  </div>
                  {exam.feeRequired && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>报名费: ¥{exam.feeAmount}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/${tenantSlug}/exams/${exam.id}`)}
                  >
                    查看详情
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => router.push(`/${tenantSlug}/exams/${exam.id}/apply`)}
                  >
                    立即报名
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

