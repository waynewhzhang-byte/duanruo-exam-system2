'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGetWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Calendar, DollarSign, Clock, FileText, Info, Users } from 'lucide-react'
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

interface Position {
  id: string
  code: string
  title: string
  description: string
  requirements: string
  quota: number
}

export default function CandidateExamDetailPage() {
  const params = useParams()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useTenant()

  // Fetch exam details - 使用带认证的 API，通过 X-Tenant-ID header 传递租户ID
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ['exam', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      // 使用 apiGetWithTenant 自动注入 X-Tenant-ID header 和认证 token
      return apiGetWithTenant<Exam>(`/exams/${examId}`, tenant.id)
    },
    enabled: !!examId && !!tenant?.id,
  })

  // Fetch positions - 使用带认证的 API，通过 X-Tenant-ID header 传递租户ID
  const { data: positions, isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: ['exam-positions', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      // 使用 apiGetWithTenant 自动注入 X-Tenant-ID header 和认证 token
      return apiGetWithTenant<Position[]>(`/exams/${examId}/positions`, tenant.id)
    },
    enabled: !!examId && !!tenant?.id,
  })

  const isLoading = tenantLoading || examLoading || positionsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">考试不存在</p>
        <Button onClick={() => router.push(`/${tenantSlug}/exams`)}>返回考试列表</Button>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/${tenantSlug}/exams`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
              <Badge variant="default">报名中</Badge>
            </div>
            <p className="text-muted-foreground mt-1">考试代码: {exam.code}</p>
          </div>
        </div>
        <Button size="lg" onClick={() => router.push(`/${tenantSlug}/exams/${examId}/apply`)}>
          立即报名
        </Button>
      </div>

      {/* Exam Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              报名时间
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">开始: {formatDate(exam.registrationStartTime)}</p>
            <p className="text-sm mt-1">截止: {formatDate(exam.registrationEndTime)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              考试时间
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">开始: {formatDate(exam.examStartTime)}</p>
            <p className="text-sm mt-1">结束: {formatDate(exam.examEndTime)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              报名费用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {exam.feeRequired ? `¥${exam.feeAmount}` : '免费'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Announcement */}
      {exam.announcement && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exam.announcement }} />
          </AlertDescription>
        </Alert>
      )}

      {/* Description */}
      {exam.description && (
        <Card>
          <CardHeader>
            <CardTitle>考试简介</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{exam.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            招聘岗位
          </CardTitle>
          <CardDescription>
            共 {positions?.length || 0} 个岗位，请选择您要报考的岗位
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!positions || positions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无岗位信息</p>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <Card key={position.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{position.title}</CardTitle>
                        <CardDescription>岗位代码: {position.code}</CardDescription>
                      </div>
                      {position.quota && (
                        <Badge variant="outline">招聘 {position.quota} 人</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {position.description && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">岗位描述</h4>
                        <p className="text-sm text-muted-foreground">{position.description}</p>
                      </div>
                    )}
                    {position.requirements && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">任职要求</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {position.requirements}
                        </p>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() =>
                        router.push(`/${tenantSlug}/exams/${examId}/apply?positionId=${position.id}`)
                      }
                    >
                      报考此岗位
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            报名流程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>选择要报考的岗位，点击"报考此岗位"</li>
            <li>填写报名表单，上传所需附件（身份证、学历证明等）</li>
            <li>提交报名申请，获得报名编号</li>
            <li>等待审核（初审和复审）</li>
            {exam.feeRequired && <li>审核通过后，在线缴纳报名费</li>}
            <li>缴费成功后，下载打印准考证</li>
            <li>查看考场和座位安排</li>
            <li>按时参加考试</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

