'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react'
import { useApplication } from '@/lib/api-hooks'

interface PaymentFailedPageProps {
  params: Promise<{
    tenantSlug: string
    id: string
  }>
}

export default function PaymentFailedPage({ params }: PaymentFailedPageProps) {
  const resolvedParams = use(params)
  const { tenantSlug, id } = resolvedParams
  const router = useRouter()

  const { data: application } = useApplication(id)

  const examTitle = (application as any)?.examTitle || '考试'
  const positionTitle = (application as any)?.positionTitle || '岗位'
  const applicationNumber = (application as any)?.applicationNumber || id.substring(0, 8)

  const handleRetry = () => {
    router.push(`/${tenantSlug}/candidate/applications/${id}/payment`)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-8">
            <div className="text-center space-y-6">
              {/* 失败图标 */}
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-4">
                  <AlertCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>

              {/* 标题和描述 */}
              <div>
                <h1 className="text-3xl font-bold mb-2">支付失败</h1>
                <p className="text-muted-foreground">
                  支付过程中出现错误，请重试或联系客服
                </p>
              </div>

              {/* 报名信息卡片 */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">报名编号</span>
                  <span className="font-semibold">{applicationNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">考试名称</span>
                  <span className="font-semibold">{examTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">报考岗位</span>
                  <span className="font-semibold">{positionTitle}</span>
                </div>
              </div>

              {/* 失败原因提示 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-yellow-800 mb-2">可能的原因：</p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>网络连接不稳定</li>
                  <li>支付账户余额不足</li>
                  <li>支付密码错误</li>
                  <li>支付超时</li>
                </ul>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${tenantSlug}/candidate/applications/${id}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回报名详情
                </Button>
                <Button
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新支付
                </Button>
              </div>

              {/* 帮助信息 */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                  <span>如问题持续存在，请联系客服：400-123-4567</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
