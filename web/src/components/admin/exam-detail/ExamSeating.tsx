'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithTenant, apiPostWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MapPin, Users, CheckCircle2, AlertTriangle, Info, RefreshCw, Settings } from 'lucide-react'
import { toast } from 'sonner'
import SeatAssignmentExport from './SeatAssignmentExport'
import { useTenant } from '@/hooks/useTenant'

interface ExamSeatingProps {
  examId: string
}

interface Venue {
  venueId: string
  name: string
  capacity: number
}

interface SeatAssignment {
  id: string
  applicationId: string
  candidateName: string
  positionTitle: string
  venueName: string
  roomName?: string      // 教室名称
  roomCode?: string      // 教室编码
  seatNo?: number        // 座位号（数字）
  seatNumber: string     // 座位标签（格式化后的，如 "考场A--101--15"）
}

interface AllocationResult {
  batchId: string
  totalCandidates: number
  totalAssigned: number
  totalVenues: number
}

// 分配策略选项
const ALLOCATION_STRATEGIES = [
  {
    value: 'POSITION_FIRST_SUBMITTED_AT',
    label: '按岗位+报名时间（默认）',
    description: '同一岗位的考生分配到同一考场，按报名时间排序',
  },
  {
    value: 'RANDOM',
    label: '随机分配',
    description: '完全随机分配座位，不考虑岗位',
  },
  {
    value: 'SUBMITTED_AT_FIRST',
    label: '按报名时间',
    description: '按报名时间顺序分配，不考虑岗位',
  },
  {
    value: 'POSITION_FIRST_RANDOM',
    label: '按岗位+随机',
    description: '同一岗位的考生分配到同一考场，但座位随机',
  },
  {
    value: 'CUSTOM_GROUP',
    label: '自定义分组',
    description: '按自定义字段分组（如毕业学校）',
  },
]

