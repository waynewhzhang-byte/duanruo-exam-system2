'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Award, TrendingUp, TrendingDown, Minus, Trophy, CheckCircle, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useScoreRanking } from '@/lib/api-hooks'

interface ApplicationScoresPageProps {
  params: Promise<{
    applicationId: string
  }>
}

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

export default function ApplicationScoresPage({ params }: ApplicationScoresPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()

  // 获取成绩详情
  const { data: scores, isLoading: scoresLoading, error } = useQuery<Score[]>({
    queryKey: ['scores', 'application', resolvedParams.applicationId],
    queryFn: async () => {
      const response = await apiGet(`/scores/application/${resolvedParams.applicationId}`)
      return Array.isArray(response) ? response : []
    },
  })

  // 获取申请信息以获取考试ID和岗位ID
  const { data: application } = useQuery({
    queryKey: ['application', resolvedParams.applicationId],
    queryFn: () => apiGet(`/applications/${resolvedParams.applicationId}`),
    enabled: !!resolvedParams.applicationId,
  })

  // 获取排名信息
  const examId = (application as any)?.examId
  const positionId = (application as any)?.positionId
  const { data: rankings } = useScoreRanking(examId || '', positionId)

  // 查找当前申请的排名
  const currentRanking = rankings?.find(
    (r) => r.applicationId === resolvedParams.applicationId
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
    isInterviewEligible: currentRanking?.isInterviewEligible || false,
    candidateName: currentRanking?.candidateName || '未知',
    positionTitle: currentRanking?.positionName || (application as any)?.positionTitle || '未知',
    examTitle: (application as any)?.examTitle || '未知考试',
  } : null

  const isLoading = scoresLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <XCircle className="h-12 w-12 mx-auto mb-3" />
              <p>加载失败：{(error as any).message}</p>
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
