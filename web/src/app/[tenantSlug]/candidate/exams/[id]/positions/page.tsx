'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTenant } from '@/contexts/TenantContext'
import { useExam, useExamPositions } from '@/lib/api-hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner, EmptyState } from '@/components/ui/loading'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { PositionResponse } from '@/lib/schemas'
import { z } from 'zod'
import {
  ArrowLeft,
  Users,
  ChevronRight,
  AlertCircle,
  FileText,
  Award,
} from 'lucide-react'

type Position = z.infer<typeof PositionResponse>

interface PositionsPageProps {
  params: Promise<{ tenantSlug: string; id: string }>
}

export default function TenantPositionsPage({ params }: PositionsPageProps) {
  const resolvedParams = use(params)
  const examId = resolvedParams.id
  
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useTenant()
  const errorHandler = useErrorHandler()
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)

  const { 
    data: exam, 
    isLoading: examLoading, 
    error: examError 
  } = useExam(examId)

  const {
    data: positionsData,
    isLoading: positionsLoading,
    error: positionsError,
  } = useExamPositions(examId, tenant?.id)

  const positions: Position[] = positionsData || []

  if (examError) {
    errorHandler.handleError(examError)
  }

  if (positionsError) {
    errorHandler.handleError(positionsError as any)
  }

  const handlePositionSelect = (positionId: string) => {
    setSelectedPosition(positionId)
  }

  const handleApply = () => {
    if (!selectedPosition || !tenant) return
    
    // Navigate to application form with exam and position context
    router.push(`/${tenant.slug}/candidate/applications/new?examId=${examId}&positionId=${selectedPosition}`)
  }

  const getAvailabilityStatus = (position: Position) => {
    const quota = position.quota
    if (!quota) return { status: 'available', text: '可报名' }

    // Note: currentCandidates is not available in the API response
    // In a real scenario, this would come from the backend
    return { status: 'available', text: '可报名' }
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'limited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'full':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (tenantLoading || examLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    )
  }

  if (!tenant || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">页面不存在</h2>
          <p className="text-gray-600 mb-4">无法找到该考试</p>
          <Link href={`/${tenant?.slug || 'tenants'}/candidate`}>
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/${tenant.slug}/candidate/exams`}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">选择报考岗位</h1>
                <p className="text-sm text-gray-600">{exam.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">{exam.title}</h2>
                {exam.description && (
                  <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {exam.registrationStart && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">报名开始:</span>
                      <span>{exam.registrationStart}</span>
                    </div>
                  )}
                  {exam.registrationEnd && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">报名截止:</span>
                      <span>{exam.registrationEnd}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Positions List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">可报考岗位</h3>
          
          {positionsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : positions.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="暂无可报考岗位"
              description="该考试暂未开放岗位报名"
            />
          ) : (
            <div className="space-y-4">
              {positions.map((position) => {
                if (!position.id) return null
                const availability = getAvailabilityStatus(position)
                const isSelected = selectedPosition === position.id
                const isAvailable = availability.status !== 'full'

                return (
                  <button
                    key={position.id}
                    className={`w-full text-left cursor-pointer transition-all ${!isAvailable ? 'opacity-60' : ''}`}
                    onClick={() => isAvailable && handlePositionSelect(position.id!)}
                    disabled={!isAvailable}
                  >
                    <Card
                      className={`${
                        isSelected
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:shadow-md'
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{position.title || position.name}</h3>
                              {position.code && (
                                <Badge variant="outline">{position.code}</Badge>
                              )}
                              <Badge className={getAvailabilityColor(availability.status)}>
                                {availability.text}
                              </Badge>
                            </div>
                            {position.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {position.description}
                              </p>
                            )}
                            {position.requirements && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">任职要求:</p>
                                <p className="text-sm text-gray-600 whitespace-pre-line">
                                  {position.requirements}
                                </p>
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="ml-4">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Award className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Capacity */}
                        {position.quota != null && (
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>
                              招聘名额: {position.quota} 人
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
    </div>
  )
}

