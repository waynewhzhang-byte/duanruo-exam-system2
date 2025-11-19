'use client'

import { useState } from 'react'
import { QrCode, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PaymentQRCodeProps {
  qrCodeUrl: string
  paymentMethod: 'ALIPAY' | 'WECHAT'
  orderNo?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function PaymentQRCode({
  qrCodeUrl,
  paymentMethod,
  orderNo,
  onRefresh,
  isRefreshing = false
}: PaymentQRCodeProps) {
  const [imageError, setImageError] = useState(false)

  const methodName = paymentMethod === 'ALIPAY' ? '支付宝' : '微信'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>扫码支付</CardTitle>
            <CardDescription>
              请使用{methodName}扫描二维码完成支付
            </CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
          {!imageError && qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`${methodName}支付二维码`}
              className="w-64 h-64"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>
        
        {orderNo && (
          <div className="bg-gray-50 rounded-lg p-3 w-full max-w-xs">
            <p className="text-xs text-gray-600 text-center mb-1">订单号</p>
            <p className="font-mono text-sm font-semibold text-center">{orderNo}</p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full max-w-xs">
          <p className="text-xs text-yellow-800 text-center">
            ⚠️ 请在 30 分钟内完成支付，超时订单将自动取消
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

