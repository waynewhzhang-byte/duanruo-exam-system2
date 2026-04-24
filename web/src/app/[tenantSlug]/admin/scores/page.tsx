'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Search, Edit, BarChart3, FileSpreadsheet } from 'lucide-react'

interface Exam {
  id: string
  title: string
  code: string
  status: string
  examStart: string
  examEnd: string
  registrationStart: string
  registrationEnd: string
}

interface ScoresPageProps {
  params: {
    tenantSlug: string
  }
}

export default function ScoresPage({ params }: ScoresPageProps) {
  const { tenantSlug } = params
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch exams
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      return api<Exam[]>('/exams')
    },
  })

  // Filter exams
  const filteredExams = exams?.filter((exam) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      exam.title.toLowerCase().includes(searchLower) ||
      exam.code.toLowerCase().includes(searchLower)
    )
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
          <h1 className="text-3xl font-bold">成绩管理</h1>
          <p className="text-muted-foreground mt-1">管理所有考试的成绩录入和查询</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>搜索考试</CardTitle>
          <CardDescription>根据考试名称或编号搜索</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="搜索考试名称或编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle>考试列表</CardTitle>
          <CardDescription>
            共 {filteredExams?.length || 0} 个考试
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!filteredExams || filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">暂无考试数据</p>
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
                {filteredExams.map((exam) => (
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
                          onClick={() => router.push(`/${tenantSlug}/admin/exams/${exam.id}/scores`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          成绩录入
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/${tenantSlug}/admin/exams/${exam.id}/scores`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          查看成绩
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
    </div>
  )
}

