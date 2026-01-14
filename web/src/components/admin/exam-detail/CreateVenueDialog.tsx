'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateVenue } from '@/lib/api-hooks'
import { CreateVenueRequest, CreateVenueRequestType } from '@/lib/schemas'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreateVenueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examId: string
  tenantId: string
  onSuccess: () => void
}

export default function CreateVenueDialog({ open, onOpenChange, examId, tenantId, onSuccess }: Readonly<CreateVenueDialogProps>) {
  const createMutation = useCreateVenue()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateVenueRequestType>({
    resolver: zodResolver(CreateVenueRequest),
    defaultValues: {
      name: '',
      capacity: undefined,
    },
  })

  const onSubmit = async (data: CreateVenueRequestType) => {
    try {
      await createMutation.mutateAsync({ examId, data, tenantId })
      toast.success('考场创建成功')
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建考场</DialogTitle>
          <DialogDescription>
            为本次考试创建一个新的考场
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">考场名称 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="例如：第一考场"
              disabled={createMutation.isPending}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">考场容量 *</Label>
            <Input
              id="capacity"
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              placeholder="例如：100"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              该考场可容纳的考生人数
            </p>
            {errors.capacity && (
              <p className="text-sm text-destructive">{errors.capacity.message}</p>
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

