'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useUpdateExam, useUpdateExamAnnouncement, useOpenExam, useCloseExam } from '@/lib/api-hooks'
import { CheckCircle, XCircle, Save } from 'lucide-react'

interface ExamBasicInfoProps {
  exam: any
  examId: string
}

export default function ExamBasicInfo({ exam, examId }: ExamBasicInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: exam.title || '',
    description: exam.description || '',
    code: exam.code || '',
    urlSuffix: exam.urlSuffix || '',
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
    try {
      await updateExamMutation.mutateAsync({
        examId,
        data: formData,
      })
      toast.success('基本信息保存成功')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    }
  }

  const handleSaveAnnouncement = async () => {
    try {
      await updateAnnouncementMutation.mutateAsync({
        examId,
        announcement,
      })
      toast.success('公告保存成功')
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    }
  }

  const handleOpenExam = async () => {
    try {
      await openExamMutation.mutateAsync(examId)
      toast.success('考试已开放报名')
    } catch (error: any) {
      toast.error(error?.message || '操作失败')
    }
  }

  const handleCloseExam = async () => {
    try {
      await closeExamMutation.mutateAsync(examId)
      toast.success('考试已关闭报名')
    } catch (error: any) {
      toast.error(error?.message || '操作失败')
    }
  }

  const isOpen = exam.status === 'OPEN'

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
              <p className="font-medium">当前状态: {isOpen ? '报名开放' : '报名关闭'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isOpen ? '候选人可以提交报名申请' : '候选人无法提交报名申请'}
              </p>
            </div>
            <div className="flex gap-2">
              {isOpen ? (
                <Button
                  variant="outline"
                  onClick={handleCloseExam}
                  disabled={closeExamMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  关闭报名
                </Button>
              ) : (
                <Button
                  onClick={handleOpenExam}
                  disabled={openExamMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  开放报名
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>考试的基本信息和配置</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                编辑
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">考试标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="code">考试代码 *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="urlSuffix">URL后缀</Label>
              <Input
                id="urlSuffix"
                value={formData.urlSuffix}
                onChange={(e) => setFormData({ ...formData, urlSuffix: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="feeAmount">报名费用（元）</Label>
              <Input
                id="feeAmount"
                type="number"
                value={formData.feeAmount}
                onChange={(e) => setFormData({ ...formData, feeAmount: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="registrationStart">报名开始时间</Label>
              <Input
                id="registrationStart"
                type="datetime-local"
                value={formData.registrationStart?.replace(' ', 'T').slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value.replace('T', ' ') + ':00' })}
                disabled={!isEditing}
              />
            </div>
            <div>
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
          <div>
            <Label htmlFor="description">考试描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!isEditing}
              rows={4}
            />
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSaveBasicInfo} disabled={updateExamMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                保存
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

