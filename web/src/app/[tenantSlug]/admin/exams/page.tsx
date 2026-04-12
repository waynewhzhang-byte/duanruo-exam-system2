'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner, EmptyState } from '@/components/ui/loading'
import { useTenant } from '@/hooks/useTenant'
import { apiGetWithTenant, apiPostWithTenant } from '@/lib/api'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Calendar,
  FileText,
  AlertTriangle,
  PlayCircle,
  StopCircle,
  CheckCircle,
  Users,
  Settings,
  Copy
} from 'lucide-react'

interface Exam {
  id: string
  title: string
  code: string
  status: string
  registrationStart?: string
  registrationEnd?: string
  examStart?: string
  examEnd?: string
  feeRequired: boolean
  feeAmount?: number
}

// Backend returns paginated response (PaginationHelper: content + pagination)
type ExamsResponse = {
  content: Exam[]
  pagination?: {
    totalItems: number
    totalPages: number
    page: number
    size: number
    hasNext: boolean
    hasPrevious: boolean
  }
  totalElements?: number
  totalPages?: number
  pageSize?: number
  currentPage?: number
}

export default function TenantAdminExamsPage() {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const { tenant, isLoading: tenantLoading } = useTenant()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState({
    status: 'ALL',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const {
    data: examsData,
    isLoading,
    error
  } = useQuery<ExamsResponse>({
    queryKey: ['tenant-exams', tenant?.id, currentPage, pageSize, filters.status],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected')

      const searchParams = new URLSearchParams()
      searchParams.set('page', currentPage.toString())
      searchParams.set('size', pageSize.toString())
      if (filters.status !== 'ALL') {
        searchParams.set('status', filters.status)
      }

      return apiGetWithTenant<ExamsResponse>(
        `/exams?${searchParams}`,
        tenant.id
      )
    },
    enabled: !!tenant?.id,
  })

  // 开放报名 mutation
  const openExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiPostWithTenant(`/exams/${examId}/open`, tenant.id, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-exams', tenant?.id] })
    },
  })

  // 关闭报名 mutation
  const closeExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiPostWithTenant(`/exams/${examId}/close`, tenant.id, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-exams', tenant?.id] })
    },
  })

  // 开始考试 mutation
  const startExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiPostWithTenant(`/exams/${examId}/start`, tenant.id, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-exams', tenant?.id] })
    },
  })

  // 完成考试 mutation
  const completeExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      if (!tenant?.id) throw new Error('No tenant selected')
      return apiPostWithTenant(`/exams/${examId}/complete`, tenant.id, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-exams', tenant?.id] })
    },
  })

  // 复制考试 mutation
  const copyExamMutation = useMutation({
    mutationFn: async (exam: Exam) => {
      if (!tenant?.id) throw new Error('No tenant selected')
      const timestamp = Date.now()
      return apiPostWithTenant(`/exams/${exam.id}/copy`, tenant.id, {
        newCode: `${exam.code}_COPY_${timestamp}`,
        newTitle: `${exam.title} (副本)`,
        copyPositions: true,
        copySubjects: true,
        copyAnnouncement: true,
        copyRulesConfig: true,
        copyFeeSettings: true
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-exams', tenant?.id] })
    },
  })

  // Show loading state while tenant is being fetched OR if tenant is not yet loaded
  if (tenantLoading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <p className="ml-4 text-muted-foreground">
          {tenantLoading ? '加载租户信息...' : '等待租户信息...'}
        </p>
      </div>
    )
  }

  const handleCreateExam = () => {
    router.push(`/${tenantSlug}/admin/exams/new`)
  }

  const handleEditExam = (examId: string) => {
    router.push(`/${tenantSlug}/admin/exams/${examId}/edit`)
  }

  const handleViewExam = (examId: string) => {
    router.push(`/${tenantSlug}/admin/exams/${examId}/detail`)
  }

  const handleOpenExam = async (examId: string) => {
    if (confirm('确定要开放此考试的报名吗？')) {
      try {
        await openExamMutation.mutateAsync(examId)
        alert('考试已开放报名')
      } catch (error) {
        alert(`开放报名失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleCloseExam = async (examId: string) => {
    if (confirm('确定要关闭此考试的报名吗？关闭后将无法再次开放。')) {
      try {
        await closeExamMutation.mutateAsync(examId)
        alert('考试报名已关闭')
      } catch (error) {
        alert(`关闭报名失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleStartExam = async (examId: string) => {
    if (confirm('确定要开始此考试吗？')) {
      try {
        await startExamMutation.mutateAsync(examId)
        alert('考试已开始')
      } catch (error) {
        alert(`开始考试失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleCompleteExam = async (examId: string) => {
    if (confirm('确定要完成此考试吗？完成后将无法修改。')) {
      try {
        await completeExamMutation.mutateAsync(examId)
        alert('考试已完成')
      } catch (error) {
        alert(`完成考试失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const handleCopyExam = async (exam: Exam) => {
    if (confirm(`确定要复制考试"${exam.title}"吗？将创建一个包含所有岗位、科目和表单配置的新考试。`)) {
      try {
        const result = await copyExamMutation.mutateAsync(exam) as Exam
        alert(`考试复制成功！新考试：${result.title}`)
      } catch (error) {
        alert(`复制考试失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const getStatusColor = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case 'DRAFT': return 'outline'
      case 'OPEN': return 'default'
      case 'CLOSED': return 'destructive'
      case 'IN_PROGRESS': return 'secondary'
      case 'COMPLETED': return 'default'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return '草稿'
      case 'OPEN': return '开放报名'
      case 'CLOSED': return '报名关闭'
      case 'IN_PROGRESS': return '考试中'
      case 'COMPLETED': return '已完成'
      default: return status
    }
  }

  const totalElements = examsData?.pagination?.totalItems ?? examsData?.totalElements ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
          <p className="text-gray-600">
            租户：{tenant.name} - 管理该租户下的所有考试
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/${tenantSlug}/admin`)}>
            返回管理后台
          </Button>
          <Button onClick={handleCreateExam}>
            <Plus className="h-4 w-4 mr-2" />
            创建考试
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="examSearch" className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="examSearch"
                  type="text"
                  placeholder="搜索考试名称或编号..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="statusSelect" className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <select
                id="statusSelect"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">全部状态</option>
                <option value="DRAFT">草稿</option>
                <option value="OPEN">开放报名</option>
                <option value="CLOSED">报名关闭</option>
                <option value="IN_PROGRESS">考试中</option>
                <option value="COMPLETED">已完成</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ status: 'ALL', search: '' })}
              >
                <Filter className="h-4 w-4 mr-2" />
                重置筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>考试列表</span>
            <div className="flex items-center gap-2 text-gray-600">
              <span>共 {totalElements} 个考试</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <EmptyState
              icon={<AlertTriangle className="h-12 w-12" />}
              title="加载失败"
              description={`无法加载考试列表: ${error instanceof Error ? error.message : '未知错误'}`}
              action={<Button onClick={() => window.location.reload()}>重试</Button>}
            />
          ) : !examsData || examsData.content?.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="暂无考试"
              description="该租户下还没有创建任何考试，点击上方按钮创建第一个考试"
              action={
                <Button onClick={handleCreateExam}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建考试
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      考试名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间安排
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      费用
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(examsData?.content || []).map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{exam.title}</div>
                        <div className="text-sm text-gray-500">编号: {exam.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(exam.status)}>
                          {getStatusText(exam.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>报名: {exam.registrationStart || '未设置'} ~ {exam.registrationEnd || '未设置'}</div>
                        <div>考试: {exam.examStart || '未设置'} ~ {exam.examEnd || '未设置'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {exam.feeRequired ? (
                          <span className="text-green-600">¥{exam.feeAmount || 0}</span>
                        ) : (
                          <span className="text-gray-500">免费</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewExam(exam.id)}
                            title="查看详情"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditExam(exam.id)}
                            title="编辑"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/${tenantSlug}/admin/exams/${exam.id}/positions`)}
                            title="管理岗位"
                          >
                            <Users className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/${tenantSlug}/admin/exams/${exam.id}/form-config`)}
                            title="配置报名表单"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyExam(exam)}
                            title="复制考试"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>

                          {/* 状态操作按钮 */}
                          {exam.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenExam(exam.id)}
                              title="开放报名"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <PlayCircle className="h-3 w-3 mr-1" />
                              开放
                            </Button>
                          )}
                          {exam.status === 'OPEN' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleCloseExam(exam.id)}
                              title="关闭报名"
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <StopCircle className="h-3 w-3 mr-1" />
                              关闭
                            </Button>
                          )}
                          {exam.status === 'CLOSED' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStartExam(exam.id)}
                              title="开始考试"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <PlayCircle className="h-3 w-3 mr-1" />
                              开始
                            </Button>
                          )}
                          {exam.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleCompleteExam(exam.id)}
                              title="完成考试"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              完成
                            </Button>
                          )}
                          {exam.status === 'COMPLETED' && (
                            <div className="flex items-center text-gray-500 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              已结束
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总考试数</p>
                <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">草稿</p>
                <p className="text-2xl font-bold text-gray-600">
                  {examsData?.content?.filter(exam => exam.status === 'DRAFT').length || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">开放报名</p>
                <p className="text-2xl font-bold text-green-600">
                  {examsData?.content?.filter(exam => exam.status === 'OPEN').length || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">报名关闭</p>
                <p className="text-2xl font-bold text-orange-600">
                  {examsData?.content?.filter(exam => exam.status === 'CLOSED').length || 0}
                </p>
              </div>
              <StopCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">考试中</p>
                <p className="text-2xl font-bold text-blue-600">
                  {examsData?.content?.filter(exam => exam.status === 'IN_PROGRESS').length || 0}
                </p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已完成</p>
                <p className="text-2xl font-bold text-purple-600">
                  {examsData?.content?.filter(exam => exam.status === 'COMPLETED').length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

