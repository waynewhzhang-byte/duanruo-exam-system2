'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { apiGetWithTenant } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { Search, BarChart3, FileSpreadsheet, TrendingUp, Users, Award, Target, CheckCircle2 } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'

interface Exam {
  id: string
  title: string
  code: string
  status: string
  examStart: string
  examEnd: string
}

interface FunnelData {
  name: string
  value: number
  fill: string
}

interface ScoreAnalysis {
  positionId: string
  positionTitle: string
  averageScore: number
  maxScore: number
  minScore: number
  totalCandidates: number
  scoredCandidates: number
  passCount: number
  passRate: number
}

interface ScoreStatisticsPageProps {
  params: {
    tenantSlug: string
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function ScoreStatisticsPage({ params }: ScoreStatisticsPageProps) {
  const { tenantSlug } = params
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExam, setSelectedExam] = useState<string>('')
  const { tenant } = useTenant()

  // Fetch exams
  const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ['exams', 'admin-stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant')
      const result = await apiGetWithTenant<{content: Exam[]}>('/exams?page=0&size=100', tenant.id)
      return result.content || []
    },
    enabled: !!tenant?.id,
  })

  // Fetch Funnel Data
  const { data: funnelData, isLoading: funnelLoading } = useQuery<FunnelData[]>({
    queryKey: ['statistics', 'funnel', selectedExam],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant')
      return apiGetWithTenant<FunnelData[]>(`/statistics/funnel?examId=${selectedExam}`, tenant.id)
    },
    enabled: !!selectedExam && !!tenant?.id,
  })

  // Fetch Score Analysis
  const { data: scoreAnalysis, isLoading: analysisLoading } = useQuery<ScoreAnalysis[]>({
    queryKey: ['statistics', 'score-analysis', selectedExam],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant')
      return apiGetWithTenant<ScoreAnalysis[]>(`/statistics/score-analysis?examId=${selectedExam}`, tenant.id)
    },
    enabled: !!selectedExam && !!tenant?.id,
  })

  // Fetch Exam Basic Statistics
  const { data: basicStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['scores', 'statistics', selectedExam],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant')
      return apiGetWithTenant<any>(`/scores/statistics/${selectedExam}`, tenant.id)
    },
    enabled: !!selectedExam && !!tenant?.id,
  })

  // Filter exams - show COMPLETED and IN_PROGRESS exams for statistics
  const relevantExams = exams?.filter((exam) => {
    const isRelevant = ['COMPLETED', 'IN_PROGRESS', 'OPEN', 'REGISTRATION_CLOSED'].includes(exam.status)
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      exam.title.toLowerCase().includes(searchLower) ||
      exam.code.toLowerCase().includes(searchLower)
    return isRelevant && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: '草稿', variant: 'secondary' },
      PUBLISHED: { label: '已发布', variant: 'default' },
      REGISTRATION_OPEN: { label: '报名中', variant: 'default' },
      REGISTRATION_CLOSED: { label: '报名结束', variant: 'outline' },
      IN_PROGRESS: { label: '进行中', variant: 'default' },
      COMPLETED: { label: '已结束', variant: 'outline' },
      CANCELLED: { label: '已取消', variant: 'destructive' },
    }

    const config = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const passFailData = basicStats ? [
    { name: '合格', value: basicStats.passCount },
    { name: '未合格', value: basicStats.failCount + basicStats.pendingCount },
  ] : []

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (examsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">成绩统计</h1>
          <p className="text-muted-foreground mt-1">可视化查看招聘流程和成绩深度分析</p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>选择考试</CardTitle>
          <CardDescription>选择要查看统计数据的考试（仅显示已开始或已结束的考试）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="搜索考试名称或编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          {relevantExams && relevantExams.length > 0 && (
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="选择考试" />
              </SelectTrigger>
              <SelectContent>
                {relevantExams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title} ({exam.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Statistics Display */}
      {selectedExam && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> 参考人数
                </CardDescription>
                <CardTitle className="text-3xl">{basicStats?.scoredCandidates ?? '-'}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4" /> 平均分
                </CardDescription>
                <CardTitle className="text-3xl">{basicStats?.averageScore ?? '-'}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Award className="h-4 w-4" /> 最高分
                </CardDescription>
                <CardTitle className="text-3xl">{basicStats?.highestScore ?? '-'}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> 合格率
                </CardDescription>
                <CardTitle className="text-3xl">{basicStats?.passRate ? `${basicStats.passRate}%` : '-'}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recruitment Funnel */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>招聘流程漏斗图</CardTitle>
                <CardDescription>从报名到发证的转化路径</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {funnelLoading ? (
                  <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <Funnel
                        dataKey="value"
                        data={funnelData || []}
                        isAnimationActive
                      >
                        <LabelList position="right" fill="#888" stroke="none" dataKey="name" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pass/Fail Distribution */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>笔试通过比例</CardTitle>
                <CardDescription>合格 vs 未合格人数分布</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {statsLoading ? (
                  <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={passFailData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {passFailData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Position Average Scores */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>分岗位平均分统计</CardTitle>
                <CardDescription>各岗位的成绩对比分析</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {analysisLoading ? (
                  <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scoreAnalysis || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="positionTitle" 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0}
                        height={80}
                      />
                      <YAxis label={{ value: '平均分', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="averageScore" name="平均分" fill="#3b82f6" />
                      <Bar dataKey="maxScore" name="最高分" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* All Exams List (Simplified) */}
      {!selectedExam && (
        <Card>
          <CardHeader>
            <CardTitle>进行中或已结束的考试</CardTitle>
            <CardDescription>
              共 {relevantExams?.length || 0} 个考试
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!relevantExams || relevantExams.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">暂无符合条件的考试</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>考试名称</TableHead>
                    <TableHead>考试编号</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevantExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell className="font-mono text-sm">{exam.code}</TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExam(exam.id)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          查看统计
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

