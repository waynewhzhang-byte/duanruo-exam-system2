/**
 * Unauthorized access page
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { getDefaultRoute, getPrimaryRole } = usePermissions()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    const defaultRoute = getDefaultRoute()
    router.push(defaultRoute)
  }

  const primaryRole = getPrimaryRole()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <ShieldAlert className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">访问被拒绝</CardTitle>
          <CardDescription>
            您没有权限访问此页面
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>可能的原因：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>您的角色没有访问此功能的权限</li>
              <li>您需要特定的权限才能访问此页面</li>
              <li>此功能仅对管理员开放</li>
            </ul>
            {primaryRole && (
              <p className="mt-3">
                当前角色：<span className="font-medium">{primaryRole}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回上一页
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            如需申请权限，请联系管理员
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
