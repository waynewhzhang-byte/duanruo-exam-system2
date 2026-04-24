'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTenant } from '@/contexts/TenantContext'
import { Spinner } from '@/components/ui/loading'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

/**
 * Tenant-aware application form page
 * This page redirects to the global application form with tenant context
 * The global form already handles all the application logic
 */
export default function TenantNewApplicationPage() {
  const { tenant, isLoading } = useTenant()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoading && tenant) {
      // Redirect to the global application form with query parameters preserved
      const queryString = searchParams.toString()
      const baseUrl = '/candidate/applications/new'
      const targetUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl
      router.replace(targetUrl)
    }
  }, [tenant, isLoading, searchParams, router])

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

