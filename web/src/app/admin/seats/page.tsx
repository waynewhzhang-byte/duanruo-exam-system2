'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useExams, useAllocateSeats } from '@/lib/api-hooks'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import {
  MapPin,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Shuffle,
  List,
  Grid
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

type AllocationStrategy = 'POSITION_FIRST_SUBMITTED_AT' | 'RANDOM' | 'SUBMITTED_AT_FIRST' | 'POSITION_FIRST_RANDOM' | 'CUSTOM_GROUP'

export default function SeatAllocationPage() {
  const router = useRouter()
  const errorHandler = useErrorHandler()
  const { toast } = useToast()

  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedStrategy, setSelectedStrategy] = useState<AllocationStrategy>('POSITION_FIRST_SUBMITTED_AT')
  const [customGroupField, setCustomGroupField] = useState<string>('')
  const [isAllocating, setIsAllocating] = useState(false)

  const {
    data: examsData,
    isLoading: examsLoading,
    error: examsError
  } = useExams({
    page: 0,
    size: 100,
    status: 'CLOSED' // 只显示已关闭的考试
  })

  const allocateSeats = useAllocateSeats()

  if (examsError) {
    errorHandler.handleError(examsError)
  }

  const exams = examsData?.content || []

  const strategies = [
    {
      id: 'POSITION_FIRST_SUBMITTED_AT' as AllocationStrategy,
      name: '岗位分组 + 报名时间',
      description: '相同岗位的考生安排在一起，按报名时间排序',
      icon: <List className="h-5 w-5" />,
      recommended: true
    },
    {
      id: 'RANDOM' as AllocationStrategy,
      name: '完全随机',
      description: '所有考生完全随机分配座位',
      icon: <Shuffle className="h-5 w-5" />,
      recommended: false
    },
    {
      id: 'SUBMITTED_AT_FIRST' as AllocationStrategy,
      name: '报名时间优先',
      description: '按报名时间顺序分配座位',
      icon: <ArrowRight className="h-5 w-5" />,
      recommended: false
    },
    {
      id: 'POSITION_FIRST_RANDOM' as AllocationStrategy,
      name: '岗位分组 + 随机',
      description: '相同岗位的考生安排在一起，组内随机',
      icon: <Grid className="h-5 w-5" />,
      recommended: false
    },
    {
      id: 'CUSTOM_GROUP' as AllocationStrategy,
      name: '自定义分组',
      description: '按指定字段分组（如毕业学校、专业等）',
      icon: <Users className="h-5 w-5" />,
      recommended: false
    }
  ]

  const handleAllocate = async () => {
    if (!selectedExamId) {
      toast({
        title: '请选择考试',
        description: '请先选择要分配座位的考试',
        variant: 'destructive'
      })
      return
    }

    if (selectedStrategy === 'CUSTOM_GROUP' && !customGroupField) {
      toast({
        title: '请输入分组字段',
        description: '使用自定义分组策略时，必须指定分组字段',
        variant: 'destructive'
      })
      return
    }

    setIsAllocating(true)

    try {
      await allocateSeats.mutateAsync({
        examId: selectedExamId,
        strategy: selectedStrategy,
        customGroups: selectedStrategy === 'CUSTOM_GROUP' && customGroupField
          ? { [customGroupField]: [] }
          : undefined
      })

      toast({
        title: '座位分配成功',
        description: '已成功为考生分配座位，准考证将自动生成',
      })

      // 跳转到座位分配结果页面（如果有的话）
      // router.push(`/admin/seats/${selectedExamId}/results`)
    } catch (error: any) {
      toast({
        title: '座位分配失败',
        description: error?.message || '分配过程中出现错误，请重试',
        variant: 'destructive'
      })
    } finally {
      setIsAllocating(false)
    }
  }

  const getExamStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      CLOSED: { label: '已关闭', variant: 'default' },
      REGISTRATION_OPEN: { label: '报名中', variant: 'outline' },
      COMPLETED: { label: '已完成', variant: 'secondary' },
      CANCELLED: { label: '已取消', variant: 'destructive' }
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">座位分配</h1>
        <p className="text-muted-foreground mt-2">为考试分配考场座位</p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">座位分配说明</p>
              <ul className="space-y-1 text-blue-800">
                <li>• 只能为已关闭报名的考试分配座位</li>
                <li>• 只有审核通过且已缴费（或免费考试已审核通过）的考生才会被分配座位</li>
                <li>• 分配完成后将自动生成准考证</li>
                <li>• 建议使用"岗位分组 + 报名时间"策略，避免同岗位考生相邻</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Exam Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                选择考试
              </CardTitle>
              <CardDescription>选择要分配座位的考试</CardDescription>
            </CardHeader>
            <CardContent>
              {examsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : exams.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">暂无已关闭的考试</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    只有已关闭报名的考试才能分配座位
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.map((exam) => (
                    <label
                      key={exam.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedExamId === exam.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exam"
                        value={exam.id}
                        checked={selectedExamId === exam.id}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{exam.title}</div>
                        <div className="flex items-center gap-2">
                          {getExamStatusBadge(exam.status)}
                        </div>
                      </div>
                      {selectedExamId === exam.id && (
                        <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Strategy Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                分配策略
              </CardTitle>
              <CardDescription>选择座位分配策略</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strategies.map((strategy) => (
                  <label
                    key={strategy.id}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStrategy === strategy.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      value={strategy.id}
                      checked={selectedStrategy === strategy.id}
                      onChange={(e) => setSelectedStrategy(e.target.value as AllocationStrategy)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3 flex-1">
                      {strategy.icon}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{strategy.name}</span>
                          {strategy.recommended && (
                            <Badge variant="default" className="text-xs">推荐</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{strategy.description}</p>
                      </div>
                    </div>
                    {selectedStrategy === strategy.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
                    )}
                  </label>
                ))}
              </div>

              {/* Custom Group Field Input */}
              {selectedStrategy === 'CUSTOM_GROUP' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分组字段名称
                  </label>
                  <input
                    type="text"
                    value={customGroupField}
                    onChange={(e) => setCustomGroupField(e.target.value)}
                    placeholder="例如: graduationSchool, major, education"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    输入报名表单中的字段名称，系统将按该字段的值进行分组
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleAllocate}
              disabled={!selectedExamId || isAllocating}
              size="lg"
              className="px-8"
            >
              {isAllocating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  分配中...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  开始分配座位
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

