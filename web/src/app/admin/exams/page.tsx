'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Settings, Eye, PlayCircle, PauseCircle } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

interface Exam {
  id: string
  name: string
  type: string
  status: 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  registrationStart: string
  registrationEnd: string
  examDate: string
  totalPositions: number
  totalApplications: number
  createdAt: string
}

export default function ExamsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'RECRUITMENT',
    description: '',
    registrationStart: '',
    registrationEnd: '',
    examDate: '',
  })

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setIsLoading(true)
      const data = await apiGet<Exam[]>('/exams')
      setExams(data)
    } catch (error) {
      console.error('Failed to fetch exams:', error)
      alert('获取考试列表失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateExam = async () => {
    try {
      await apiPost<Exam>('/exams', formData)
      setShowCreateDialog(false)
      setFormData({
        name: '',
        type: 'RECRUITMENT',
        description: '',
        registrationStart: '',
        registrationEnd: '',
        examDate: '',
      })
      fetchExams()
      alert('考试创建成功')
    } catch (error) {
      console.error('Failed to create exam:', error)
      alert('创建失败，请重试')
    }
  }

  const handleUpdateExam = async () => {
    if (!selectedExam) return

    try {
      await apiPut<Exam>(`/exams/${selectedExam.id}`, formData)
      setShowEditDialog(false)
      setSelectedExam(null)
      fetchExams()
      alert('考试更新成功')
    } catch (error) {
      console.error('Failed to update exam:', error)
      alert('更新失败，请重试')
    }
  }

  const handleDeleteExam = async () => {
    if (!selectedExam) return

    try {
      await apiDelete(`/exams/${selectedExam.id}`)
      setShowDeleteDialog(false)
      setSelectedExam(null)
      fetchExams()
      alert('考试删除成功')
    } catch (error) {
      console.error('Failed to delete exam:', error)
      alert('删除失败，请重试')
    }
  }

  const handlePublishExam = async (examId: string) => {
    try {
      await apiPost(`/exams/${examId}/publish`)
      fetchExams()
      alert('考试发布成功')
    } catch (error) {
      console.error('Failed to publish exam:', error)
      alert('发布失败，请重试')
    }
  }

  const handleCancelExam = async (examId: string) => {
    try {
      await apiPost(`/exams/${examId}/cancel`)
      fetchExams()
      alert('考试取消成功')
    } catch (error) {
      console.error('Failed to cancel exam:', error)
      alert('取消失败，请重试')
    }
  }

  const getStatusBadge = (status: Exam['status']) => {
    const variants: Record<Exam['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'outline',
      PUBLISHED: 'secondary',
      REGISTRATION_OPEN: 'default',
      REGISTRATION_CLOSED: 'secondary',
      IN_PROGRESS: 'default',
      COMPLETED: 'secondary',
      CANCELLED: 'destructive',
    }
    const labels: Record<Exam['status'], string> = {
      DRAFT: '草稿',
      PUBLISHED: '已发布',
      REGISTRATION_OPEN: '报名中',
      REGISTRATION_CLOSED: '报名结束',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
          <p className="text-gray-600">创建和管理考试</p>
        </div>
        <Button data-testid="btn-create-exam" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建考试
        </Button>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>考试列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">暂无考试</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>考试名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>报名时间</TableHead>
                  <TableHead>考试日期</TableHead>
                  <TableHead>岗位/报名</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>{exam.type}</TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{exam.registrationStart}</div>
                        <div className="text-gray-500">至 {exam.registrationEnd}</div>
                      </div>
                    </TableCell>
                    <TableCell>{exam.examDate}</TableCell>
                    <TableCell>
                      {exam.totalPositions} / {exam.totalApplications}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          data-testid="btn-view-exam"
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/exams/${exam.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          data-testid="btn-config-exam"
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/exams/${exam.id}/config`)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          data-testid="btn-edit-exam"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam)
                            setFormData({
                              name: exam.name,
                              type: exam.type,
                              description: '',
                              registrationStart: exam.registrationStart,
                              registrationEnd: exam.registrationEnd,
                              examDate: exam.examDate,
                            })
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {exam.status === 'DRAFT' && (
                          <Button
                            data-testid="btn-publish-exam"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublishExam(exam.id)}
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {exam.status !== 'CANCELLED' && exam.status !== 'COMPLETED' && (
                          <Button
                            data-testid="btn-cancel-exam"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelExam(exam.id)}
                          >
                            <PauseCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          data-testid="btn-delete-exam"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建考试</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">考试名称 *</Label>
              <Input
                id="name"
                data-testid="input-exam-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入考试名称"
              />
            </div>
            <div>
              <Label htmlFor="type">考试类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger data-testid="select-exam-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECRUITMENT">招聘考试</SelectItem>
                  <SelectItem value="QUALIFICATION">资格考试</SelectItem>
                  <SelectItem value="ASSESSMENT">评估考试</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">考试描述</Label>
              <Textarea
                id="description"
                data-testid="input-exam-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入考试描述"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationStart">报名开始时间 *</Label>
                <Input
                  id="registrationStart"
                  data-testid="input-registration-start"
                  type="date"
                  value={formData.registrationStart}
                  onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="registrationEnd">报名结束时间 *</Label>
                <Input
                  id="registrationEnd"
                  data-testid="input-registration-end"
                  type="date"
                  value={formData.registrationEnd}
                  onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="examDate">考试日期 *</Label>
              <Input
                id="examDate"
                data-testid="input-exam-date"
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button
              data-testid="btn-submit-create"
              onClick={handleCreateExam}
              disabled={!formData.name || !formData.registrationStart || !formData.registrationEnd || !formData.examDate}
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑考试</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">考试名称 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入考试名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-type">考试类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECRUITMENT">招聘考试</SelectItem>
                  <SelectItem value="QUALIFICATION">资格考试</SelectItem>
                  <SelectItem value="ASSESSMENT">评估考试</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-registrationStart">报名开始时间 *</Label>
                <Input
                  id="edit-registrationStart"
                  type="date"
                  value={formData.registrationStart}
                  onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-registrationEnd">报名结束时间 *</Label>
                <Input
                  id="edit-registrationEnd"
                  type="date"
                  value={formData.registrationEnd}
                  onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-examDate">考试日期 *</Label>
              <Input
                id="edit-examDate"
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateExam}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除考试</DialogTitle>
          </DialogHeader>
          <p>确定要删除考试 "{selectedExam?.name}" 吗？此操作不可恢复。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteExam}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

