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
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Search, MapPin, Users, Play, FileSpreadsheet } from 'lucide-react'

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
  const [arrangementRule, setArrangementRule] = useState<string>('按岗位分组')

  // Fetch exams
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      return api<Exam[]>('/exams')
    },
  })

  // Filter exams - only show exams with closed registration
  const eligibleExams = exams?.filter((exam) => {
    const isEligible = exam.status === 'REGISTRATION_CLOSED' || exam.status === 'IN_PROGRESS' || exam.status === 'COMPLETED'
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      exam.title.toLowerCase().includes(searchLower) ||
      exam.code.toLowerCase().includes(searchLower)
    return isEligible && matchesSearch
  })

  // Arrange seats mutation
  const arrangeSeats = useMutation({
    mutationFn: async (examId: string) => {
      return api(`/seating/arrange`, { method: 'POST', body: JSON.stringify({ examId }) })
    },
    onSuccess: () => {
      toast.success('座位安排成功')
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      setIsArrangeDialogOpen(false)
      setSelectedExam('')
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
    arrangeSeats.mutate(selectedExam)
  }

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
                      {exam.title} ({exam.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleArrangeSeats}
                disabled={!selectedExam || arrangeSeats.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                开始安排座位
              </Button>
            </div>
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
                          onClick={() => router.push(`/${tenantSlug}/admin/exams/${exam.id}/seating`)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          配置考场
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam.id)
                            handleArrangeSeats()
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认座位安排</DialogTitle>
            <DialogDescription>
              系统将自动为所有已缴费的考生分配座位。此操作将清除现有的座位安排。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">安排规则</label>
              <Select value={arrangementRule} onValueChange={setArrangementRule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="按岗位分组">按岗位分组</SelectItem>
                  <SelectItem value="随机分配">随机分配</SelectItem>
                  <SelectItem value="按报名顺序">按报名顺序</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">安排规则说明：</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>按岗位分组：相同岗位的考生安排在同一教室</li>
                <li>随机分配：随机分配座位，打乱岗位顺序</li>
                <li>按报名顺序：按照报名时间先后顺序分配</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArrangeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmArrange} disabled={arrangeSeats.isPending}>
              {arrangeSeats.isPending ? '安排中...' : '确认开始安排'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

