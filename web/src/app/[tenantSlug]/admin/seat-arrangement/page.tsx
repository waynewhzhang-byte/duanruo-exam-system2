'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { apiGetWithTenant, apiPostWithTenant } from '@/lib/api'
import { toast } from 'sonner'
import { Search, MapPin, Users, Play, FileSpreadsheet, Ticket, DollarSign, CheckCircle } from 'lucide-react'

interface Exam {
  id: string
  title: string
  code: string
  status: string
  examStart: string
  examEnd: string
  registrationStart: string
  registrationEnd: string
  feeRequired: boolean
  feeAmount?: number
}

// 座位分配策略映射
const ALLOCATION_STRATEGIES = [
  { code: 'POSITION_FIRST_SUBMITTED_AT', label: '按岗位分组（报名顺序）', description: '相同岗位考生在同一教室，按报名时间排序' },
  { code: 'POSITION_FIRST_RANDOM', label: '按岗位分组（随机）', description: '相同岗位考生在同一教室，随机排序' },
  { code: 'RANDOM', label: '完全随机', description: '打乱所有考生顺序，随机分配' },
  { code: 'SUBMITTED_AT_FIRST', label: '按报名顺序', description: '按照报名时间先后顺序分配' },
]

interface ArrangeResult {
  batchId: string
  totalCandidates: number
  totalSeatsAssigned: number
  totalVenues: number
  feeRequired: boolean
  totalTicketsIssued: number
  strategy: string
  strategyDescription: string
}

interface SeatArrangementPageProps {
  params: Promise<{
    tenantSlug: string
  }>
}

