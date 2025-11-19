'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Eye } from 'lucide-react'

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
  timeRemaining?: number
}

export default function ReviewQueuePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [tasks, setTasks] = useState<ReviewTask[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  const handleRefresh = async () => {
    setIsLoading(true)
    // TODO: Fetch tasks from API
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleStartReview = (task: ReviewTask) => {
    router.push(`/reviewer/review/${task.applicationId}`)
  }

  const getPriorityBadge = (priority: ReviewTask['priority']) => {
    const variants = {
      HIGH: 'destructive' as const,
      MEDIUM: 'secondary' as const,
      LOW: 'outline' as const,
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
      PRIMARY: 'default' as const,
      SECONDARY: 'secondary' as const,
    }
    const labels = {
      PRIMARY: '初审',
      SECONDARY: '复审',
    }
    return <Badge variant={variants[stage]}>{labels[stage]}</Badge>
  }

  const filteredTasks = tasks
  const totalPages = Math.ceil(filteredTasks.length / pageSize)

  return (
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

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>审核任务</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Eye className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无审核任务</h3>
              <p className="text-gray-500">当前没有待审核的申请</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>候选人</TableHead>
                    <TableHead>考试/岗位</TableHead>
                    <TableHead>阶段</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.candidateName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{task.examTitle}</div>
                            <div className="text-sm text-gray-500">{task.positionTitle}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStageBadge(task.stage)}</TableCell>
                        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                        <TableCell>
                          {new Date(task.submittedAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          {task.assignedTo ? (
                            <div className="space-y-1">
                              <Badge variant="secondary">已占用</Badge>
                              {task.timeRemaining && (
                                <div className="text-xs text-gray-500">
                                  剩余 {task.timeRemaining} 分钟
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">待占用</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleStartReview(task)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {task.assignedTo ? '继续审核' : '开始审核'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    共 {filteredTasks.length} 条记录
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <div className="text-sm">
                      第 {currentPage} / {totalPages} 页
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
