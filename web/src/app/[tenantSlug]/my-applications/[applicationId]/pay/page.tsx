'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

/**
 * 重定向到统一支付页面
 * 此页面用于兼容旧路由，自动重定向到新的统一支付路由
 */
export default function PaymentRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.applicationId as string
  const tenantSlug = params.tenantSlug as string

  useEffect(() => {
    if (tenantSlug && applicationId) {
      router.replace(`/${tenantSlug}/candidate/applications/${applicationId}/payment`)
    }
  }, [router, applicationId, tenantSlug])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">正在跳转到支付页面...</p>
      </div>
    </div>
  )
}
