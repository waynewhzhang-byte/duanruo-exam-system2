'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateTenant } from '@/lib/api-hooks'
import { UpdateTenantRequest, UpdateTenantRequestType, TenantType } from '@/lib/schemas'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: TenantType
  onSuccess: () => void
}

export default function EditTenantDialog({ open, onOpenChange, tenant, onSuccess }: EditTenantDialogProps) {
  const updateMutation = useUpdateTenant()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTenantRequestType>({
    resolver: zodResolver(UpdateTenantRequest),
    defaultValues: {
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone || '',
      description: tenant.description || '',
    },
  })

  // Reset form when tenant changes
  useEffect(() => {
    reset({
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone || '',
      description: tenant.description || '',
    })
  }, [tenant, reset])

  const onSubmit = async (data: UpdateTenantRequestType) => {
    try {
      await updateMutation.mutateAsync({ id: tenant.id, data })
      toast.success('租户更新成功')
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
          <DialogTitle>编辑租户</DialogTitle>
          <DialogDescription>
            更新租户的基本信息。租户代码不可修改。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">租户代码</Label>
            <Input
              id="code"
              value={tenant.code}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              租户代码不可修改
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">租户名称 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="例如：2024年公务员考试"
              disabled={updateMutation.isPending}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">联系邮箱 *</Label>
            <Input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              placeholder="例如：admin@example.com"
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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

