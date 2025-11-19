'use client'

import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ExamPositionsAndSubjects from '@/components/admin/exam-detail/ExamPositionsAndSubjects'

export default function PositionsPage() {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const examId = params.examId as string

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${tenantSlug}/admin/exams`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回考试列表
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">岗位与科目管理</h1>
        <p className="text-muted-foreground mt-2">
          管理考试的招聘岗位和考试科目
        </p>
      </div>

      <ExamPositionsAndSubjects examId={examId} />
    </div>
  )
}

