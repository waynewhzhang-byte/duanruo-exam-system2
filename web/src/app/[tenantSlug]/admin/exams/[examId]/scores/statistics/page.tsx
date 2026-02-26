'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiGetWithTenant } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { useScoreRanking } from '@/lib/api-hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, BarChart3, TrendingUp, Award, Users, Trophy, Download } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'
import Papa from 'papaparse'
import dynamic from 'next/dynamic'

// Dynamically import ChartsContainer to reduce initial bundle size and avoid Recharts hydration/type issues
const ChartsContainer = dynamic(() => import('@/components/admin/exams/statistics/ChartsContainer'), { 
  ssr: false,
  loading: () => <div className="h-[600px] w-full flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">正在加载图表...</div>
})

interface StatisticsPageProps {
  params: Promise<{
    tenantSlug: string
    examId: string
  }>
}

interface Exam {
  id: string
  title: string
  status: string
}

interface Position {
  id: string
  title: string
  code: string
}

interface ScoreStatistics {
  totalCandidates: number
  totalScores: number
  averageScore: number
  maxScore: number
  minScore: number
  passRate: number
  scoreDistribution: {
    range: string
    count: number
  }[]
  subjectStatistics: {
    subjectName: string
    averageScore: number
    passRate: number
    maxScore: number
    minScore: number
  }[]
  positionStatistics: {
    positionTitle: string
    candidateCount: number
    averageScore: number
    passRate: number
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function StatisticsPage({ params }: StatisticsPageProps) {
  const { tenantSlug, examId } = use(params)
  const router = useRouter()
  const { tenant } = useTenant()

  const [selectedPosition, setSelectedPosition] = useState<string>('')

  // Fetch exam details
  const { data: exam } = useQuery<Exam>({
    queryKey: ['exam', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Exam>(`/exams/${examId}`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch positions
  const { data: positions } = useQuery<Position[]>({
    queryKey: ['positions', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Position[]>(`/exams/${examId}/positions`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch score statistics
  const { data: statistics, isLoading } = useQuery<ScoreStatistics>({
    queryKey: ['scores', 'statistics', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<ScoreStatistics>(`/exams/${examId}/scores/statistics`, tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch ranking
  const { data: rankings, isLoading: rankingsLoading } = useScoreRanking(
    examId,
    selectedPosition || undefined
  )

  const handleExportRanking = () => {
    if (!rankings || rankings.length === 0) {
      toast.error('暂无排名数据')
      return
    }

    const csvData = rankings.map((ranking) => ({
      排名: ranking.rank,
      考生姓名: ranking.candidateName,
      身份证号: ranking.idCard,
      准考证号: ranking.ticketNo || '-',
      报考岗位: ranking.positionName,
      总分: ranking.totalScore,
      是否并列: ranking.isTied ? '是' : '否',
      面试资格: ranking.isInterviewEligible ? '有' : '无',
    }))

    const csv = Papa.unparse(csvData, {
      quotes: true,
      delimiter: ',',
      header: true,
    })

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const positionName = selectedPosition
      ? positions?.find((p) => p.id === selectedPosition)?.title || '全部岗位'
      : '全部岗位'
    link.download = `成绩排名_${exam?.title || examId}_${positionName}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('导出成功')
  }

  if (isLoading || rankingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
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
              onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/scores`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回成绩管理
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">成绩统计</h1>
          <p className="text-muted-foreground">{exam?.title}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总考生数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalCandidates}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均分</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.averageScore.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">及格率</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(statistics.passRate * 100).toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最高分</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.maxScore}</div>
                <p className="text-xs text-muted-foreground">最低分: {statistics.minScore}</p>
              </CardContent>
            </Card>
          </div>

          <ChartsContainer statistics={statistics} />

          {/* Position Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>岗位详细统计</CardTitle>
              <CardDescription>各岗位详细数据</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">岗位名称</th>
                      <th className="text-right p-2">考生人数</th>
                      <th className="text-right p-2">平均分</th>
                      <th className="text-right p-2">及格率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.positionStatistics.map((position, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{position.positionTitle}</td>
                        <td className="text-right p-2">{position.candidateCount}</td>
                        <td className="text-right p-2 font-mono">{position.averageScore.toFixed(2)}</td>
                        <td className="text-right p-2">{(position.passRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!statistics && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">暂无统计数据</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">成绩排名</h2>
          <Button onClick={handleExportRanking} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出排名
          </Button>
        </div>

        {/* Position Filter */}
        <Card>
          <CardHeader>
            <CardTitle>岗位筛选</CardTitle>
            <CardDescription>选择岗位查看该岗位的成绩排名</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="全部岗位" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部岗位</SelectItem>
                {positions?.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.title} ({position.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Rankings Table */}
        <Card>
          <CardHeader>
            <CardTitle>排名列表</CardTitle>
            <CardDescription>
              {selectedPosition
                ? `${positions?.find((p) => p.id === selectedPosition)?.title || ''} - 共 ${rankings?.length || 0} 人`
                : `全部岗位 - 共 ${rankings?.length || 0} 人`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!rankings || rankings.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">暂无排名数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">排名</TableHead>
                      <TableHead>考生姓名</TableHead>
                      <TableHead>身份证号</TableHead>
                      <TableHead>准考证号</TableHead>
                      <TableHead>报考岗位</TableHead>
                      <TableHead className="text-right">总分</TableHead>
                      <TableHead>面试资格</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((ranking) => (
                      <TableRow key={ranking.applicationId}>
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            {ranking.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                            {ranking.rank === 2 && <Trophy className="h-4 w-4 text-gray-400" />}
                            {ranking.rank === 3 && <Trophy className="h-4 w-4 text-amber-600" />}
                            <span>{ranking.rank}</span>
                            {ranking.isTied && (
                              <Badge variant="outline" className="text-xs">
                                并列
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{ranking.candidateName}</TableCell>
                        <TableCell className="font-mono text-sm">{ranking.idCard}</TableCell>
                        <TableCell className="font-mono text-sm">{ranking.ticketNo || '-'}</TableCell>
                        <TableCell>{ranking.positionName}</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {ranking.totalScore.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {ranking.isInterviewEligible ? (
                            <Badge variant="default" className="bg-green-600">
                              有资格
                            </Badge>
                          ) : (
                            <Badge variant="secondary">无资格</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

