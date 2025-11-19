'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useExams } from '@/lib/api-hooks'
import {
  Search,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  DollarSign,
  ArrowRight
} from 'lucide-react'

export default function ExamsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('REGISTRATION_OPEN')

  const {
    data: examsData,
    isLoading
  } = useExams({
    page: 0,
    size: 100,
    status: statusFilter === 'ALL' ? undefined : statusFilter
  })

  const filteredExams = examsData?.content?.filter(exam =>
    searchQuery === '' ||
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleExamSelect = (examId: string) => {
    router.push(`/candidate/exams/${examId}/positions`)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      REGISTRATION_OPEN: { label: '报名中', variant: 'default' },
      REGISTRATION_CLOSED: { label: '已截止', variant: 'destructive' },
      DRAFT: { label: '草稿', variant: 'secondary' },
      PUBLISHED: { label: '已发布', variant: 'outline' },
      COMPLETED: { label: '已完成', variant: 'secondary' },
      CANCELLED: { label: '已取消', variant: 'destructive' }
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">考试报名</h1>
        <p className="text-muted-foreground mt-2">选择您要报名的考试</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="搜索考试名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ALL">全部状态</option>
                <option value="REGISTRATION_OPEN">报名中</option>
                <option value="PUBLISHED">已发布</option>
                <option value="REGISTRATION_CLOSED">已截止</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无可报名的考试</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? '未找到匹配的考试，请尝试其他关键词' : '当前没有符合条件的考试，请稍后再试或调整筛选条件'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {exam.title}
                  </CardTitle>
                </div>
                {getStatusBadge(exam.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {exam.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {exam.description}
                  </p>
                )}

                {/* Exam Details */}
                <div className="space-y-2 text-sm">
                  {exam.registrationStart && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>报名开始：{formatDate(exam.registrationStart)}</span>
                    </div>
                  )}

                  {exam.registrationEnd && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>报名截止：{formatDate(exam.registrationEnd)}</span>
                    </div>
                  )}

                  {exam.feeRequired && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-600 font-medium">需要缴费</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleExamSelect(exam.id)}
                  className="w-full group-hover:shadow-md transition-shadow"
                  disabled={exam.status !== 'REGISTRATION_OPEN'}
                >
                  {exam.status === 'REGISTRATION_OPEN' ? (
                    <>
                      查看岗位
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    '报名已截止'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
