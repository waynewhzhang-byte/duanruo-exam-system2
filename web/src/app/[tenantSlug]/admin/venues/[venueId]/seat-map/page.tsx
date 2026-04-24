'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Grid3x3, Info } from 'lucide-react'
import SeatMap, { SeatMapData, Seat, SeatStatus } from '@/components/SeatMap'
import { Spinner } from '@/components/ui/loading'
import { toast } from 'sonner'

interface SeatMapPageProps {
  params: {
    tenantSlug: string
    venueId: string
  }
}

export default function SeatMapPage({ params }: SeatMapPageProps) {
  const { tenantSlug, venueId } = params
  const router = useRouter()
  const queryClient = useQueryClient()

  const [rows, setRows] = useState(10)
  const [columns, setColumns] = useState(10)

  // Fetch venue details
  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      return apiGet(`/venues/${venueId}`)
    },
    enabled: !!venueId,
  })

  // Fetch seat map
  const { data: seatMap, isLoading: seatMapLoading, refetch } = useQuery<SeatMapData>({
    queryKey: ['seat-map', venueId],
    queryFn: async () => {
      return apiGet<SeatMapData>(`/venues/${venueId}/seat-map`)
    },
    enabled: !!venueId,
  })

  // Create seat map mutation
  const createSeatMapMutation = useMutation({
    mutationFn: async (data: { rows: number; columns: number }) => {
      return apiPost(`/venues/${venueId}/seat-map?rows=${data.rows}&columns=${data.columns}`, {})
    },
    onSuccess: () => {
      toast.success('座位地图创建成功')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建失败')
    },
  })

  // Update seat status mutation
  const updateSeatStatusMutation = useMutation({
    mutationFn: async (data: { row: number; col: number; status: string }) => {
      return apiPut(
        `/venues/${venueId}/seat-map/seats/${data.row}/${data.col}/status?status=${data.status}`,
        {}
      )
    },
    onSuccess: () => {
      toast.success('座位状态更新成功')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败')
    },
  })

  const handleCreateSeatMap = async () => {
    if (rows < 1 || rows > 50 || columns < 1 || columns > 50) {
      toast.error('行数和列数必须在 1-50 之间')
      return
    }

    await createSeatMapMutation.mutateAsync({ rows, columns })
  }

  const handleSeatClick = (seat: Seat) => {
    // 循环切换座位状态
    let newStatus: string
    switch (seat.status) {
      case SeatStatus.AVAILABLE:
        newStatus = 'UNAVAILABLE'
        break
      case SeatStatus.UNAVAILABLE:
        newStatus = 'AISLE'
        break
      case SeatStatus.AISLE:
        newStatus = 'AVAILABLE'
        break
      default:
        newStatus = 'AVAILABLE'
    }

    updateSeatStatusMutation.mutate({
      row: seat.row,
      col: seat.col,
      status: newStatus,
    })
  }

  if (venueLoading || seatMapLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">座位地图管理</h1>
          <p className="text-muted-foreground">{(venue as any)?.name || '考场'}</p>
        </div>
        <Badge variant="outline">容量: {(venue as any)?.capacity || 0}</Badge>
      </div>

      {/* Seat Map */}
      {!seatMap ? (
        <Card>
          <CardHeader>
            <CardTitle>创建座位地图</CardTitle>
            <CardDescription>为考场创建座位布局地图</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rows">行数</Label>
                <Input
                  id="rows"
                  type="number"
                  min={1}
                  max={50}
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                  placeholder="例如：10"
                />
                <p className="text-xs text-muted-foreground">座位地图的行数（1-50）</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="columns">列数</Label>
                <Input
                  id="columns"
                  type="number"
                  min={1}
                  max={50}
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                  placeholder="例如：10"
                />
                <p className="text-xs text-muted-foreground">座位地图的列数（1-50）</p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">💡 提示</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>创建后可以点击座位切换状态（可用/不可用/过道）</li>
                <li>建议根据实际考场布局设置行列数</li>
                <li>总座位数应不少于考场容量</li>
              </ul>
            </div>

            <Button onClick={handleCreateSeatMap} disabled={createSeatMapMutation.isPending}>
              <Grid3x3 className="h-4 w-4 mr-2" />
              {createSeatMapMutation.isPending ? '创建中...' : '创建座位地图'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>总座位数</CardDescription>
                <CardTitle className="text-3xl">{seatMap.rows * seatMap.columns}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>可用座位</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {seatMap.seats.filter((s) => s.status === SeatStatus.AVAILABLE).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>不可用</CardDescription>
                <CardTitle className="text-3xl text-gray-600">
                  {seatMap.seats.filter((s) => s.status === SeatStatus.UNAVAILABLE).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>过道</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {seatMap.seats.filter((s) => s.status === SeatStatus.AISLE).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Seat Map */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>座位布局</CardTitle>
                  <CardDescription>点击座位可切换状态：可用 → 不可用 → 过道 → 可用</CardDescription>
                </div>
                <Badge variant="outline">
                  {seatMap.rows} 行 × {seatMap.columns} 列
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <SeatMap data={seatMap} onSeatClick={handleSeatClick} editable={true} />
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                使用说明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 点击座位可以切换状态（可用/不可用/过道）</p>
              <p>• 绿色表示可用座位，灰色表示不可用，白色表示过道</p>
              <p>• 座位分配时只会使用"可用"状态的座位</p>
              <p>• 建议将走廊、柱子等位置设置为"过道"或"不可用"</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

