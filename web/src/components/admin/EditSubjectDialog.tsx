'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useUpdateSubject } from '@/lib/api-hooks'
import { Loader2 } from 'lucide-react'

const SubjectFormSchema = z.object({
  name: z.string().min(1, '科目名称不能为空').max(100, '科目名称最多100个字符'),
  duration: z.number().min(1, '考试时长必须大于0').max(480, '考试时长不能超过480分钟'),
  type: z.enum(['WRITTEN', 'INTERVIEW'], { message: '请选择科目类型' }),
  maxScore: z.number().min(1, '满分必须大于0').max(1000, '满分不能超过1000'),
  passingScore: z.number().min(0, '及格分不能为负数'),
  weight: z.number().min(0, '权重不能为负数').max(1, '权重不能超过1'),
  ordering: z.number().min(1, '排序必须大于0'),
  schedule: z.string().min(1, '考试时间不能为空'),
})

type SubjectFormData = z.infer<typeof SubjectFormSchema>

interface EditSubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: any
  onSuccess: () => void
}

export default function EditSubjectDialog({
  open,
  onOpenChange,
  subject,
  onSuccess,
}: EditSubjectDialogProps) {
  const updateMutation = useUpdateSubject()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SubjectFormData>({
    resolver: zodResolver(SubjectFormSchema),
  })

  const subjectType = watch('type')

  // Reset form when subject changes
  useEffect(() => {
    if (subject) {
      // 将后端的datetime格式转换为datetime-local格式
      let scheduleValue = subject.schedule || ''
      if (scheduleValue && scheduleValue.includes(' ')) {
        scheduleValue = scheduleValue.replace(' ', 'T').substring(0, 16)
      }

      reset({
        name: subject.name || '',
        duration: subject.duration || subject.durationMinutes || 120,
        type: subject.type || 'WRITTEN',
        maxScore: subject.maxScore || 100,
        passingScore: subject.passingScore || 60,
        weight: subject.weight || 0.5,
        ordering: subject.ordering || 1,
        schedule: scheduleValue,
      })
    }
  }, [subject, reset])

  const onSubmit = async (data: SubjectFormData) => {
    try {
      // 转换datetime-local格式为后端需要的格式 (yyyy-MM-dd HH:mm:ss)
      const scheduleFormatted = data.schedule.includes('T')
        ? data.schedule.replace('T', ' ') + ':00'
        : data.schedule

      const payload = {
        ...data,
        schedule: scheduleFormatted,
      }

      await updateMutation.mutateAsync({ subjectId: subject.id, data: payload })
      toast.success('科目更新成功')
      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || '更新失败，请重试')
    }
  }

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑科目</DialogTitle>
          <DialogDescription>
            更新科目 "{subject?.name}" 的信息
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 科目名称 */}
            <div className="col-span-2">
              <Label htmlFor="name">科目名称 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="例如：Java编程基础"
                disabled={updateMutation.isPending}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* 科目类型 */}
            <div>
              <Label htmlFor="type">科目类型 *</Label>
              <Select
                value={subjectType}
                onValueChange={(value) => setValue('type', value as 'WRITTEN' | 'INTERVIEW')}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择科目类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WRITTEN">笔试</SelectItem>
                  <SelectItem value="INTERVIEW">面试</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* 考试时长 */}
            <div>
              <Label htmlFor="duration">考试时长（分钟） *</Label>
              <Input
                id="duration"
                type="number"
                {...register('duration', { valueAsNumber: true })}
                placeholder="120"
                disabled={updateMutation.isPending}
              />
              {errors.duration && (
                <p className="text-sm text-red-500 mt-1">{errors.duration.message}</p>
              )}
            </div>

            {/* 满分 */}
            <div>
              <Label htmlFor="maxScore">满分 *</Label>
              <Input
                id="maxScore"
                type="number"
                {...register('maxScore', { valueAsNumber: true })}
                placeholder="100"
                disabled={updateMutation.isPending}
              />
              {errors.maxScore && (
                <p className="text-sm text-red-500 mt-1">{errors.maxScore.message}</p>
              )}
            </div>

            {/* 及格分 */}
            <div>
              <Label htmlFor="passingScore">及格分 *</Label>
              <Input
                id="passingScore"
                type="number"
                {...register('passingScore', { valueAsNumber: true })}
                placeholder="60"
                disabled={updateMutation.isPending}
              />
              {errors.passingScore && (
                <p className="text-sm text-red-500 mt-1">{errors.passingScore.message}</p>
              )}
            </div>

            {/* 权重 */}
            <div>
              <Label htmlFor="weight">权重（0-1） *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                {...register('weight', { valueAsNumber: true })}
                placeholder="0.5"
                disabled={updateMutation.isPending}
              />
              {errors.weight && (
                <p className="text-sm text-red-500 mt-1">{errors.weight.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                用于计算总成绩，所有科目权重之和应为1
              </p>
            </div>

            {/* 排序 */}
            <div>
              <Label htmlFor="ordering">排序 *</Label>
              <Input
                id="ordering"
                type="number"
                {...register('ordering', { valueAsNumber: true })}
                placeholder="1"
                disabled={updateMutation.isPending}
              />
              {errors.ordering && (
                <p className="text-sm text-red-500 mt-1">{errors.ordering.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                数字越小越靠前
              </p>
            </div>

            {/* 考试时间 */}
            <div className="col-span-2">
              <Label htmlFor="schedule">考试时间 *</Label>
              <Input
                id="schedule"
                type="datetime-local"
                {...register('schedule')}
                disabled={updateMutation.isPending}
              />
              {errors.schedule && (
                <p className="text-sm text-red-500 mt-1">{errors.schedule.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                格式：yyyy-MM-dd HH:mm:ss（Asia/Shanghai时区）
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateMutation.isPending}
            >
              取消
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

