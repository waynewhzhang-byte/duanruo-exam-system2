'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, MapPin, Users } from 'lucide-react'
import ExamVenues from '@/components/admin/exam-detail/ExamVenues'
import ExamSeating from '@/components/admin/exam-detail/ExamSeating'
import { useExam } from '@/lib/api-hooks'
import { Spinner } from '@/components/ui/loading'

interface VenuesPageProps {
  params: Promise<{
    tenantSlug: string
    examId: string
  }>
}

export default function VenuesPage({ params }: VenuesPageProps) {
  const { tenantSlug, examId } = use(params)
  const router = useRouter()

  // Fetch exam details
  const { data: exam, isLoading } = useExam(examId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">考试不存在</p>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold tracking-tight">考场与座位管理</h1>
          <p className="text-muted-foreground">
            {exam.title}
          </p>
        </div>
        <Badge variant={exam.status === 'OPEN' || exam.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
          {exam.status === 'DRAFT' && '草稿'}
          {exam.status === 'OPEN' && '开放报名'}
          {exam.status === 'CLOSED' && '报名关闭'}
          {exam.status === 'IN_PROGRESS' && '考试中'}
          {exam.status === 'COMPLETED' && '已完成'}
          {!['DRAFT','OPEN','CLOSED','IN_PROGRESS','COMPLETED'].includes(exam.status) && exam.status}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">考试状态</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exam.status === 'DRAFT' && '草稿'}
              {exam.status === 'OPEN' && '开放报名'}
              {exam.status === 'CLOSED' && '报名关闭'}
              {exam.status === 'IN_PROGRESS' && '考试中'}
              {exam.status === 'COMPLETED' && '已完成'}
              {!['DRAFT','OPEN','CLOSED','IN_PROGRESS','COMPLETED'].includes(exam.status) && exam.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {exam.status === 'CLOSED' || exam.status === 'COMPLETED' ? '可以进行座位分配' : '报名进行中'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">报名时间</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exam.registrationStart ? new Date(exam.registrationStart).toLocaleDateString('zh-CN') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              至 {exam.registrationEnd ? new Date(exam.registrationEnd).toLocaleDateString('zh-CN') : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">考试时间</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exam.examStart ? new Date(exam.examStart).toLocaleDateString('zh-CN') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              至 {exam.examEnd ? new Date(exam.examEnd).toLocaleDateString('zh-CN') : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="venues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="venues">
            <Building2 className="h-4 w-4 mr-2" />
            考场管理
          </TabsTrigger>
          <TabsTrigger value="seating">
            <MapPin className="h-4 w-4 mr-2" />
            座位分配
          </TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-4">
          <ExamVenues examId={examId} />
        </TabsContent>

        <TabsContent value="seating" className="space-y-4">
          <ExamSeating examId={examId} />
        </TabsContent>
      </Tabs>

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>考场与座位管理流程</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. 考场管理</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>在"考场管理"标签页添加考场信息</li>
              <li>设置考场名称和容量</li>
              <li>可以编辑或删除考场</li>
              <li>确保考场总容量大于报名人数</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. 座位分配</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>报名截止后，在"座位分配"标签页执行分配</li>
              <li>系统支持多种分配策略（按岗位、随机、按时间等）</li>
              <li>同一岗位的考生会分配到同一考场</li>
              <li>分配完成后可以查看详细的座位分配情况</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. 准考证发放</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>座位分配完成后，系统会自动生成准考证</li>
              <li>考生可以在个人中心下载准考证</li>
              <li>准考证包含考场、座位号等信息</li>
            </ul>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">💡 温馨提示</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>建议在报名截止前完成考场配置</li>
              <li>座位分配后如需调整，可以重新执行分配</li>
              <li>确保考场信息准确无误，避免影响考试</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

