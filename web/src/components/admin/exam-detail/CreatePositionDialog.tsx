'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreatePosition } from '@/lib/api-hooks'
import { CreatePositionRequest, CreatePositionRequestType } from '@/lib/schemas'
import { useTenant } from '@/hooks/useTenant'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreatePositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examId: string
  onSuccess: () => void
}

export default function CreatePositionDialog({ open, onOpenChange, examId, onSuccess }: CreatePositionDialogProps) {
  const createMutation = useCreatePosition()
  const { tenant } = useTenant()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePositionRequestType>({
    resolver: zodResolver(CreatePositionRequest),
    defaultValues: {
      examId,
    },
  })

  const onSubmit = async (data: CreatePositionRequestType) => {
    try {
      if (!tenant?.id) {
        toast.error('租户信息未加载')
        return
      }
      await createMutation.mutateAsync({ ...data, tenantId: tenant.id })
      toast.success('岗位创建成功')
      reset({ examId })
      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || '创建失败')
    }
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      reset({ examId })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>创建岗位</DialogTitle>
          <DialogDescription>
            为本次考试创建一个新的招聘岗位
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">岗位代码 *</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="例如：DEV001"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              岗位的唯一标识码
            </p>
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">岗位名称 *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="例如：软件开发工程师"
              disabled={createMutation.isPending}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quota">招聘人数</Label>
            <Input
              id="quota"
              type="number"
              {...register('quota', { valueAsNumber: true })}
              placeholder="例如：10"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              本岗位计划招聘的人数
            </p>
            {errors.quota && (
              <p className="text-sm text-destructive">{errors.quota.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">岗位描述</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="岗位的详细描述..."
              rows={3}
              disabled={createMutation.isPending}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">任职要求</Label>
            <Textarea
              id="requirements"
              {...register('requirements')}
              placeholder="岗位的任职要求..."
              rows={4}
              disabled={createMutation.isPending}
            />
            {errors.requirements && (
              <p className="text-sm text-destructive">{errors.requirements.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

