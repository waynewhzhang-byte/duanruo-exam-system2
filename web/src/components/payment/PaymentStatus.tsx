'use client'

import { CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PaymentStatusProps {
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  pollingCount?: number
  maxPollingTime?: number
  onRetry?: () => void
  onCancel?: () => void
}

export function PaymentStatus({
  status,
  pollingCount = 0,
  maxPollingTime = 30,
  onRetry,
  onCancel
}: PaymentStatusProps) {
  const remainingTime = Math.max(0, maxPollingTime * 60 - pollingCount * 3) // 假设每3秒轮询一次
  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60

  if (status === 'PROCESSING') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">正在处理支付...</h3>
          <p className="text-sm text-muted-foreground mb-4">
            请不要关闭页面，支付完成后将自动跳转
          </p>
          {pollingCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>等待中... ({minutes}:{seconds.toString().padStart(2, '0')})</span>
            </div>
          )}
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="mt-4"
            >
              取消支付
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (status === 'SUCCESS') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">支付成功</h3>
          <p className="text-sm text-muted-foreground">
            您的考试费用已支付成功，准考证将在考试前发放
          </p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'FAILED') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">支付失败</h3>
          <p className="text-sm text-muted-foreground mb-4">
            支付过程中出现错误，请重试或联系客服
          </p>
          <div className="flex gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry}>
                重新支付
              </Button>
            )}
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                返回
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