export default function SeatArrangementPage({ params }: SeatArrangementPageProps) {
  const { tenantSlug } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [isArrangeDialogOpen, setIsArrangeDialogOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('POSITION_FIRST_SUBMITTED_AT')
  const [arrangeResult, setArrangeResult] = useState<ArrangeResult | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)

  // Fetch exams with tenant context
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams', tenantSlug],
    queryFn: async () => {
      return apiGetWithTenant<Exam[]>(tenantSlug, '/exams')
    },
  })

  // Filter exams - only show exams with closed registration (CLOSED status)
  const eligibleExams = exams?.filter((exam) => {
    const isEligible = exam.status === 'CLOSED' || exam.status === 'IN_PROGRESS' || exam.status === 'COMPLETED'
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      exam.title.toLowerCase().includes(searchLower) ||
      exam.code.toLowerCase().includes(searchLower)
    return isEligible && matchesSearch
  })

  // Get selected exam details
  const selectedExamDetails = exams?.find(e => e.id === selectedExam)

  // Arrange seats and issue tickets mutation (batch operation)
  const arrangeAndIssue = useMutation({
    mutationFn: async ({ examId, strategy }: { examId: string; strategy: string }) => {
      return apiPostWithTenant<ArrangeResult>(
        tenantSlug,
        `/exams/${examId}/arrange-and-issue?strategy=${strategy}`,
        {}
      )
    },
    onSuccess: (result) => {
      setArrangeResult(result)
      setShowResultDialog(true)
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      setIsArrangeDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || '座位安排失败')
    },
  })

  const handleArrangeSeats = () => {
    if (!selectedExam) {
      toast.error('请先选择考试')
      return
    }
    setIsArrangeDialogOpen(true)
  }

  const confirmArrange = () => {
    arrangeAndIssue.mutate({ examId: selectedExam, strategy: selectedStrategy })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: '草稿', variant: 'secondary' },
      OPEN: { label: '报名中', variant: 'default' },
      CLOSED: { label: '报名结束', variant: 'outline' },
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
          <h1 className="text-3xl font-bold">座位安排</h1>
          <p className="text-muted-foreground mt-1">管理考试座位分配和考场安排</p>
        </div>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>选择考试</CardTitle>
          <CardDescription>选择要进行座位安排的考试</CardDescription>
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
          {eligibleExams && eligibleExams.length > 0 && (
            <div className="flex items-center gap-4">
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="选择考试" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleExams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      <div className="flex items-center gap-2">
                        {exam.title} ({exam.code})
                        {exam.feeRequired && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <DollarSign className="h-3 w-3 mr-1" />
                            收费
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleArrangeSeats}
                disabled={!selectedExam || arrangeAndIssue.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                {arrangeAndIssue.isPending ? '处理中...' : '开始安排座位'}
              </Button>
            </div>
          )}
          {selectedExamDetails && (
            <Alert>
              <AlertDescription>
                {selectedExamDetails.feeRequired ? (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    收费考试：将为所有<strong>已缴费</strong>的考生分配座位并生成准考证
                    {selectedExamDetails.feeAmount && ` (费用: ¥${selectedExamDetails.feeAmount})`}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    免费考试：将为所有<strong>审核通过</strong>的考生分配座位并生成准考证
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle>可安排座位的考试</CardTitle>
          <CardDescription>
            共 {eligibleExams?.length || 0} 个考试可进行座位安排
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!eligibleExams || eligibleExams.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">暂无可安排座位的考试</p>
              <p className="text-xs text-muted-foreground mt-1">
                只有报名已截止的考试才能进行座位安排
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>考试名称</TableHead>
                  <TableHead>考试编号</TableHead>
                  <TableHead>收费</TableHead>
                  <TableHead>考试时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell className="font-mono text-sm">{exam.code}</TableCell>
                    <TableCell>
                      {exam.feeRequired ? (
                        <Badge variant="outline">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ¥{exam.feeAmount || 0}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">免费</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {exam.examStart ? new Date(exam.examStart).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/${tenantSlug}/admin/venues`)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          配置考场
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam.id)
                            setIsArrangeDialogOpen(true)
                          }}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          安排座位
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

      {/* Arrange Seats Dialog */}
      <Dialog open={isArrangeDialogOpen} onOpenChange={setIsArrangeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>座位安排与准考证生成</DialogTitle>
            <DialogDescription>
              {selectedExamDetails?.feeRequired
                ? '系统将为所有已缴费的考生分配座位并生成准考证'
                : '系统将为所有审核通过的考生分配座位并生成准考证'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 考试信息 */}
            {selectedExamDetails && (
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  {selectedExamDetails.title}
                  {selectedExamDetails.feeRequired ? (
                    <Badge variant="outline"><DollarSign className="h-3 w-3" /> 收费</Badge>
                  ) : (
                    <Badge variant="secondary">免费</Badge>
                  )}
                </AlertTitle>
                <AlertDescription className="text-sm text-muted-foreground">
                  考试编号: {selectedExamDetails.code}
                </AlertDescription>
              </Alert>
            )}

            {/* 策略选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">分配策略</label>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALLOCATION_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy.code} value={strategy.code}>
                      {strategy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ALLOCATION_STRATEGIES.find(s => s.code === selectedStrategy)?.description}
              </p>
            </div>

            {/* 说明 */}
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">操作说明：</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>系统将自动分配座位并生成准考证</li>
                <li>相同岗位的考生优先安排在同一考场</li>
                <li>此操作会清除现有的座位安排</li>
                <li>考生可在个人中心查看准考证</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArrangeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmArrange} disabled={arrangeAndIssue.isPending}>
              {arrangeAndIssue.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  处理中...
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  确认执行
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              座位安排完成
            </DialogTitle>
          </DialogHeader>
          {arrangeResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{arrangeResult.totalCandidates}</p>
                  <p className="text-sm text-muted-foreground">符合条件考生</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{arrangeResult.totalSeatsAssigned}</p>
                  <p className="text-sm text-muted-foreground">已分配座位</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{arrangeResult.totalVenues}</p>
                  <p className="text-sm text-muted-foreground">使用考场</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{arrangeResult.totalTicketsIssued}</p>
                  <p className="text-sm text-muted-foreground">已发准考证</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p><strong>分配策略:</strong> {arrangeResult.strategyDescription || arrangeResult.strategy}</p>
                <p><strong>批次ID:</strong> <code className="text-xs">{arrangeResult.batchId}</code></p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
