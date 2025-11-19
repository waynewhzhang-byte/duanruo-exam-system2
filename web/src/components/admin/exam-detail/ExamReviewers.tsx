'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/loading'
import { UserPlus, Trash2, UserCheck, Users, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface Reviewer {
  id: string
  userId: string
  username: string
  email: string
  role: 'PRIMARY_REVIEWER' | 'SECONDARY_REVIEWER'
  assignedAt: string
  assignedBy: string
}

interface User {
  id: string
  username: string
  email: string
}

interface ExamReviewersProps {
  examId: string
}

export default function ExamReviewers({ examId }: ExamReviewersProps) {
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'PRIMARY_REVIEWER' | 'SECONDARY_REVIEWER'>('PRIMARY_REVIEWER')

  // 获取审核员列表
  const { data: reviewers, isLoading } = useQuery<Reviewer[]>({
    queryKey: ['exam-reviewers', examId],
    queryFn: () => apiGet<Reviewer[]>(`/exams/${examId}/reviewers`),
  })

  // 获取可用用户列表（用于添加审核员）
  const { data: availableUsers } = useQuery<User[]>({
    queryKey: ['available-reviewers'],
    queryFn: () => apiGet<User[]>('/users?role=REVIEWER'),
    enabled: addDialogOpen,
  })

  // 添加审核员
  const addReviewerMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      apiPost(`/exams/${examId}/reviewers`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-reviewers', examId] })
      toast.success('审核员添加成功')
      setAddDialogOpen(false)
      setSelectedUserId('')
      setSelectedRole('PRIMARY_REVIEWER')
    },
    onError: (error: any) => {
      toast.error(error?.message || '添加失败')
    },
  })

  // 移除审核员
  const removeReviewerMutation = useMutation({
    mutationFn: (reviewerId: string) =>
      apiDelete(`/exams/${examId}/reviewers/${reviewerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-reviewers', examId] })
      toast.success('审核员移除成功')
    },
    onError: (error: any) => {
      toast.error(error?.message || '移除失败')
    },
  })

  const handleAddReviewer = () => {
    if (!selectedUserId) {
      toast.error('请选择用户')
      return
    }
    addReviewerMutation.mutate({
      userId: selectedUserId,
      role: selectedRole,
    })
  }

  const handleRemoveReviewer = (reviewerId: string, username: string) => {
    if (confirm(`确定要移除审核员 ${username} 吗？`)) {
      removeReviewerMutation.mutate(reviewerId)
    }
  }

  // 统计数据
  const stats = {
    total: reviewers?.length || 0,
    primary: reviewers?.filter(r => r.role === 'PRIMARY_REVIEWER').length || 0,
    secondary: reviewers?.filter(r => r.role === 'SECONDARY_REVIEWER').length || 0,
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PRIMARY_REVIEWER':
        return <Badge variant="default">初审员</Badge>
      case 'SECONDARY_REVIEWER':
        return <Badge variant="secondary">复审员</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总审核员</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">所有审核员</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">初审员</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.primary}</div>
            <p className="text-xs text-muted-foreground">负责初审</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">复审员</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.secondary}</div>
            <p className="text-xs text-muted-foreground">负责复审</p>
          </CardContent>
        </Card>
      </div>

      {/* 审核员列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>审核员列表</CardTitle>
              <CardDescription>管理该考试的审核员</CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              添加审核员
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!reviewers || reviewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">暂无审核员</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                添加审核员
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>分配时间</TableHead>
                    <TableHead>分配人</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewers.map((reviewer) => (
                    <TableRow key={reviewer.id}>
                      <TableCell className="font-medium">{reviewer.username}</TableCell>
                      <TableCell>{reviewer.email}</TableCell>
                      <TableCell>{getRoleBadge(reviewer.role)}</TableCell>
                      <TableCell>
                        {reviewer.assignedAt
                          ? new Date(reviewer.assignedAt).toLocaleString('zh-CN')
                          : '-'}
                      </TableCell>
                      <TableCell>{reviewer.assignedBy || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveReviewer(reviewer.id, reviewer.username)}
                          disabled={removeReviewerMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加审核员对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加审核员</DialogTitle>
            <DialogDescription>
              为该考试分配审核员，审核员将能够审核该考试的报名申请
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择用户</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>审核角色</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as 'PRIMARY_REVIEWER' | 'SECONDARY_REVIEWER')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIMARY_REVIEWER">初审员</SelectItem>
                  <SelectItem value="SECONDARY_REVIEWER">复审员</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {selectedRole === 'PRIMARY_REVIEWER'
                  ? '初审员负责对报名申请进行初步审核'
                  : '复审员负责对初审通过的申请进行复审'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddReviewer} disabled={addReviewerMutation.isPending}>
              {addReviewerMutation.isPending ? '添加中...' : '确认添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


