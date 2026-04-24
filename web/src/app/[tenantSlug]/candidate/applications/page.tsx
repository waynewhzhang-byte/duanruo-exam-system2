'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/contexts/TenantContext'
import { Spinner } from '@/components/ui/loading'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ApplicationsPageProps {
  params: { tenantSlug: string }
}

/**
 * Tenant-aware applications list page
 * Redirects to the global applications page
 */
export default function TenantApplicationsPage({ params }: Readonly<ApplicationsPageProps>) {
  const { tenant, isLoading } = useTenant()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && tenant) {
      router.replace('/candidate/applications')
    }
  }, [tenant, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">租户不存在</h2>
          <p className="text-gray-600 mb-4">无法找到该租户</p>
          <Link href="/tenants">
            <Button>返回租户列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner />
    </div>
  )
}

