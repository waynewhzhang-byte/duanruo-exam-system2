'use client'

import { use, useState } from 'react'
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
import { api } from '@/lib/api'
import { Search, BarChart3, FileSpreadsheet, TrendingUp } from 'lucide-react'

interface Exam {
  id: string
  title: string
  code: string
  status: string
  examStart: string
  examEnd: string
}

interface ScoreStatisticsPageProps {
  params: Promise<{
    tenantSlug: string
  }>
}

export default function ScoreStatisticsPage({ params }: ScoreStatisticsPageProps) {
  const { tenantSlug } = use(params)
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExam, setSelectedExam] = useState<string>('')

  // Fetch exams
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      return api<Exam[]>('/exams')
    },
  })

  // Filter exams - only show completed exams
  const completedExams = exams?.filter((exam) => {
    const isCompleted = exam.status === 'COMPLETED'
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      exam.title.toLowerCase().includes(searchLower) ||
      exam.code.toLowerCase().includes(searchLower)
    return isCompleted && matchesSearch
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

  if (isLoading) {
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
          <p className="text-muted-foreground mt-1">查看考试成绩统计分析和数据报表</p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>选择考试</CardTitle>
          <CardDescription>选择要查看统计数据的考试</CardDescription>
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
          {completedExams && completedExams.length > 0 && (
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="选择考试" />
              </SelectTrigger>
              <SelectContent>
                {completedExams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title} ({exam.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle>已结束的考试</CardTitle>
          <CardDescription>
            共 {completedExams?.length || 0} 个已结束的考试
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!completedExams || completedExams.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">暂无已结束的考试</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>考试名称</TableHead>
                  <TableHead>考试编号</TableHead>
                  <TableHead>考试时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell className="font-mono text-sm">{exam.code}</TableCell>
                    <TableCell>
                      {new Date(exam.examStart).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam.id)
                            // In a real implementation, this would show statistics
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          查看统计
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/${tenantSlug}/admin/exams/${exam.id}/scores`)}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          详细数据
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Statistics Display (placeholder) */}
      {selectedExam && (
        <Card>
          <CardHeader>
            <CardTitle>成绩统计概览</CardTitle>
            <CardDescription>
              {completedExams?.find((e) => e.id === selectedExam)?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>参考人数</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>平均分</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>最高分</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>最低分</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>合格人数</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>合格率</CardDescription>
                  <CardTitle className="text-3xl">-</CardTitle>
                </CardHeader>
              </Card>
            </div>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>统计数据功能开发中...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

