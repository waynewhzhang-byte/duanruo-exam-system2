'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useCreateSubject } from '@/lib/api-hooks'
import { useTenant } from '@/hooks/useTenant'

const SubjectFormSchema = z.object({
  name: z.string().min(1, '科目名称不能为空').max(100, '科目名称最多100个字符'),
  durationMinutes: z.number().min(1, '考试时长必须大于0').max(480, '考试时长不能超过480分钟'),
  type: z.enum(['WRITTEN', 'INTERVIEW'], { message: '请选择科目类型' }),
  maxScore: z.number().min(1, '满分必须大于0').max(1000, '满分不能超过1000'),
  passingScore: z.number().min(0, '及格分不能为负数'),
  weight: z.number().min(0, '权重不能为负数').max(1, '权重不能超过1'),
  ordering: z.number().min(1, '排序必须大于0'),
  schedule: z.string().min(1, '考试时间不能为空'),
})

type SubjectFormData = z.infer<typeof SubjectFormSchema>

interface CreateSubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  positionId: string
  positionTitle: string
  onSuccess: () => void
}

export default function CreateSubjectDialog({
  open,
  onOpenChange,
  positionId,
  positionTitle,
  onSuccess,
}: CreateSubjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { tenant } = useTenant()
  const createSubjectMutation = useCreateSubject()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SubjectFormData>({
    resolver: zodResolver(SubjectFormSchema),
    defaultValues: {
      name: '',
      durationMinutes: 120,
      type: 'WRITTEN',
      maxScore: 100,
      passingScore: 60,
      weight: 0.5,
      ordering: 1,
      schedule: '',
    },
  })

  const subjectType = watch('type')

  const onSubmit = async (data: SubjectFormData) => {
    if (!tenant?.id) {
      toast.error('租户信息缺失')
      return
    }

    setIsSubmitting(true)
    try {
      // 转换datetime-local格式为后端需要的格式 (yyyy-MM-dd HH:mm:ss)
      const scheduleFormatted = data.schedule.replace('T', ' ') + ':00'

      const payload = {
        ...data,
        schedule: scheduleFormatted,
      }

      await createSubjectMutation.mutateAsync({
        positionId,
        data: payload,
        tenantId: tenant.id,
      })
      toast.success('科目创建成功')
      reset()
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || '创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建科目</DialogTitle>
          <DialogDescription>
            为岗位 "{positionTitle}" 创建新的考试科目
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
              <Label htmlFor="durationMinutes">考试时长（分钟） *</Label>
              <Input
                id="durationMinutes"
                type="number"
                {...register('durationMinutes', { valueAsNumber: true })}
                placeholder="120"
              />
              {errors.durationMinutes && (
                <p className="text-sm text-red-500 mt-1">{errors.durationMinutes.message}</p>
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '创建中...' : '创建科目'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

