'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiGetWithTenant } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, BarChart3, TrendingUp, Award, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ScoresPageProps {
  params: {
    tenantSlug: string
  }
}

interface Application {
  id: string
  applicationNo: string
  examTitle: string
  positionTitle: string
  reviewStatus: string
  paymentStatus: string
}

interface Score {
  id: string
  applicationId: string
  subjectName: string
  score: number
  totalScore: number
  isQualified: boolean
  rank?: number
}

interface ScoreStatistics {
  totalScore: number
  averageScore: number
  maxScore: number
  minScore: number
  passRate: number
  rank?: number
  totalCandidates?: number
}

export default function ScoresPage({ params }: ScoresPageProps) {
  const { tenantSlug } = params
  const router = useRouter()
  const { tenant } = useTenant()

  const [searchTerm, setSearchTerm] = useState('')

  // Fetch my applications
  const { data: applications } = useQuery<Application[]>({
    queryKey: ['applications', 'my', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Application[]>('/applications/my', tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch my scores
  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: ['scores', 'my', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<Score[]>('/scores/my', tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Fetch score statistics
  const { data: statistics } = useQuery<ScoreStatistics>({
    queryKey: ['scores', 'statistics', 'my', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiGetWithTenant<ScoreStatistics>('/scores/my/statistics', tenant.id)
    },
    enabled: !!tenant?.id,
  })

  // Group scores by application
  const scoresByApplication = scores?.reduce((acc, score) => {
    if (!acc[score.applicationId]) {
      acc[score.applicationId] = []
    }
    acc[score.applicationId].push(score)
    return acc
  }, {} as Record<string, Score[]>)

  // Filter applications
  const filteredApplications = applications?.filter((app) => {
    const matchesSearch =
      app.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationNo.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">我的成绩</h1>
        <p className="text-muted-foreground">查看您的考试成绩和排名</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总分</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalScore}</div>
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
              <CardTitle className="text-sm font-medium">排名</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.rank ? `${statistics.rank}/${statistics.totalCandidates}` : '-'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>搜索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索考试名称、岗位、报名编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scores List */}
      {!filteredApplications || filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">暂无成绩数据</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const appScores = scoresByApplication?.[application.id] || []
            const totalScore = appScores.reduce((sum, s) => sum + s.score, 0)
            const allQualified = appScores.length > 0 && appScores.every((s) => s.isQualified)

            return (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{application.examTitle}</CardTitle>
                      <CardDescription>
                        {application.positionTitle} - {application.applicationNo}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {appScores.length > 0 && (
                        <Badge variant={allQualified ? 'default' : 'destructive'} className={allQualified ? 'bg-green-600' : ''}>
                          {allQualified ? '全部及格' : '有不及格科目'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {appScores.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>暂无成绩</AlertTitle>
                      <AlertDescription>
                        该考试成绩尚未公布，请耐心等待。
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">总分</span>
                          <span className="text-2xl font-bold">{totalScore}</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>科目</TableHead>
                              <TableHead>得分</TableHead>
                              <TableHead>总分</TableHead>
                              <TableHead>是否及格</TableHead>
                              {appScores[0]?.rank && <TableHead>排名</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {appScores.map((score) => (
                              <TableRow key={score.id}>
                                <TableCell className="font-medium">{score.subjectName}</TableCell>
                                <TableCell className="font-mono text-lg">{score.score}</TableCell>
                                <TableCell className="text-muted-foreground">{score.totalScore}</TableCell>
                                <TableCell>
                                  {score.isQualified ? (
                                    <Badge variant="default" className="bg-green-600">及格</Badge>
                                  ) : (
                                    <Badge variant="destructive">不及格</Badge>
                                  )}
                                </TableCell>
                                {score.rank && (
                                  <TableCell className="font-medium">#{score.rank}</TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

