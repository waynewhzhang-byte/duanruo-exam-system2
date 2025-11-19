'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTenant } from '@/contexts/TenantContext'
import { apiGetWithTenant } from '@/lib/tenant-api'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'

// Exam type (simplified)
interface Exam {
  id: string
  title: string
  description?: string
  status: string
  registrationStart?: string
  registrationEnd?: string
  feeRequired: boolean
}

interface ExamsResponse {
  content: Exam[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export default function TenantExamsPage() {
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useTenant()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('REGISTRATION_OPEN')
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 12

  const { 
    data: examsData, 
    isLoading: examsLoading, 
    error 
  } = useQuery({
    queryKey: ['exams', tenant?.id, currentPage, pageSize, statusFilter],
    queryFn: () => apiGetWithTenant<ExamsResponse>(
      `/exams?page=${currentPage}&size=${pageSize}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`,
      tenant?.id
    ),
    enabled: !!tenant?.id,
  })

  const filteredExams = examsData?.content?.filter(exam => 
    searchQuery === '' || 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

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

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">考试不存在</h2>
          <Link href="/tenants" className="btn btn-primary">
            返回考试列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/${tenant.slug}/candidate`}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">考试报名</h1>
                <p className="text-sm text-gray-600">{tenant.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="搜索考试名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALL">全部状态</option>
                <option value="REGISTRATION_OPEN">报名中</option>
                <option value="PUBLISHED">已发布</option>
                <option value="REGISTRATION_CLOSED">已截止</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exam Grid */}
        {examsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600">无法加载考试列表，请稍后重试</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无可报名的考试</h3>
            <p className="text-gray-600">当前没有符合条件的考试，请稍后再试或调整筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-lg shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {exam.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(exam.status)}`}>
                      {getStatusText(exam.status)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {exam.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {exam.description}
                  </p>
                )}

                {/* Exam Details */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                <button
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    exam.status === 'REGISTRATION_OPEN'
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={exam.status !== 'REGISTRATION_OPEN'}
                  onClick={() => router.push(`/${tenant.slug}/candidate/exams/${exam.id}/positions`)}
                >
                  {exam.status === 'REGISTRATION_OPEN' ? (
                    <>
                      查看岗位
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    '报名已截止'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {examsData && examsData.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                上一页
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                第 {currentPage + 1} 页，共 {examsData.totalPages} 页
              </span>
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(Math.min(examsData.totalPages - 1, currentPage + 1))}
                disabled={currentPage >= examsData.totalPages - 1}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

