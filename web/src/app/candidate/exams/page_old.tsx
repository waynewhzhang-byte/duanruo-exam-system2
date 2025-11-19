'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner, EmptyState } from '@/components/ui/loading'
import { useExams } from '@/lib/api-hooks'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ChevronRight,
  BookOpen
} from 'lucide-react'

export default function ExamsPage() {
  const router = useRouter()
  const errorHandler = useErrorHandler()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('REGISTRATION_OPEN')
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 12

  const { 
    data: examsData, 
    isLoading, 
    error 
  } = useExams({
    page: currentPage,
    size: pageSize,
    status: statusFilter === 'ALL' ? undefined : statusFilter
  })

  if (error) {
    errorHandler.handleError(error)
  }

  const filteredExams = examsData?.content?.filter(exam => 
    searchQuery === '' || 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleExamSelect = (examId: string) => {
    router.push(`/candidate/exams/${examId}/positions`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'bg-green-100 text-green-800'
      case 'REGISTRATION_CLOSED': return 'bg-red-100 text-red-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'PUBLISHED': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return '报名中'
      case 'REGISTRATION_CLOSED': return '已截止'
      case 'DRAFT': return '草稿'
      case 'PUBLISHED': return '已发布'
      case 'COMPLETED': return '已完成'
      case 'CANCELLED': return '已取消'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">考试报名</h1>
              <p className="text-gray-600">选择您要报名的考试</p>
            </div>
          </div>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">考试报名</h1>
            <p className="text-gray-600">选择您要报名的考试</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="搜索考试名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        {filteredExams.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="暂无可报名的考试"
            description="当前没有符合条件的考试，请稍后再试或调整筛选条件"
            className="py-12"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{exam.title}</CardTitle>
                      <Badge className={getStatusColor(exam.status)}>
                        {getStatusText(exam.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  {exam.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {exam.description}
                    </p>
                  )}

                  {/* Exam Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    {exam.registrationStart && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>报名开始：{formatDate(exam.registrationStart)}</span>
                      </div>
                    )}
                    
                    {exam.registrationEnd && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>报名截止：{formatDate(exam.registrationEnd)}</span>
                      </div>
                    )}

                    {exam.feeRequired && (
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600 font-medium">
                          需要缴费
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      onClick={() => handleExamSelect(exam.id)}
                      disabled={exam.status !== 'REGISTRATION_OPEN'}
                    >
                      {exam.status === 'REGISTRATION_OPEN' ? (
                        <>
                          查看岗位
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        '报名已截止'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {examsData && examsData.totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                上一页
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                第 {currentPage + 1} 页，共 {examsData.totalPages} 页
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(examsData.totalPages - 1, currentPage + 1))}
                disabled={currentPage >= examsData.totalPages - 1}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

