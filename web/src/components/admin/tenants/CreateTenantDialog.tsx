'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTenant } from '@/lib/api-hooks'
import { CreateTenantRequest, CreateTenantRequestType } from '@/lib/schemas'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreateTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateTenantDialog({ open, onOpenChange, onSuccess }: CreateTenantDialogProps) {
  const createMutation = useCreateTenant()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTenantRequestType>({
    resolver: zodResolver(CreateTenantRequest),
  })

  const onSubmit = async (data: CreateTenantRequestType) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('租户创建成功')
      reset()
      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || '创建失败')
    }
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>创建租户</DialogTitle>
          <DialogDescription>
            创建一个新的租户实例。租户代码创建后不可修改。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">租户名称 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="例如：2024年公务员考试"
              disabled={createMutation.isPending}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">租户代码 *</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="例如：exam-2024（仅小写字母、数字、下划线和连字符）"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              租户代码用于生成数据库schema和URL，创建后不可修改
            </p>
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">联系邮箱 *</Label>
            <Input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              placeholder="例如：admin@example.com"
              disabled={createMutation.isPending}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">联系电话</Label>
            <Input
              id="contactPhone"
              {...register('contactPhone')}
              placeholder="例如：13800138000"
              disabled={createMutation.isPending}
            />
            {errors.contactPhone && (
              <p className="text-sm text-destructive">{errors.contactPhone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="租户的详细描述..."
              rows={3}
              disabled={createMutation.isPending}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
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

