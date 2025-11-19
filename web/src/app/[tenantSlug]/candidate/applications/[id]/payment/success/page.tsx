'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ArrowLeft, Receipt, Download } from 'lucide-react'
import { useApplication } from '@/lib/api-hooks'
import { useTenant } from '@/hooks/useTenant'

interface PaymentSuccessPageProps {
  params: Promise<{
    tenantSlug: string
    id: string
  }>
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const resolvedParams = use(params)
  const { tenantSlug, id } = resolvedParams
  const router = useRouter()
  const { tenant } = useTenant()

  const { data: application, isLoading } = useApplication(id)

  const feeAmount = (application as any)?.feeAmount ?? 0
  const examTitle = (application as any)?.examTitle || '考试'
  const positionTitle = (application as any)?.positionTitle || '岗位'
  const applicationNumber = (application as any)?.applicationNumber || id.substring(0, 8)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-8">
            <div className="text-center space-y-6">
              {/* 成功图标 */}
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>

              {/* 标题和描述 */}
              <div>
                <h1 className="text-3xl font-bold mb-2">支付成功</h1>
                <p className="text-muted-foreground">
                  您的考试费用已支付成功，准考证将在考试前自动生成
                </p>
              </div>

              {/* 支付信息卡片 */}
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
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-muted-foreground">支付金额</span>
                  <span className="text-2xl font-bold text-primary">¥{feeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">支付时间</span>
                  <span className="font-semibold">{new Date().toLocaleString('zh-CN')}</span>
                </div>
              </div>

              {/* 下一步提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>下一步：</strong>准考证将在考试前3天自动生成，届时您可以通过"我的报名"页面下载打印。
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${tenantSlug}/candidate/applications/${id}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  查看报名详情
                </Button>
                <Button
                  onClick={() => router.push(`/${tenantSlug}/candidate/applications`)}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  返回报名列表
                </Button>
              </div>

              {/* 帮助信息 */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  如有疑问，请联系客服：400-123-4567
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
