'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner, EmptyState } from '@/components/ui/loading'
import { useExam, useExamPositions } from '@/lib/api-hooks'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { 
  ArrowLeft,
  Users,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

interface Position {
  id: string
  code: string
  title: string
  description?: string
  requirements?: string[]
  subjects?: Subject[]
  maxCandidates?: number
  currentCandidates?: number
}

interface Subject {
  id: string
  name: string
  duration: number
  type: string
  description?: string
}

export default function PositionsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const errorHandler = useErrorHandler()
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)

  const { 
    data: exam, 
    isLoading, 
    error 
  } = useExam(examId)

  if (error) {
    errorHandler.handleError(error)
  }

  // Load positions via API
  const {
    data: positionsData,
    isLoading: positionsLoading,
    error: positionsError,
  } = useExamPositions(examId)
  const positions: any[] = positionsData || []

  if (positionsError) {
    errorHandler.handleError(positionsError as any)
  }

  const handlePositionSelect = (positionId: string) => {
    setSelectedPosition(positionId)
  }

  const handleApply = () => {
    if (!selectedPosition) return
    
    // Navigate to application form with exam and position context
    router.push(`/candidate/applications/new?examId=${examId}&positionId=${selectedPosition}`)
  }

  const handleBack = () => {
    router.push('/candidate/exams')
  }

  const getAvailabilityStatus = (position: Position) => {
    if (!position.maxCandidates) return { status: 'available', text: '可报名' }
    
    const ratio = (position.currentCandidates || 0) / position.maxCandidates
    if (ratio >= 1) return { status: 'full', text: '已满员' }
    if (ratio >= 0.8) return { status: 'limited', text: '名额紧张' }
    return { status: 'available', text: '可报名' }
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'limited': return 'bg-yellow-100 text-yellow-800'
      case 'full': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading || positionsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回考试列表
            </Button>
          </div>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!exam) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="考试不存在"
          description="未找到指定的考试信息"
          action={
            <Button onClick={handleBack}>
              返回考试列表
            </Button>
          }
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回考试列表
          </Button>
        </div>

        {/* Exam Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{exam.title}</CardTitle>
            {exam.description && (
              <p className="text-gray-600">{exam.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {exam.registrationStart && (
                <div>
                  <span className="font-medium">报名开始：</span>
                  <span className="text-gray-600">
                    {new Date(exam.registrationStart).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
              {exam.registrationEnd && (
                <div>
                  <span className="font-medium">报名截止：</span>
                  <span className="text-gray-600">
                    {new Date(exam.registrationEnd).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
              {exam.feeRequired !== undefined && (
                <div>
                  <span className="font-medium">考试费用：</span>
                  <span className="text-gray-600">
                    {exam.feeRequired ? '需要缴费' : '免费'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Position Selection */}
        <div>
          <h2 className="text-lg font-semibold mb-4">选择报考岗位</h2>
          
          {positions.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="暂无可报考岗位"
              description="该考试暂未开放岗位报名"
            />
          ) : (
            <div className="space-y-4">
              {positions.map((position) => {
                const availability = getAvailabilityStatus(position)
                const isSelected = selectedPosition === position.id
                const isAvailable = availability.status !== 'full'
                
                return (
                  <button
                    key={position.id}
                    className={`w-full text-left cursor-pointer transition-all ${!isAvailable ? 'opacity-60' : ''}`}
                    onClick={() => isAvailable && handlePositionSelect(position.id)}
                    disabled={!isAvailable}
                  >
                    <Card
                      className={`${
                        isSelected
                          ? 'ring-2 ring-blue-500 border-blue-500'
                          : 'hover:shadow-md'
                      }`}
                    >
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{position.title}</h3>
                            <Badge className="border border-gray-300">{position.code}</Badge>
                            <Badge className={getAvailabilityColor(availability.status)}>
                              {availability.text}
                            </Badge>
                          </div>
                          {position.description && (
                            <p className="text-gray-600 mb-3">{position.description}</p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Requirements */}
                      {position.requirements && position.requirements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            岗位要求
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {position.requirements.map((req: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-1">•</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Subjects */}
                      {position.subjects && position.subjects.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            考试科目
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {position.subjects.map((subject: Subject) => (
                              <div key={subject.id} className="text-sm bg-gray-50 p-2 rounded">
                                <div className="font-medium">{subject.name}</div>
                                <div className="text-gray-600 flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {subject.duration}分钟
                                  </span>
                                  <span>{subject.type}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Capacity */}
                      {position.maxCandidates && (
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            已报名 {position.currentCandidates || 0} / {position.maxCandidates} 人
                          </span>
                        </div>
                      )}
                    </CardContent>
                    </Card>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Apply Button */}
        {selectedPosition && (
          <div className="flex justify-center pt-6">
            <Button 
              size="lg"
              onClick={handleApply}
              className="px-8"
            >
              开始报名
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
