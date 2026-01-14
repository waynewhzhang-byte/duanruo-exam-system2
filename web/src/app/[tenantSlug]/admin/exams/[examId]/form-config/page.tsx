'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/loading'

/**
 * 表单配置页面 - 重定向到考试详情页面的"报名表单"标签页
 *
 * 此页面已废弃，所有表单配置功能已整合到考试详情页面的"报名表单"标签页中。
 * 访问此页面将自动重定向到新的统一入口。
 */
export default function ExamFormConfigPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string

  useEffect(() => {
    // 重定向到考试详情页面的"报名表单"标签页
    router.replace(`/${tenantSlug}/admin/exams/${examId}/detail?tab=form`)
  }, [router, tenantSlug, examId])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Spinner size="lg" />
      <p className="text-muted-foreground">正在跳转到表单配置页面...</p>
    </div>
  )
}
