'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function SuperAdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    // 默认跳转到租户管理页面
    router.replace('/super-admin/tenants')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground animate-pulse">正在进入系统管理后台...</p>
    </div>
  )
}
