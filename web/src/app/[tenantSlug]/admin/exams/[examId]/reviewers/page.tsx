/**
 * Exam Reviewer Management Page
 * 考试审核员管理页面 - 为特定考试配置审核员
 */

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, UserPlus, Trash2, Shield, Mail, User, AlertCircle } from 'lucide-react'
import {
  useExamReviewers,
  useAvailableReviewers,
  useAddReviewer,
  useRemoveReviewer,
} from '@/lib/api-hooks'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { PermissionCodes } from '@/lib/permissions-unified'
import { toast } from 'sonner'
import type { ReviewerRole } from '@/lib/schemas'
import { useTenant } from '@/hooks/useTenant'

export default function ExamReviewersPage() {
  return (
    <RouteGuard roles={['TENANT_ADMIN', 'EXAM_ADMIN']} permissions={[PermissionCodes.EXAM_ADMIN_MANAGE]}>
      <ExamReviewersContent />
    </RouteGuard>
  )
}

function ExamReviewersContent() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string
  const { tenant } = useTenant()

  const { data: reviewers = [], isLoading: reviewersLoading } = useExamReviewers(examId)
  const { data: availableUsers = [], isLoading: availableLoading } = useAvailableReviewers(examId)
  const addReviewer = useAddReviewer()
  const removeReviewer = useRemoveReviewer()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<ReviewerRole>('PRIMARY_REVIEWER')
  const [reviewerToRemove, setReviewerToRemove] = useState<{ id: string; role: string; name: string } | null>(null)

  const primaryReviewers = reviewers.filter(r => r.role === 'PRIMARY_REVIEWER')
  const secondaryReviewers = reviewers.filter(r => r.role === 'SECONDARY_REVIEWER')

  const handleAddReviewer = async () => {
    if (!selectedUserId) {
      toast.error('请选择用户')
      return
    }

    if (!tenant?.id) {
      toast.error('缺少租户信息，请刷新页面后重试')
      return
    }

    try {
      await addReviewer.mutateAsync({
        examId,
        userId: selectedUserId,
        role: selectedRole,
        tenantId: tenant.id,
      })
      toast.success('审核员添加成功')
      setIsAddDialogOpen(false)
      setSelectedUserId('')
      setSelectedRole('PRIMARY_REVIEWER')
    } catch (error: any) {
      toast.error(error?.message || '添加失败')
    }
  }

  const handleRemoveReviewer = async () => {
    if (!reviewerToRemove) return

    if (!tenant?.id) {
      toast.error('缺少租户信息，请刷新页面后重试')
      return
    }

    try {
      await removeReviewer.mutateAsync({
        examId,
        reviewerId: reviewerToRemove.id,
        role: reviewerToRemove.role,
        tenantId: tenant.id,
      })
      toast.success('审核员移除成功')
      setReviewerToRemove(null)
    } catch (error: any) {
      toast.error(error?.message || '移除失败')
    }
  }

  if (reviewersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/detail`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回考试详情
          </Button>
          <div>
            <h1 className="text-2xl font-bold">审核员管理</h1>
            <p className="text-sm text-muted-foreground">
              为本考试配置一级和二级审核员
            </p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              添加审核员
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加审核员</DialogTitle>
              <DialogDescription>
                从可用用户中选择一位审核员并分配审核级别
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">选择用户 *</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择用户" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Spinner size="sm" />
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        暂无可用用户
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{user.fullName}</span>
                            <span className="text-muted-foreground">({user.email})</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">审核级别 *</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ReviewerRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIMARY_REVIEWER">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>一级审核员（初审）</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="SECONDARY_REVIEWER">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>二级审核员（复审）</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddReviewer} disabled={addReviewer.isPending || !selectedUserId}>
                {addReviewer.isPending ? '添加中...' : '确认添加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              一级审核员
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{primaryReviewers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              负责初步审核
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              二级审核员
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{secondaryReviewers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              负责最终复核
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              审核员总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              全部审核员
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviewers Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Reviewers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              一级审核员
            </CardTitle>
            <CardDescription>
              负责报名申请的初步审核
            </CardDescription>
          </CardHeader>
          <CardContent>
            {primaryReviewers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无一级审核员</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {primaryReviewers.map((reviewer) => (
                    <TableRow key={reviewer.id}>
                      <TableCell className="font-medium">
                        {reviewer.fullName || reviewer.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reviewer.email}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewerToRemove({
                            id: reviewer.id,
                            role: reviewer.role,
                            name: reviewer.fullName || reviewer.username || '',
                          })}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Secondary Reviewers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              二级审核员
            </CardTitle>
            <CardDescription>
              负责最终审核确认
            </CardDescription>
          </CardHeader>
          <CardContent>
            {secondaryReviewers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无二级审核员</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secondaryReviewers.map((reviewer) => (
                    <TableRow key={reviewer.id}>
                      <TableCell className="font-medium">
                        {reviewer.fullName || reviewer.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reviewer.email}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewerToRemove({
                            id: reviewer.id,
                            role: reviewer.role,
                            name: reviewer.fullName || reviewer.username || '',
                          })}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!reviewerToRemove} onOpenChange={() => setReviewerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除审核员</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要移除审核员 <strong>{reviewerToRemove?.name}</strong> 吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveReviewer}
              className="bg-red-600 hover:bg-red-700"
            >
              确认移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
