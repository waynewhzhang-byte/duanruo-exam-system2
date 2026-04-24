'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useOpenExams } from '@/lib/api-hooks'
import { buildPublicExamPath } from '@/lib/public-exams'
import {
  Search,
  Calendar,
  Clock,
  BookOpen,
  DollarSign,
  ArrowRight,
  Building2
} from 'lucide-react'

export default function ExamsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // 获取所有租户的公开考试（状态为 OPEN）
  const {
    data: exams,
    isLoading
  } = useOpenExams()

  const filteredExams = exams?.filter(exam =>
    searchQuery === '' ||
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // 考生选择考试后，跳转到对应租户的考试详情页面
  const handleExamSelect = (tenantCode: string | null | undefined, examCode: string) => {
    router.push(buildPublicExamPath(tenantCode, examCode))
  }

  const getStatusBadge = (status: string) => {
    // 使用大写进行比较，兼容后端返回的各种大小写格式
    const normalizedStatus = status?.toUpperCase() || ''
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: '草稿', variant: 'secondary' },
      OPEN: { label: '报名中', variant: 'default' },
      CLOSED: { label: '已截止', variant: 'destructive' },
      INPROGRESS: { label: '考试中', variant: 'outline' },
      IN_PROGRESS: { label: '考试中', variant: 'outline' },
      COMPLETED: { label: '已完成', variant: 'secondary' }
    }
    const config = statusMap[normalizedStatus] || { label: status, variant: 'secondary' as const }
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索考试名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
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
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {exam.title}
                    </CardTitle>
                    {/* 租户信息 */}
                    {exam.tenantName && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{exam.tenantName}</span>
                      </div>
                    )}
                    {/* 岗位数量 */}
                    {exam.positionCount !== null && exam.positionCount !== undefined && exam.positionCount > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        共 {exam.positionCount} 个岗位
                      </div>
                    )}
                  </div>
                  {getStatusBadge(exam.status)}
                </div>
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
                  onClick={() => handleExamSelect(exam.tenantCode, exam.code)}
                  className="w-full group-hover:shadow-md transition-shadow"
                  disabled={exam.status?.toUpperCase() !== 'OPEN'}
                >
                  {exam.status?.toUpperCase() === 'OPEN' ? (
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
