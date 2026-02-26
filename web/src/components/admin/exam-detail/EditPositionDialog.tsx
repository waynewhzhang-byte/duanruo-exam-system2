'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdatePosition } from '@/lib/api-hooks'
import { UpdatePositionRequest, UpdatePositionRequestType } from '@/lib/schemas'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditPositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: any
  tenantId: string
  onSuccess: () => void
}

export default function EditPositionDialog({ open, onOpenChange, position, tenantId, onSuccess }: EditPositionDialogProps) {
  const updateMutation = useUpdatePosition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatePositionRequestType>({
    resolver: zodResolver(UpdatePositionRequest),
    defaultValues: {
      title: position.title || position.name || '',
      description: position.description || '',
      requirements: position.requirements || '',
      quota: position.quota || undefined,
    },
  })

  // Reset form when position changes
  useEffect(() => {
    reset({
      title: position.title || position.name || '',
      description: position.description || '',
      requirements: position.requirements || '',
      quota: position.quota || undefined,
    })
  }, [position, reset])

  const onSubmit = async (data: UpdatePositionRequestType) => {
    try {
      await updateMutation.mutateAsync({ id: position.id, data, tenantId })
      toast.success('岗位更新成功')
      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || '更新失败')
    }
  }

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑岗位</DialogTitle>
          <DialogDescription>
            更新岗位的基本信息。岗位代码不可修改。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">岗位代码</Label>
            <Input
              id="code"
              value={position.code}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              岗位代码不可修改
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">岗位名称 *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="例如：软件开发工程师"
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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

