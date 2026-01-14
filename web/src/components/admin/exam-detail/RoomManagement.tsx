'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant, apiPostWithTenant, apiPutWithTenant, apiDeleteWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, DoorOpen, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useTenant } from '@/hooks/useTenant'

interface Room {
  roomId: string
  venueId: string
  name: string
  code: string
  capacity: number
  floor?: number
  description?: string
}

interface RoomManagementProps {
  venueId: string
  venueName: string
  onClose: () => void
}

export default function RoomManagement({ venueId, venueName, onClose }: RoomManagementProps) {
  const queryClient = useQueryClient()
  const { tenant } = useTenant()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 30,
    floor: 1,
    description: '',
  })

  // Fetch rooms
  const { data: roomsData, isLoading, refetch } = useQuery<{ items: Room[], total: number, totalCapacity: number }>({
    queryKey: ['venue-rooms', venueId],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiGetWithTenant<{ items: Room[], total: number, totalCapacity: number }>(
        `/venues/${venueId}/rooms`,
        tenant.id
      )
    },
    enabled: !!venueId && !!tenant?.id,
  })

  const rooms = roomsData?.items || []
  const totalCapacity = roomsData?.totalCapacity || 0

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiPostWithTenant(`/venues/${venueId}/rooms`, tenant.id, data)
    },
    onSuccess: () => {
      toast.success('教室创建成功')
      refetch()
      setCreateDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建失败')
    },
  })

  // Update room mutation
  const updateMutation = useMutation({
    mutationFn: async ({ roomId, data }: { roomId: string, data: typeof formData }) => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiPutWithTenant(`/rooms/${roomId}`, tenant.id, data)
    },
    onSuccess: () => {
      toast.success('教室更新成功')
      refetch()
      setEditDialogOpen(false)
      setSelectedRoom(null)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败')
    },
  })

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: async (roomId: string) => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiDeleteWithTenant(`/rooms/${roomId}`, tenant.id)
    },
    onSuccess: () => {
      toast.success('教室删除成功')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || '删除失败')
    },
  })

  const resetForm = () => {
    setFormData({ name: '', code: '', capacity: 30, floor: 1, description: '' })
  }

  const handleCreate = () => {
    createMutation.mutate(formData)
  }

  const handleUpdate = () => {
    if (!selectedRoom) return
    updateMutation.mutate({ roomId: selectedRoom.roomId, data: formData })
  }

  const handleDelete = (room: Room) => {
    if (!confirm(`确定要删除教室"${room.name}"吗？`)) return
    deleteMutation.mutate(room.roomId)
  }

  const openEditDialog = (room: Room) => {
    setSelectedRoom(room)
    setFormData({
      name: room.name,
      code: room.code,
      capacity: room.capacity,
      floor: room.floor || 1,
      description: room.description || '',
    })
    setEditDialogOpen(true)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            教室管理 - {venueName}
          </DialogTitle>
          <DialogDescription>
            管理考场下的教室，设置教室编码和容量。座位分配时将按教室分配座位。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">教室数量</p>
                <p className="text-2xl font-bold">{rooms.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总容量</p>
                <p className="text-2xl font-bold">{totalCapacity}</p>
              </div>
            </div>
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              添加教室
            </Button>
          </div>

          {/* Rooms Table */}
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">加载中...</p>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">暂无教室</p>
              <p className="text-sm text-muted-foreground">点击"添加教室"按钮创建教室</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>教室名称</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead className="text-right">容量</TableHead>
                  <TableHead>楼层</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.roomId}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{room.code}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {room.capacity}
                      </div>
                    </TableCell>
                    <TableCell>{room.floor || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(room)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(room)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>

      {/* Create Room Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加教室</DialogTitle>
            <DialogDescription>为考场添加新的教室</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">教室名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：101教室"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">教室编码 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="如：101"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">容量 *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">楼层</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.name || !formData.code}>
              {createMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑教室</DialogTitle>
            <DialogDescription>修改教室信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">教室名称 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">教室编码 *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">容量 *</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-floor">楼层</Label>
                <Input
                  id="edit-floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending || !formData.name || !formData.code}>
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