export default function ExamSeating({ examId }: ExamSeatingProps) {
  const queryClient = useQueryClient()
  const [isAllocating, setIsAllocating] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState('POSITION_FIRST_SUBMITTED_AT')
  const [showStrategySelector, setShowStrategySelector] = useState(false)
  const { tenant } = useTenant()

  // Fetch venues
  const { data: venuesData, isLoading: venuesLoading } = useQuery<{ items: Venue[], total: number }>({
    queryKey: ['exam-venues', examId],
    queryFn: async () => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      return apiGetWithTenant<any[]>(`/seating/venues?examId=${examId}`, tenant.id).then(response => ({
        items: Array.isArray(response) ? response.map((v: any) => ({
          venueId: v.id,
          name: v.name,
          capacity: v.capacity,
        })) : [],
        total: Array.isArray(response) ? response.length : 0,
      }))
    },
    enabled: !!examId && !!tenant?.id,
  })

  // Extract venues array from response
  const venues = venuesData?.items || []

  // Fetch seat assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery<SeatAssignment[]>({
    queryKey: ['seat-assignments', examId],
    queryFn: async () => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      return apiGetWithTenant<SeatAssignment[]>(`/seating/${examId}/assignments`, tenant.id)
    },
    enabled: !!examId && !!tenant?.id,
  })

  // Allocate seats mutation
  const allocateMutation = useMutation({
    mutationFn: async (strategy: string) => {
      if (!tenant?.id) {
        throw new Error('Tenant ID is required')
      }
      // 后端使用 @RequestParam，需要通过 URL 查询参数传递 strategy
      return apiPostWithTenant<AllocationResult>(
        `/seating/${examId}/allocate?strategy=${encodeURIComponent(strategy)}`,
        tenant.id
      )
    },
    onSuccess: (result) => {
      toast.success(`座位分配成功！共分配 ${result.totalAssigned} 个座位`)
      // 强制重新获取座位分配列表
      queryClient.invalidateQueries({ queryKey: ['seat-assignments', examId] })
      queryClient.invalidateQueries({ queryKey: ['exam-venues', examId] })
      // 强制重新获取，确保数据更新
      queryClient.refetchQueries({ queryKey: ['seat-assignments', examId] })
      setShowStrategySelector(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || '座位分配失败')
    },
  })

  const handleAllocate = async () => {
    const strategyLabel = ALLOCATION_STRATEGIES.find((s) => s.value === selectedStrategy)?.label || selectedStrategy

    if (!confirm(`确定要使用"${strategyLabel}"策略执行座位分配吗？此操作将覆盖现有的座位分配。`)) {
      return
    }

    setIsAllocating(true)
    try {
      await allocateMutation.mutateAsync(selectedStrategy)
    } finally {
      setIsAllocating(false)
    }
  }

  const isLoading = venuesLoading || assignmentsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalCapacity = venues?.reduce((sum, v) => sum + v.capacity, 0) || 0
  const totalAssigned = assignments?.length || 0
  const remainingCapacity = totalCapacity - totalAssigned

  // 按考场分组统计
  const venueStats = venues?.map((venue) => {
    const assigned = assignments?.filter((a) => a.venueName === venue.name).length || 0
    return {
      ...venue,
      assignedCount: assigned,
      remainingCapacity: venue.capacity - assigned,
      utilizationRate: venue.capacity > 0 ? (assigned / venue.capacity) * 100 : 0,
    }
  })

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>考场总数</CardDescription>
            <CardTitle className="text-3xl">{venues?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总容量</CardDescription>
            <CardTitle className="text-3xl">{totalCapacity}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已分配</CardDescription>
            <CardTitle className="text-3xl text-green-600">{totalAssigned}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>剩余容量</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{remainingCapacity}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Allocation Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>座位分配</CardTitle>
              <CardDescription>批量分配考场和座位，支持多种分配策略</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStrategySelector(!showStrategySelector)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showStrategySelector ? '隐藏' : '显示'}策略选项
              </Button>
              <Button onClick={handleAllocate} disabled={isAllocating || !venues || venues.length === 0}>
                {isAllocating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    分配中...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    执行分配
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy Selector */}
          {showStrategySelector && (
            <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="strategy">分配策略</Label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger id="strategy">
                    <SelectValue placeholder="选择分配策略" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOCATION_STRATEGIES.map((strategy) => (
                      <SelectItem key={strategy.value} value={strategy.value}>
                        {strategy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {ALLOCATION_STRATEGIES.find((s) => s.value === selectedStrategy)?.description}
                </p>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {!venues || venues.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>无法分配座位</strong>
                <p className="mt-2">请先在"考场管理"标签页添加考场，然后再执行座位分配。</p>
              </AlertDescription>
            </Alert>
          ) : totalAssigned === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>尚未分配座位</strong>
                <p className="mt-2">
                  点击"执行分配"按钮开始分配座位。系统将自动为所有审核通过且已缴费的考生分配考场和座位。
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>同一岗位的考生将分配到同一考场</li>
                  <li>按报名编号顺序分配座位</li>
                  <li>考虑考场容量限制</li>
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>座位分配完成</strong>
                <p className="mt-2">
                  已为 {totalAssigned} 名考生分配座位。如需重新分配，请点击"执行分配"按钮。
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Venue & Room Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>考场教室分配统计</CardTitle>
          <CardDescription>各考场和教室的座位分配情况</CardDescription>
        </CardHeader>
        <CardContent>
          {!venueStats || venueStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>暂无考场信息</p>
            </div>
          ) : (
            <div className="space-y-4">
              {venueStats.map((venue) => {
                // 获取该考场下各教室的分配情况
                const roomStats = assignments
                  ? Array.from(
                      assignments
                        .filter((a) => a.venueName === venue.name && a.roomCode)
                        .reduce((map, a) => {
                          const key = a.roomCode || 'unknown'
                          if (!map.has(key)) {
                            map.set(key, { roomCode: a.roomCode, roomName: a.roomName, count: 0 })
                          }
                          map.get(key)!.count++
                          return map
                        }, new Map<string, { roomCode?: string; roomName?: string; count: number }>())
                        .values()
                    )
                  : []

                return (
                  <div key={venue.venueId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{venue.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>容量: {venue.capacity}</span>
                        <Badge variant={venue.assignedCount > 0 ? 'default' : 'outline'}>
                          已分配: {venue.assignedCount}
                        </Badge>
                        <Badge
                          variant={
                            venue.utilizationRate >= 90
                              ? 'destructive'
                              : venue.utilizationRate >= 70
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {venue.utilizationRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    {roomStats.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {roomStats.map((room) => (
                          <div
                            key={room.roomCode}
                            className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                          >
                            <span className="font-medium">{room.roomName || room.roomCode}</span>
                            <Badge variant="secondary" className="ml-2">
                              {room.count}人
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无教室分配数据</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      {assignments && assignments.length > 0 && (
        <SeatAssignmentExport examId={examId} assignments={assignments} />
      )}

      {/* Seat Assignments List */}
      {assignments && assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>座位分配明细</CardTitle>
            <CardDescription>共 {assignments.length} 条记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>考生姓名</TableHead>
                    <TableHead>报考岗位</TableHead>
                    <TableHead>考场</TableHead>
                    <TableHead>教室</TableHead>
                    <TableHead className="text-right">座位号</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.slice(0, 50).map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.candidateName}</TableCell>
                      <TableCell>{assignment.positionTitle}</TableCell>
                      <TableCell>{assignment.venueName}</TableCell>
                      <TableCell>{assignment.roomName || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{assignment.seatNumber}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {assignments.length > 50 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  仅显示前 50 条记录，共 {assignments.length} 条
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


