'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiGetWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Award, TrendingUp, TrendingDown, Minus, Trophy, CheckCircle, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useScoreRanking } from '@/lib/api-hooks'

interface Score {
  id: string
  subjectId: string
  subjectName?: string | null
  score: number
  totalScore?: number | null
  isAbsent: boolean
  isQualified?: boolean
  gradedAt: string | null
  remarks?: string | null
}

interface ScoreDetail {
  scores: Score[]
  totalScore: number
  averageScore: number
  passedCount: number
  failedCount: number
  absentCount: number
  rank?: number
  totalCandidates?: number
  isInterviewEligible: boolean
  candidateName: string
  positionTitle: string
  examTitle: string
}

export default function ApplicationScoresPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params?.applicationId as string
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>('')

  // 获取用户关联的租户列表
  const { data: tenants } = useQuery<any[]>({
    queryKey: ['my-tenants'],
    queryFn: async () => apiGet<any[]>('/tenants/me'),
  })

  // 自动选择第一个租户
  React.useEffect(() => {
    if (!selectedTenantId && tenants && tenants.length > 0) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

  // 获取申请信息以获取考试ID和岗位ID（需要租户上下文）
  const { data: application } = useQuery({
    queryKey: ['application', applicationId, selectedTenantId],
    queryFn: async () => {
      if (!applicationId || !selectedTenantId) throw new Error('Application ID and Tenant ID are required')
      return await apiGetWithTenant(`/applications/${applicationId}`, selectedTenantId)
    },
    enabled: !!applicationId && !!selectedTenantId,
  })

  // 获取成绩详情（需要租户上下文）
  const { data: scores, isLoading: scoresLoading, error: scoresError } = useQuery<Score[]>({
    queryKey: ['scores', 'application', applicationId, selectedTenantId],
    queryFn: async () => {
      if (!applicationId) throw new Error('Application ID is required')
      if (!selectedTenantId) throw new Error('Tenant ID is required')
      try {
        const response = await apiGetWithTenant(`/scores/application/${applicationId}`, selectedTenantId)
      return Array.isArray(response) ? response : []
      } catch (err: any) {
        console.error('Failed to fetch scores:', err)
        // 如果是权限错误，提供更友好的提示
        if (err?.status === 403 || err?.message?.includes('Access denied') || err?.message?.includes('belong')) {
          throw new Error('您没有权限查看此成绩，或该申请不属于当前租户')
        }
        if (err?.status === 404) {
          throw new Error('成绩数据不存在')
        }
        throw err
      }
    },
    enabled: !!applicationId && !!selectedTenantId,
  })

  // 获取申请信息时的错误
  const { error: applicationError } = useQuery({
    queryKey: ['application', applicationId, selectedTenantId],
    queryFn: async () => {
      if (!applicationId || !selectedTenantId) throw new Error('Application ID and Tenant ID are required')
      try {
        return await apiGetWithTenant(`/applications/${applicationId}`, selectedTenantId)
      } catch (err: any) {
        console.error('Failed to fetch application:', err)
        if (err?.status === 403 || err?.message?.includes('Access denied') || err?.message?.includes('belong')) {
          throw new Error('您没有权限查看此申请，或该申请不属于当前租户')
        }
        throw err
      }
    },
    enabled: !!applicationId && !!selectedTenantId,
  })

  // 合并错误（优先显示成绩错误，其次申请错误）
  const error = scoresError || applicationError

  // 获取排名信息（需要租户上下文）
  const examId = (application as any)?.examId
  const positionId = (application as any)?.positionId
  const { data: rankings } = useQuery({
    queryKey: ['scores', 'ranking', examId, positionId, selectedTenantId],
    queryFn: async () => {
      if (!examId || !selectedTenantId) return []
      const params = new URLSearchParams()
      if (positionId) {
        params.set('positionId', positionId)
      }
      const query = params.toString()
      const url = query ? `/scores/ranking/exam/${examId}?${query}` : `/scores/ranking/exam/${examId}`
      const response = await apiGetWithTenant(url, selectedTenantId)
      return Array.isArray(response) ? response : []
    },
    enabled: !!examId && !!selectedTenantId,
  })

  // 查找当前申请的排名
  const currentRanking = rankings?.find(
    (r) => r.applicationId === applicationId
  )

  // 构建成绩详情
  const scoreDetail: ScoreDetail | null = scores && scores.length > 0 ? {
    scores: scores.map((s) => ({
      ...s,
      subjectName: s.subjectName || '未知科目',
      totalScore: s.totalScore || 100,
      isQualified: s.totalScore ? (s.score / s.totalScore) >= 0.6 : false,
    })),
    totalScore: scores
      .filter((s) => !s.isAbsent)
      .reduce((sum, s) => sum + s.score, 0),
    averageScore: scores.filter((s) => !s.isAbsent).length > 0
      ? scores.filter((s) => !s.isAbsent).reduce((sum, s) => sum + s.score, 0) /
        scores.filter((s) => !s.isAbsent).length
      : 0,
    passedCount: scores.filter((s) => {
      if (s.isAbsent) return false
      const total = s.totalScore || 100
      return s.score / total >= 0.6
    }).length,
    failedCount: scores.filter((s) => {
      if (s.isAbsent) return false
      const total = s.totalScore || 100
      return s.score / total < 0.6
    }).length,
    absentCount: scores.filter((s) => s.isAbsent).length,
    rank: currentRanking?.rank,
    totalCandidates: currentRanking?.totalCandidates,
    // 面试资格：优先从申请状态判断，其次从排名信息判断
    isInterviewEligible: (application as any)?.status === 'INTERVIEW_ELIGIBLE' 
      || currentRanking?.isInterviewEligible 
      || false,
    candidateName: currentRanking?.candidateName || '未知',
    positionTitle: currentRanking?.positionName || (application as any)?.positionTitle || '未知',
    examTitle: (application as any)?.examTitle || '未知考试',
  } : null

  const isLoading = scoresLoading || !selectedTenantId

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    const errorMessage = (error as any)?.message || (error as any)?.code || '系统内部错误'
    const errorDetails = (error as any)?.status 
      ? `HTTP ${(error as any).status}: ${errorMessage}`
      : errorMessage
    
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <XCircle className="h-12 w-12 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">加载失败</h3>
              <p className="mb-4">{errorDetails}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>请检查：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>网络连接是否正常</li>
                  <li>是否已选择正确的租户</li>
                  <li>该申请是否属于当前租户</li>
                </ul>
              </div>
              <div className="mt-4 space-x-2">
                <Button variant="outline" onClick={() => router.back()}>
                  返回
                </Button>
                <Button onClick={() => window.location.reload()}>
                  刷新重试
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!scoreDetail || scoreDetail.scores.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>暂无成绩数据</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const passRate = scoreDetail.scores.length > 0
    ? (scoreDetail.passedCount / scoreDetail.scores.length) * 100
    : 0

  // 准备雷达图数据
  const radarData = scoreDetail.scores
    .filter((s) => !s.isAbsent)
    .map((s) => ({
      subject: s.subjectName || '未知科目',
      score: s.score,
      fullMark: s.totalScore || 100,
      percentage: s.totalScore ? (s.score / s.totalScore) * 100 : 0,
    }))

  // 准备柱状图数据
  const barData = scoreDetail.scores.map((s) => ({
    subject: s.subjectName || '未知科目',
    得分: s.isAbsent ? 0 : s.score,
    满分: s.totalScore || 100,
  }))

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">我的成绩</h1>
            <p className="text-sm text-muted-foreground">
              {scoreDetail.examTitle} - {scoreDetail.positionTitle}
            </p>
          </div>
        </div>
      </div>

      {/* 总分和排名卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">总分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scoreDetail.totalScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              平均分: {scoreDetail.averageScore.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        {scoreDetail.rank && scoreDetail.totalCandidates && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">排名</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{scoreDetail.rank}</div>
                <div className="text-sm text-muted-foreground">/ {scoreDetail.totalCandidates}</div>
              </div>
              {scoreDetail.rank <= 3 && (
                <div className="mt-2">
                  <Trophy
                    className={`h-5 w-5 ${
                      scoreDetail.rank === 1
                        ? 'text-yellow-500'
                        : scoreDetail.rank === 2
                        ? 'text-gray-400'
                        : 'text-amber-600'
                    }`}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">及格率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{passRate.toFixed(0)}%</div>
            <Progress value={passRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">面试资格</CardTitle>
          </CardHeader>
          <CardContent>
            {scoreDetail.isInterviewEligible ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <span className="text-lg font-semibold text-green-600">有资格</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-8 w-8 text-muted-foreground" />
                <span className="text-lg font-semibold text-muted-foreground">无资格</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 成绩详情表格 */}
      <Card>
        <CardHeader>
          <CardTitle>科目成绩</CardTitle>
          <CardDescription>
            共 {scoreDetail.scores.length} 个科目，及格 {scoreDetail.passedCount} 个，不及格{' '}
            {scoreDetail.failedCount} 个
            {scoreDetail.absentCount > 0 && `，缺考 ${scoreDetail.absentCount} 个`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>科目名称</TableHead>
                <TableHead>得分</TableHead>
                <TableHead>满分</TableHead>
                <TableHead>得分率</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>录入时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoreDetail.scores.map((score) => (
                <TableRow key={score.id}>
                  <TableCell className="font-medium">{score.subjectName || '未知科目'}</TableCell>
                  <TableCell className="font-mono text-lg">
                    {score.isAbsent ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      score.score
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{score.totalScore || 100}</TableCell>
                  <TableCell>
                    {score.isAbsent ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      (() => {
                        const total = score.totalScore || 100
                        const percentage = (score.score / total) * 100
                        return (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {percentage.toFixed(1)}%
                            </span>
                            {percentage >= 80 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : percentage >= 60 ? (
                              <Minus className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        )
                      })()
                    )}
                  </TableCell>
                  <TableCell>
                    {score.isAbsent ? (
                      <Badge variant="secondary">缺考</Badge>
                    ) : (() => {
                      const total = score.totalScore || 100
                      const isQualified = score.score / total >= 0.6
                      return isQualified ? (
                        <Badge variant="default" className="bg-green-600">
                          及格
                        </Badge>
                      ) : (
                        <Badge variant="destructive">不及格</Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {score.gradedAt
                      ? new Date(score.gradedAt).toLocaleString('zh-CN')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 成绩分析图表 */}
      {radarData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* 柱状图 */}
          <Card>
            <CardHeader>
              <CardTitle>成绩对比</CardTitle>
              <CardDescription>各科目得分与满分对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="得分" fill="#3b82f6" />
                  <Bar dataKey="满分" fill="#e5e7eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle>能力雷达图</CardTitle>
              <CardDescription>各科目得分率分析</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="得分率"
                    dataKey="percentage"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
