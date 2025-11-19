'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'

/**
 * 重定向到统一支付页面
 * 此页面用于兼容旧路由，自动重定向到新的统一支付路由
 */
export default function PaymentRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string
  const { tenant } = useTenant()

  useEffect(() => {
    if (tenant?.slug && applicationId) {
      router.replace(`/${tenant.slug}/candidate/applications/${applicationId}/payment`)
    } else if (applicationId) {
      // 如果没有tenant，尝试从URL获取或使用默认值
      const tenantSlug = window.location.pathname.split('/')[1] || 'default'
      router.replace(`/${tenantSlug}/candidate/applications/${applicationId}/payment`)
    }
  }, [router, applicationId, tenant?.slug])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">正在跳转到支付页面...</p>
      </div>
    </div>
  )
}
