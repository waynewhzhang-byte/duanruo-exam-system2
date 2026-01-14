'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateVenue } from '@/lib/api-hooks'
import { UpdateVenueRequest, UpdateVenueRequestType } from '@/lib/schemas'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditVenueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venue: any
  tenantId: string
  onSuccess: () => void
}

export default function EditVenueDialog({ open, onOpenChange, venue, tenantId, onSuccess }: Readonly<EditVenueDialogProps>) {
  const updateMutation = useUpdateVenue()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateVenueRequestType>({
    resolver: zodResolver(UpdateVenueRequest),
    defaultValues: {
      name: venue.name || '',
      capacity: venue.capacity || undefined,
    },
  })

  // Reset form when venue changes
  useEffect(() => {
    reset({
      name: venue.name || '',
      capacity: venue.capacity || undefined,
    })
  }, [venue, reset])

  const onSubmit = async (data: UpdateVenueRequestType) => {
    try {
      await updateMutation.mutateAsync({ venueId: venue.venueId, data, tenantId })
      toast.success('考场更新成功')
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑考场</DialogTitle>
          <DialogDescription>
            更新考场的基本信息
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">考场名称 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="例如：第一考场"
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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

