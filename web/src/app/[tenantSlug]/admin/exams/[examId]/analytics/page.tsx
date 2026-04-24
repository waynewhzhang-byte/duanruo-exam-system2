'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useExam, useExamPositions, useExamApplications } from '@/lib/api-hooks'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, FileText, CheckCircle, XCircle, TrendingUp, Calendar } from 'lucide-react'

interface ExamAnalyticsPageProps {
  params: {
    tenantSlug: string
    examId: string
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ExamAnalyticsPage({ params }: ExamAnalyticsPageProps) {
  const { examId } = params
  
  const { data: exam, isLoading: examLoading } = useExam(examId)
  const { data: positions, isLoading: positionsLoading } = useExamPositions(examId)
  const { data: applicationsData, isLoading: applicationsLoading } = useExamApplications(examId, {
    page: 0,
    size: 1000,
  })

  const applications = (applicationsData as any)?.content || []

  if (examLoading || positionsLoading || applicationsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // 统计数据
  const totalApplications = applications.length
  const approvedApplications = applications.filter((a: any) => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'TICKET_ISSUED').length
  const rejectedApplications = applications.filter((a: any) => a.status === 'REJECTED' || a.status === 'AUTO_REJECTED').length
  const pendingApplications = applications.filter((a: any) => a.status === 'SUBMITTED' || a.status === 'PENDING_PRIMARY_REVIEW' || a.status === 'PENDING_SECONDARY_REVIEW').length

  // 报名趋势数据（按日期分组）
  const applicationsByDate = applications.reduce((acc: any, app: any) => {
    const date = new Date(app.submittedAt || app.createdAt).toLocaleDateString('zh-CN')
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const trendData = Object.entries(applicationsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14) // 最近14天

  // 岗位热度数据
  const applicationsByPosition = applications.reduce((acc: any, app: any) => {
    const positionId = app.positionId
    const position = positions?.find((p: any) => p.id === positionId)
    const positionTitle = position?.title || position?.name || positionId
    acc[positionTitle] = (acc[positionTitle] || 0) + 1
    return acc
  }, {})

  const positionHeatData = Object.entries(applicationsByPosition)
    .map(([position, count]) => ({ position, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10) // 前10个热门岗位

  // 状态分布数据
  const statusDistribution = [
    { name: '已通过', value: approvedApplications, color: '#00C49F' },
    { name: '已拒绝', value: rejectedApplications, color: '#FF8042' },
    { name: '待审核', value: pendingApplications, color: '#FFBB28' },
    { name: '草稿', value: applications.filter((a: any) => a.status === 'DRAFT').length, color: '#8884D8' },
  ].filter(item => item.value > 0)

  // 岗位竞争比例
  const positionCompetitionData = positions?.map((position: any) => {
    const positionApplications = applications.filter((a: any) => a.positionId === position.id)
    const approvedCount = positionApplications.filter((a: any) => a.status === 'APPROVED' || a.status === 'PAID' || a.status === 'TICKET_ISSUED').length
    const maxApplicants = position.maxApplicants || 1
    const competitionRatio = positionApplications.length / maxApplicants
    
    return {
      position: position.title || position.name,
      applications: positionApplications.length,
      approved: approvedCount,
      maxApplicants,
      competitionRatio: competitionRatio.toFixed(2),
    }
  }).sort((a: any, b: any) => b.competitionRatio - a.competitionRatio).slice(0, 10) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">考试数据分析</h1>
        <p className="text-muted-foreground mt-2">
          {exam?.title} - 数据统计与分析
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总报名数</p>
                <p className="text-2xl font-bold">{totalApplications}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已通过</p>
                <p className="text-2xl font-bold text-green-600">{approvedApplications}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已拒绝</p>
                <p className="text-2xl font-bold text-red-600">{rejectedApplications}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">待审核</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApplications}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据可视化 */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">报名趋势</TabsTrigger>
          <TabsTrigger value="position">岗位热度</TabsTrigger>
          <TabsTrigger value="status">状态分布</TabsTrigger>
          <TabsTrigger value="competition">竞争比例</TabsTrigger>
        </TabsList>

        {/* 报名趋势 */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                报名趋势（最近14天）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="报名数" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  暂无报名数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 岗位热度 */}
        <TabsContent value="position">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                岗位热度（前10名）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {positionHeatData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={positionHeatData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="报名数" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  暂无岗位数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 状态分布 */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>报名状态分布</CardTitle>
            </CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value} (${((entry.value / totalApplications) * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  暂无状态数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 竞争比例 */}
        <TabsContent value="competition">
          <Card>
            <CardHeader>
              <CardTitle>岗位竞争比例（前10名）</CardTitle>
            </CardHeader>
            <CardContent>
              {positionCompetitionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={positionCompetitionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="competitionRatio" fill="#FF8042" name="竞争比例" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  暂无竞争数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

