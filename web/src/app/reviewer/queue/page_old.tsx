'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell, Pagination } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingOverlay, SkeletonTable } from '@/components/ui/loading'
import { useReviewQueue, usePullReviewTask, useReviewTaskRelease, useExams, useExamPositions } from '@/lib/api-hooks'
import { RefreshCw, Clock, User, FileText } from 'lucide-react'

interface ReviewTask {
  id: string
  applicationId: string
  candidateName: string
  examTitle: string
  positionTitle: string
  stage: 'PRIMARY' | 'SECONDARY'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  submittedAt: string
  assignedTo?: string
  assignedAt?: string
  timeRemaining?: number // minutes
}


export default function ReviewQueuePage() {
  const [tasks, setTasks] = useState<ReviewTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedStage, setSelectedStage] = useState<'PRIMARY' | 'SECONDARY'>('PRIMARY')

  const [examId, setExamId] = useState<string>('')
  const { data: examsPaged } = useExams({})
  const examOptions = useMemo(() => ((examsPaged as any)?.content ?? []), [examsPaged])
  useEffect(() => {
    if (!examId && examOptions.length > 0) {
      setExamId(examOptions[0].id)
    }
  }, [examOptions, examId])

  const { data: positions } = useExamPositions(examId)
  const positionOptions = useMemo(() => ((positions as any) ?? []), [positions])
  const [positionId, setPositionId] = useState<string>('')

  const [selectedStatus, setSelectedStatus] = useState<'ALL'|'OPEN'|'ASSIGNED'>('ALL')

  // Hook up API
  const router = useRouter()
  const { data: queueData, refetch } = useReviewQueue({
    examId,
    stage: selectedStage,
    positionId: positionId || undefined,
    status: selectedStatus,
    page: currentPage - 1,
    size: pageSize,
    enabled: !!examId,
  })
  const pullTask = usePullReviewTask()
  const releaseTask = useReviewTaskRelease()
  const itemsRaw: any[] = useMemo(() => (
    ((queueData as any)?.content || (queueData as any)?.tasks || []) as any[]
  ), [queueData])

  // Sync tasks from API
  useEffect(() => {
    if (Array.isArray(itemsRaw)) {
      setTasks(itemsRaw.map((x: any) => ({
        id: x.taskId || x.id,
        applicationId: x.applicationId || x.appId || x.id,
        candidateName: x.candidateName || x.candidate || '—',
        examTitle: x.examTitle || x.exam?.title || '—',
        positionTitle: x.positionTitle || x.position?.title || '—',
        stage: (x.stage === 'PRIMARY' || x.stage === 'SECONDARY') ? x.stage : 'PRIMARY',
        priority: x.priority || 'MEDIUM',
        submittedAt: x.submittedAt || x.createdAt || '-',
        assignedTo: x.assignedTo,
        assignedAt: x.assignedAt,
        timeRemaining: x.timeRemaining,
      } as ReviewTask)))
    }
  }, [itemsRaw])

  const filteredTasks = tasks.filter(task => task.stage === selectedStage)

  const pagination = {
    currentPage,
    totalPages: Math.ceil(filteredTasks.length / pageSize),
    totalElements: filteredTasks.length,
    pageSize,
    hasNext: currentPage < Math.ceil(filteredTasks.length / pageSize),
    hasPrevious: currentPage > 1,
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await refetch()
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartReview = async (task: ReviewTask) => {
    try {
      if (task.assignedTo) {
        router.push(`/reviewer/applications/${task.applicationId}?taskId=${task.id}`)
        return
      }
      if (!examId) {
        alert('请选择考试')
        return
      }
      const res: any = await pullTask.mutateAsync({ examId, stage: selectedStage, positionId: positionId || undefined } as any)
      const taskId = res?.taskId || task.id
      router.push(`/reviewer/applications/${task.applicationId}?taskId=${taskId}`)
    } catch (e) {
      console.error('Start review error:', e)
    }
  }

  const handleReleaseTask = async (task: ReviewTask) => {
    if (!confirm('确定要释放这个任务吗？')) return
    try {
      await releaseTask.mutateAsync({ taskId: task.id } as any)
      await refetch()
    } catch (e) {
      console.error('Release task error:', e)
    }
  }

  const getPriorityBadge = (priority: ReviewTask['priority']) => {
    const variants = {
      HIGH: 'danger' as const,
      MEDIUM: 'warning' as const,
      LOW: 'default' as const,
    }
    const labels = {
      HIGH: '高',
      MEDIUM: '中',
      LOW: '低',
    }
    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>
  }

  const getStageBadge = (stage: ReviewTask['stage']) => {
    const variants = {
      PRIMARY: 'primary' as const,
      SECONDARY: 'warning' as const,
    }
    const labels = {
      PRIMARY: '初审',
      SECONDARY: '复审',
    }
    return <Badge variant={variants[stage]}>{labels[stage]}</Badge>
  }

  const getActionButton = (task: ReviewTask) => {
    if (task.assignedTo) {
      return (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => handleStartReview(task)}
          >
            继续审核
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReleaseTask(task)}
          >
            释放任务
          </Button>
        </div>
      )
    }
    return (
      <Button
        size="sm"
        onClick={() => handleStartReview(task)}
      >
        开始审核
      </Button>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">审核队列</h1>
            <p className="text-gray-600">管理待审核的报名申请</p>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新队列
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="examSelect" className="text-sm font-medium text-gray-700">考试:</label>
                <select
                  id="examSelect"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">请选择考试</option>
                  {examOptions.map((ex: any) => (
                    <option key={ex.id} value={ex.id}>{ex.title || ex.name || ex.code || ex.id}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="stageSelect" className="text-sm font-medium text-gray-700">审核阶段:</label>
                <select
                  id="stageSelect"
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value as any)}
                  className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="PRIMARY">初审</option>
                  <option value="SECONDARY">复审</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="positionSelect" className="text-sm font-medium text-gray-700">岗位:</label>
                <select
                  id="positionSelect"
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                  disabled={!examId}
                >
                  <option value="">全部岗位</option>
                  {positionOptions.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.title || p.name || p.code || p.id}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="statusSelect" className="text-sm font-medium text-gray-700">状态:</label>
                <select
                  id="statusSelect"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="ALL">全部</option>
                  <option value="OPEN">待占用</option>
                  <option value="ASSIGNED">已占用</option>
                </select>
              </div>


            </div>
          </CardContent>
        </Card>

        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-warning-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">待审核</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredTasks.filter(t => !t.assignedTo).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-primary-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">我的占用</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredTasks.filter(t => t.assignedTo === '当前用户').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-success-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">高优先级</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredTasks.filter(t => t.priority === 'HIGH').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">总计</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredTasks.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>审核任务</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LoadingOverlay isLoading={isLoading}>
              {isLoading ? (
                <SkeletonTable rows={5} cols={7} className="p-6" />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>候选人</TableHeaderCell>
                        <TableHeaderCell>考试/岗位</TableHeaderCell>
                        <TableHeaderCell>阶段</TableHeaderCell>
                        <TableHeaderCell>优先级</TableHeaderCell>
                        <TableHeaderCell>提交时间</TableHeaderCell>
                        <TableHeaderCell>状态</TableHeaderCell>
                        <TableHeaderCell>操作</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="font-medium text-gray-900">
                              {task.candidateName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {task.applicationId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900">
                              {task.examTitle}
                            </div>
                            <div className="text-sm text-gray-500">
                              {task.positionTitle}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStageBadge(task.stage)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(task.priority)}
                          </TableCell>
                          <TableCell>
                            <div className="text-gray-900">
                              {task.submittedAt}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.assignedTo ? (
                              <div>
                                <Badge variant="primary">已占用</Badge>
                                {task.timeRemaining && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    剩余 {task.timeRemaining} 分钟
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="default">待占用</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getActionButton(task)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Pagination
                    pagination={pagination}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </>
              )}
            </LoadingOverlay>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

