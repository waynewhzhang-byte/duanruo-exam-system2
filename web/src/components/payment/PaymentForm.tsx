'use client'

import { useState } from 'react'
import { CreditCard, Smartphone, QrCode, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PaymentConfigResponse } from '@/lib/schemas'

type PaymentMethod = 'ALIPAY' | 'WECHAT' | 'MOCK'

interface PaymentFormProps {
  paymentConfig?: PaymentConfigResponse
  selectedMethod: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  isStubOnly?: boolean
}

export function PaymentForm({
  paymentConfig,
  selectedMethod,
  onMethodChange,
  isStubOnly = false
}: PaymentFormProps) {
  const methods: Array<{
    id: PaymentMethod
    name: string
    icon: React.ReactNode
    description: string
    available: boolean
  }> = [
    {
      id: 'ALIPAY',
      name: '支付宝',
      icon: <CreditCard className="h-6 w-6 text-blue-600" />,
      description: '使用支付宝扫码支付',
      available: !isStubOnly && (paymentConfig?.channels.alipayEnabled ?? false)
    },
    {
      id: 'WECHAT',
      name: '微信支付',
      icon: <Smartphone className="h-6 w-6 text-green-600" />,
      description: '使用微信扫码支付',
      available: !isStubOnly && (paymentConfig?.channels.wechatEnabled ?? false)
    },
    {
      id: 'MOCK',
      name: '模拟支付',
      icon: <QrCode className="h-6 w-6 text-gray-600" />,
      description: '测试环境使用，仅用于开发测试',
      available: true
    }
  ]

  const availableMethods = methods.filter(m => m.available)

  return (
    <Card>
      <CardHeader>
        <CardTitle>选择支付方式</CardTitle>
        <CardDescription>请选择您的支付方式</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => onMethodChange(value as PaymentMethod)}
        >
          <div className="space-y-3">
            {availableMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center space-x-3 border rounded-lg p-4 transition-all cursor-pointer ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onMethodChange(method.id)}
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <Label
                  htmlFor={method.id}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  {method.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{method.name}</p>
                      {method.id === 'MOCK' && (
                        <Badge variant="secondary" className="text-xs">
                          测试
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                </Label>
                {selectedMethod === method.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
            ))}
          </div>
        </RadioGroup>

        {isStubOnly && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ 当前为测试环境，仅支持模拟支付。生产环境将启用真实支付渠道。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

