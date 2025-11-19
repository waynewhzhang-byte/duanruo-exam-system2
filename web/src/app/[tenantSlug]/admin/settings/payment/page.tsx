'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  CreditCard,
  Smartphone,
  Wallet,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Info,
  Terminal,
  FileCode,
  Copy
} from 'lucide-react'
import { Spinner } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PaymentConfig {
  currency: string
  stubOnly: boolean
  channels: {
    alipayEnabled: boolean
    wechatEnabled: boolean
    mockEnabled: boolean
  }
}

export default function PaymentSettingsPage() {
  // Fetch current payment config
  const { data: config, isLoading } = useQuery<PaymentConfig>({
    queryKey: ['payment-config'],
    queryFn: async () => {
      return apiGet<PaymentConfig>('/payments/config')
    },
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">支付配置</h1>
        <p className="text-muted-foreground mt-2">
          查看当前支付配置状态，通过环境变量配置支付渠道参数
        </p>
      </div>

      {/* Configuration Guide Alert */}
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>配置说明</AlertTitle>
        <AlertDescription>
          支付配置通过环境变量管理，修改后需要重启服务生效。
          配置文件位置：<code className="bg-muted px-1 py-0.5 rounded">exam-bootstrap/src/main/resources/application.yml</code>
        </AlertDescription>
      </Alert>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            当前配置状态
          </CardTitle>
          <CardDescription>
            系统当前的支付配置状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bypass Mode Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Bypass模式（开发测试模式）</div>
              <p className="text-sm text-muted-foreground">
                启用后，所有支付将自动通过，无需真实支付渠道
              </p>
            </div>
            <Badge variant={config?.stubOnly ? 'secondary' : 'outline'}>
              {config?.stubOnly ? '已启用' : '已禁用'}
            </Badge>
          </div>

          {config?.stubOnly && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                当前处于 <Badge variant="secondary">Bypass模式</Badge>，所有支付将自动通过。
                适用于开发和测试环境。
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Currency */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">支付币种</div>
              <p className="text-sm text-muted-foreground">
                当前仅支持人民币支付
              </p>
            </div>
            <Badge variant="outline">{config?.currency || 'CNY'}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alipay Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            支付宝配置
          </CardTitle>
          <CardDescription>
            通过环境变量配置支付宝支付参数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">支付宝支付</div>
              <p className="text-sm text-muted-foreground">
                {config?.stubOnly
                  ? '需要先关闭Bypass模式'
                  : config?.channels.alipayEnabled
                    ? '考生可以使用支付宝支付'
                    : '当前未启用'}
              </p>
            </div>
            <Badge variant={config?.channels.alipayEnabled ? 'default' : 'secondary'}>
              {config?.channels.alipayEnabled ? '已启用' : '未启用'}
            </Badge>
          </div>

          <Separator />

          {/* Configuration Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span className="font-medium">配置方法</span>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium">在 application.yml 中配置以下环境变量：</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">ALIPAY_ENABLED=true</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('ALIPAY_ENABLED=true')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">ALIPAY_APP_ID=your_app_id</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('ALIPAY_APP_ID=your_app_id')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">ALIPAY_PRIVATE_KEY=your_private_key</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('ALIPAY_PRIVATE_KEY=your_private_key')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">ALIPAY_PUBLIC_KEY=alipay_public_key</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('ALIPAY_PUBLIC_KEY=alipay_public_key')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">ALIPAY_NOTIFY_URL=https://your-domain.com/api/v1/payments/callback</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('ALIPAY_NOTIFY_URL=https://your-domain.com/api/v1/payments/callback')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">ALIPAY_RETURN_URL=https://your-domain.com/payment/success</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('ALIPAY_RETURN_URL=https://your-domain.com/payment/success')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>申请流程：</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>访问 <a href="https://open.alipay.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">支付宝开放平台</a></li>
                  <li>创建应用并获取 App ID</li>
                  <li>配置应用密钥（RSA2）</li>
                  <li>配置回调地址</li>
                  <li>提交审核并上线</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* WeChat Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            微信支付配置
          </CardTitle>
          <CardDescription>
            通过环境变量配置微信支付参数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">微信支付</div>
              <p className="text-sm text-muted-foreground">
                {config?.stubOnly
                  ? '需要先关闭Bypass模式'
                  : config?.channels.wechatEnabled
                    ? '考生可以使用微信支付'
                    : '当前未启用'}
              </p>
            </div>
            <Badge variant={config?.channels.wechatEnabled ? 'default' : 'secondary'}>
              {config?.channels.wechatEnabled ? '已启用' : '未启用'}
            </Badge>
          </div>

          <Separator />

          {/* Configuration Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span className="font-medium">配置方法</span>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium">在 application.yml 中配置以下环境变量：</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">WECHAT_ENABLED=true</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('WECHAT_ENABLED=true')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">WECHAT_APP_ID=your_app_id</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('WECHAT_APP_ID=your_app_id')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">WECHAT_MCH_ID=your_merchant_id</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('WECHAT_MCH_ID=your_merchant_id')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">WECHAT_API_KEY=your_api_key</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('WECHAT_API_KEY=your_api_key')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">WECHAT_API_V3_KEY=your_api_v3_key</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('WECHAT_API_V3_KEY=your_api_v3_key')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">WECHAT_NOTIFY_URL=https://your-domain.com/api/v1/payments/callback</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('WECHAT_NOTIFY_URL=https://your-domain.com/api/v1/payments/callback')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-background px-2 py-1 rounded">WECHAT_CERT_PATH=/path/to/cert.p12</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('WECHAT_CERT_PATH=/path/to/cert.p12')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>申请流程：</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>访问 <a href="https://pay.weixin.qq.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">微信商户平台</a></li>
                  <li>注册商户号并完成认证</li>
                  <li>获取 App ID 和商户号</li>
                  <li>配置 API 密钥（V2 和 V3）</li>
                  <li>下载商户证书</li>
                  <li>配置回调地址</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Mock Payment Info */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            模拟支付（Mock）
          </CardTitle>
          <CardDescription>
            开发测试专用，无需配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">模拟支付</div>
              <p className="text-sm text-muted-foreground">
                始终可用，用于开发和测试环境
              </p>
            </div>
            <Badge variant="outline">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              始终启用
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>重要提示</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>1. 修改环境变量后，需要重启后端服务才能生效</p>
          <p>2. 生产环境请务必关闭 Bypass 模式（设置 <code className="bg-background px-1 py-0.5 rounded">PAYMENT_STUB_ONLY=false</code>）</p>
          <p>3. 支付密钥等敏感信息请妥善保管，不要提交到代码仓库</p>
          <p>4. 建议使用环境变量或密钥管理服务来管理敏感配置</p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

