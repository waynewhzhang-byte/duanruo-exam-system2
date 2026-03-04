'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useUpdateExam, useUpdateExamAnnouncement, useOpenExam, useCloseExam } from '@/lib/api-hooks'
import { useTenant } from '@/hooks/useTenant'
import { CheckCircle, XCircle, Save, Wallet, Edit } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface ExamBasicInfoProps {
  exam: any
  examId: string
}

export default function ExamBasicInfo({ exam, examId }: ExamBasicInfoProps) {
  const { tenant } = useTenant()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: exam.title || '',
    description: exam.description || '',
    code: exam.code || '',
    urlSuffix: exam.slug || '',
    registrationStart: exam.registrationStart || '',
    registrationEnd: exam.registrationEnd || '',
    feeRequired: exam.feeRequired || false,
    feeAmount: exam.feeAmount || 0,
  })
  const [announcement, setAnnouncement] = useState(exam.announcement || '')

  const updateExamMutation = useUpdateExam()
  const updateAnnouncementMutation = useUpdateExamAnnouncement()
  const openExamMutation = useOpenExam()
  const closeExamMutation = useCloseExam()

  const handleSaveBasicInfo = async () => {
    if (!tenant?.id) {
      toast.error('租户信息缺失，请刷新页面重试')
      return
    }

    try {
      // 构建请求数据，过滤掉空字符串的日期字段，并映射字段名
      const requestData: Record<string, any> = {
        title: formData.title || undefined,
        description: formData.description || undefined,
        slug: formData.urlSuffix || undefined,
        feeRequired: formData.feeRequired,
        feeAmount: formData.feeRequired ? (formData.feeAmount || 0) : 0,
      }

      // 只在有有效值时添加日期字段
      if (formData.registrationStart && formData.registrationStart.trim() !== '') {
        requestData.registrationStart = formData.registrationStart
      }
      if (formData.registrationEnd && formData.registrationEnd.trim() !== '') {
        requestData.registrationEnd = formData.registrationEnd
      }

      await updateExamMutation.mutateAsync({
        examId,
        data: requestData,
        tenantId: tenant.id,
      })
      toast.success('基本信息保存成功')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    }
  }

  const handleSaveAnnouncement = async () => {
    if (!tenant?.id) {
      toast.error('租户信息缺失，请刷新页面重试')
      return
    }

    try {
      await updateAnnouncementMutation.mutateAsync({
        examId,
        announcement,
        tenantId: tenant.id,
      })
      toast.success('公告保存成功')
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    }
  }

  const handleOpenExam = async () => {
    if (!tenant?.id) {
      toast.error('租户信息缺失，请刷新页面重试')
      return
    }

    try {
      await openExamMutation.mutateAsync({ examId, tenantId: tenant.id })
      toast.success('考试已开放报名')
    } catch (error: any) {
      toast.error(error?.message || '操作失败')
    }
  }

  const handleCloseExam = async () => {
    if (!tenant?.id) {
      toast.error('租户信息缺失，请刷新页面重试')
      return
    }

    try {
      await closeExamMutation.mutateAsync({ examId, tenantId: tenant.id })
      toast.success('考试已关闭报名')
    } catch (error: any) {
      toast.error(error?.message || '操作失败')
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: '草稿', description: '考试尚未开放报名，可以继续编辑' }
      case 'OPEN':
        return { label: '开放报名', description: '考生可以提交报名申请' }
      case 'CLOSED':
        return { label: '报名关闭', description: '报名已截止，等待考试开始' }
      case 'IN_PROGRESS':
        return { label: '考试进行中', description: '考试正在进行' }
      case 'COMPLETED':
        return { label: '已完成', description: '考试已结束' }
      default:
        return { label: status, description: '' }
    }
  }

  const statusDisplay = getStatusDisplay(exam.status)
  const canOpenExam = exam.status === 'DRAFT'
  const canCloseExam = exam.status === 'OPEN'

  return (
    <div className="space-y-6">
      {/* 状态控制 */}
      <Card>
        <CardHeader>
          <CardTitle>考试状态</CardTitle>
          <CardDescription>控制考试的报名开放状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">当前状态: {statusDisplay.label}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusDisplay.description}
              </p>
            </div>
            <div className="flex gap-2">
              {canCloseExam && (
                <Button
                  variant="outline"
                  onClick={handleCloseExam}
                  disabled={closeExamMutation.isPending || !tenant?.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  关闭报名
                </Button>
              )}
              {canOpenExam && (
                <Button
                  onClick={handleOpenExam}
                  disabled={openExamMutation.isPending || !tenant?.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  开放报名
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card shadow-sm>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>考试的基本信息和报名收费配置</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑配置
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">考试标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={!isEditing}
                placeholder="请输入考试名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">考试代码 *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!isEditing}
                placeholder="例如: TECH-2026-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationStart">报名开始时间</Label>
              <Input
                id="registrationStart"
                type="datetime-local"
                value={formData.registrationStart?.replace(' ', 'T').slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value.replace('T', ' ') + ':00' })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationEnd">报名结束时间</Label>
              <Input
                id="registrationEnd"
                type="datetime-local"
                value={formData.registrationEnd?.replace(' ', 'T').slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value.replace('T', ' ') + ':00' })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <div className="space-y-0.5">
                  <Label className="text-base">报名费设置</Label>
                  <p className="text-sm text-muted-foreground">开启后，考生通过审核后需完成支付方可生成准考证</p>
                </div>
              </div>
              <Switch 
                checked={formData.feeRequired}
                onCheckedChange={(checked) => setFormData({ ...formData, feeRequired: checked })}
                disabled={!isEditing}
              />
            </div>
            
            {formData.feeRequired && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="feeAmount">收费金额（人民币元）</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">¥</span>
                    <Input
                      id="feeAmount"
                      type="number"
                      className="pl-7"
                      value={formData.feeAmount}
                      onChange={(e) => setFormData({ ...formData, feeAmount: parseFloat(e.target.value) || 0 })}
                      disabled={!isEditing}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="description">考试描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!isEditing}
              rows={3}
              placeholder="请输入考试的详细描述信息"
            />
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveBasicInfo} disabled={updateExamMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                保存基础信息
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                取消
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 考试公告 */}
      <Card>
        <CardHeader>
          <CardTitle>考试公告</CardTitle>
          <CardDescription>向候选人展示的考试公告信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={8}
            placeholder="输入考试公告内容..."
          />
          <Button onClick={handleSaveAnnouncement} disabled={updateAnnouncementMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            保存公告
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

