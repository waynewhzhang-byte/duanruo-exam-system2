'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Edit, Trash2, Users, DoorOpen } from 'lucide-react'
import { useExamVenues, useDeleteVenue } from '@/lib/api-hooks'
import { toast } from 'sonner'
import CreateVenueDialog from './CreateVenueDialog'
import EditVenueDialog from './EditVenueDialog'
import RoomManagement from './RoomManagement'
import { useTenant } from '@/hooks/useTenant'

interface ExamVenuesProps {
  examId: string
}

export default function ExamVenues({ examId }: ExamVenuesProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [roomManagementVenue, setRoomManagementVenue] = useState<any>(null)

  const { tenant } = useTenant()
  const { data: venuesData, isLoading, refetch } = useExamVenues(examId, tenant?.id)
  const deleteVenueMutation = useDeleteVenue()

  const venues = venuesData?.items || []

  const handleEditVenue = (venue: any) => {
    setSelectedVenue(venue)
    setEditDialogOpen(true)
  }

  const handleDeleteVenue = async (venue: any) => {
    if (!confirm(`确定要删除考场"${venue.name}"吗？删除后将无法恢复。`)) {
      return
    }

    if (!tenant?.id) {
      toast.error('租户信息未找到')
      return
    }

    try {
      await deleteVenueMutation.mutateAsync({ venueId: venue.venueId, tenantId: tenant.id })
      toast.success('考场删除成功')
      refetch()
    } catch (error: any) {
      toast.error(error?.message || '删除失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>考场管理</CardTitle>
            <CardDescription>配置考试的考场信息和座位分配</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加考场
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : venues.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">暂无考场</p>
            <p className="text-xs text-muted-foreground mt-1">点击"添加考场"按钮创建考场</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue: any) => (
              <div
                key={venue.venueId}
                className="p-4 border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{venue.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>容量: {venue.capacity} 人</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoomManagementVenue(venue)}
                    className="flex-1"
                  >
                    <DoorOpen className="h-3 w-3 mr-1" />
                    教室
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditVenue(venue)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteVenue(venue)}
                    disabled={deleteVenueMutation.isPending}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Venue Dialog */}
      {tenant?.id && (
        <CreateVenueDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          examId={examId}
          tenantId={tenant.id}
          onSuccess={() => {
            refetch()
            setCreateDialogOpen(false)
          }}
        />
      )}

      {/* Edit Venue Dialog */}
      {selectedVenue && tenant?.id && (
        <EditVenueDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          venue={selectedVenue}
          tenantId={tenant.id}
          onSuccess={() => {
            refetch()
            setEditDialogOpen(false)
            setSelectedVenue(null)
          }}
        />
      )}

      {/* Room Management Dialog */}
      {roomManagementVenue && (
        <RoomManagement
          venueId={roomManagementVenue.venueId}
          venueName={roomManagementVenue.name}
          onClose={() => setRoomManagementVenue(null)}
        />
      )}
    </Card>
  )
}

