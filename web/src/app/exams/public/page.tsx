'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search, Calendar, Clock, DollarSign, Users, ArrowRight, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PublicExam {
  id: string
  code: string
  slug: string
  title: string
  description: string
  announcement: string
  registrationStart: string
  registrationEnd: string
  examStart: string
  examEnd: string
  feeRequired: boolean
  feeAmount: number
  status: string
  createdAt: string
  updatedAt: string
}

export default function PublicExamsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch public exams (no authentication required)
  const { data: exams, isLoading, error } = useQuery({
    queryKey: ['public-exams'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8081/api/v1/public/exams/open')
      if (!response.ok) {
        throw new Error('Failed to fetch public exams')
      }
      return response.json() as Promise<PublicExam[]>
    },
  })

  const filteredExams = exams?.filter(exam =>
    searchQuery === '' ||
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const handleExamClick = (exam: PublicExam) => {
    // Navigate to exam detail page
    router.push(`/exams/public/${exam.slug || exam.code}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : '未知错误'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">公开考试</h1>
          <p className="text-gray-600">浏览所有正在报名的公开考试</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索考试名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Exam Grid */}
        {filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无公开考试</h3>
            <p className="text-gray-600">当前没有正在报名的考试，请稍后再试</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-lg shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => handleExamClick(exam)}
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{exam.code}</p>
                </div>

                {/* Description */}
                {exam.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {exam.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>报名时间：{formatDate(exam.registrationStart)} - {formatDate(exam.registrationEnd)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>考试时间：{formatDate(exam.examStart)} - {formatDate(exam.examEnd)}</span>
                  </div>
                  {exam.feeRequired && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>报名费：¥{exam.feeAmount}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExamClick(exam)
                  }}
                >
                  <span>查看详情</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

