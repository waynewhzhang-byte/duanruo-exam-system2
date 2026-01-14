'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * 考试详情页面 - 自动重定向到 detail 子页面
 * 
 * 当用户访问 /[tenantSlug]/admin/exams/[examId] 时，
 * 自动重定向到 /[tenantSlug]/admin/exams/[examId]/detail
 */
export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenantSlug as string
  const examId = params.examId as string

  useEffect(() => {
    // 自动重定向到 detail 页面
    router.replace(`/${tenantSlug}/admin/exams/${examId}/detail`)
  }, [router, tenantSlug, examId])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">正在跳转到考试详情...</p>
      </div>
    </div>
  )
}

