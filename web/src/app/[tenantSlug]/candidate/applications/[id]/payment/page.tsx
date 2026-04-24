'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CreditCard, Clock, Receipt, Info, AlertCircle } from 'lucide-react'
import { useApplication, usePaymentConfig, useInitiatePayment } from '@/lib/api-hooks'
import { useToast } from '@/components/ui/use-toast'
import { apiPost } from '@/lib/api'
import { useTenant } from '@/hooks/useTenant'
import { PaymentForm } from '@/components/payment/PaymentForm'
import { PaymentQRCode } from '@/components/payment/PaymentQRCode'
import { PaymentStatus } from '@/components/payment/PaymentStatus'

interface PaymentPageProps {
  params: {
    tenantSlug: string
    id: string
  }
}

interface PaymentInitiateResponse {
  outTradeNo: string
  payUrl?: string
  qrCode?: string
  formData?: string
  extraParams?: Record<string, unknown>
}

type PaymentMethod = 'ALIPAY' | 'WECHAT' | 'MOCK'

export default function PaymentPage({ params }: PaymentPageProps) {
  const resolvedParams = params
  const { tenantSlug, id } = resolvedParams
  const router = useRouter()
  const { toast } = useToast()
  const { tenant } = useTenant()

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MOCK')
  const paymentMethodInitializedRef = useRef(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('PENDING')
  const [paymentUrl, setPaymentUrl] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [orderNo, setOrderNo] = useState<string>('')
  const [pollingCount, setPollingCount] = useState(0)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // 获取报名详情
  const { data: application, isLoading: applicationLoading, refetch: refetchApplication } = useApplication(id)
  
  // 获取支付配置
  const { data: paymentConfig, isLoading: configLoading } = usePaymentConfig()

  // 生产向：默认非「仅模拟」；有正式渠道时默认选中支付宝→微信→模拟（stubOnly 时固定模拟）
  useEffect(() => {
    if (!paymentConfig || paymentMethodInitializedRef.current) return
    paymentMethodInitializedRef.current = true
    const stubOnly = paymentConfig.stubOnly ?? false
    if (stubOnly) {
      setSelectedMethod('MOCK')
      return
    }
    if (paymentConfig.channels?.alipayEnabled) {
      setSelectedMethod('ALIPAY')
    } else if (paymentConfig.channels?.wechatEnabled) {
      setSelectedMethod('WECHAT')
    } else {
      setSelectedMethod('MOCK')
    }
  }, [paymentConfig])
  
  const initiatePayment = useInitiatePayment()

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // 检查报名状态
  useEffect(() => {
    if (application) {
      // 如果已经支付，跳转到成功页面
      if (application.status === 'PAID' || application.status === 'TICKET_ISSUED') {
        router.push(`/${tenantSlug}/candidate/applications/${id}/payment/success`)
        return
      }
      
      // 如果审核未通过，不允许支付
      const reviewStatus = (application as any).reviewStatus
      if (reviewStatus && reviewStatus !== 'APPROVED' && reviewStatus !== 'SECOND_LEVEL_APPROVED') {
        toast({
          title: '无法支付',
          description: '报名审核未通过，无法进行支付',
          variant: 'destructive',
        })
        router.push(`/${tenantSlug}/candidate/applications/${id}`)
        return
      }

      // 如果免费考试，自动标记为已支付
      const feeAmount = (application as any).feeAmount ?? 0
      if (feeAmount === 0) {
        router.push(`/${tenantSlug}/candidate/applications/${id}/payment/success`)
      }
    }
  }, [application, id, router, tenantSlug, toast])

  // 轮询支付状态
  useEffect(() => {
    if (paymentStatus === 'PROCESSING' && isProcessing) {
      const interval = setInterval(() => {
        setPollingCount(prev => prev + 1)
        refetchApplication()
      }, 3000) // 每3秒查询一次
      setPollingInterval(interval)

      return () => {
        clearInterval(interval)
        setPollingInterval(null)
      }
    }
  }, [paymentStatus, isProcessing, refetchApplication])

  // 根据申请状态自动更新支付状态
  useEffect(() => {
    if (application?.status === 'PAID' || application?.status === 'TICKET_ISSUED') {
      setPaymentStatus('SUCCESS')
      setIsProcessing(false)
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
      // 延迟跳转，让用户看到成功状态
      setTimeout(() => {
        router.push(`/${tenantSlug}/candidate/applications/${id}/payment/success`)
      }, 2000)
    }
  }, [application?.status, router, tenantSlug, id, pollingInterval])

  // 开始轮询支付状态
  const startPolling = useCallback((outTradeNo: string) => {
    const interval = setInterval(async () => {
      try {
        // 通过刷新申请状态来检查支付状态
        await refetchApplication()
        setPollingCount(prev => prev + 1)
      } catch (error) {
        console.error('查询支付状态失败:', error)
      }
    }, 3000)

    setPollingInterval(interval)
  }, [refetchApplication])

  // 处理支付
  const handlePayment = async () => {
    if (!application) return

    setIsProcessing(true)
    setPaymentStatus('PROCESSING')
    setPollingCount(0)

    try {
      // 调用支付预下单API
      const response = await initiatePayment.mutateAsync({
        applicationId: id,
      }) as PaymentInitiateResponse

      setOrderNo(response.outTradeNo)

      // 根据支付方式处理
      if (selectedMethod === 'MOCK') {
        // 模拟支付，直接跳转到成功页面
        toast({
          title: '支付成功',
          description: '模拟支付已完成',
        })
        
        // 模拟支付回调
        await apiPost('/payments/callback', {
          outTradeNo: response.outTradeNo,
          transactionId: `MOCK_${Date.now()}`,
          status: 'SUCCESS',
        })

        setPaymentStatus('SUCCESS')
        setTimeout(() => {
          router.push(`/${tenantSlug}/candidate/applications/${id}/payment/success`)
        }, 1000)
      } else if (selectedMethod === 'ALIPAY') {
        // 支付宝支付
        if (response.payUrl) {
          setPaymentUrl(response.payUrl)
          // 跳转到支付宝支付页面
          window.location.href = response.payUrl
        } else if (response.qrCode) {
          setQrCodeUrl(response.qrCode)
          // 显示二维码，开始轮询支付状态
          startPolling(response.outTradeNo)
        }
      } else if (selectedMethod === 'WECHAT') {
        // 微信支付
        if (response.qrCode) {
          setQrCodeUrl(response.qrCode)
          // 显示二维码，开始轮询支付状态
          startPolling(response.outTradeNo)
        }
      }
    } catch (error) {
      console.error('支付失败:', error)
      toast({
        title: '支付失败',
        description: error instanceof Error ? error.message : '支付过程中发生错误',
        variant: 'destructive',
      })
      setPaymentStatus('FAILED')
      setIsProcessing(false)
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }

  const handleRetry = () => {
    setPaymentStatus('PENDING')
    setIsProcessing(false)
    setQrCodeUrl('')
    setOrderNo('')
    setPollingCount(0)
  }

  const handleCancel = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    router.push(`/${tenantSlug}/candidate/applications/${id}`)
  }

  if (applicationLoading || configLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">报名不存在</p>
            <Button onClick={() => router.push(`/${tenantSlug}/candidate/applications`)}>
              返回报名列表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const feeAmount = (application as any).feeAmount ?? 0
  const examTitle = (application as any).examTitle || '考试'
  const positionTitle = (application as any).positionTitle || '岗位'
  const applicationNumber = (application as any).applicationNumber || id.substring(0, 8)

  // 如果免费考试，显示提示
  if (feeAmount === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Info className="h-12 w-12 text-blue-500 mb-4" />
            <p className="text-lg font-semibold mb-2">本次考试免费</p>
            <p className="text-muted-foreground mb-4">无需支付费用，可直接参加考试</p>
            <Button onClick={() => router.push(`/${tenantSlug}/candidate/applications/${id}`)}>
              返回报名详情
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isStubOnly = paymentConfig?.stubOnly ?? false

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/${tenantSlug}/candidate/applications/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回详情
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">支付报名费用</h1>
            <p className="text-muted-foreground mt-1">
              报名编号: {applicationNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 左侧：支付表单 */}
        <div className="md:col-span-2 space-y-6">
          {/* 支付方式选择 */}
          {paymentStatus === 'PENDING' && (
            <PaymentForm
              paymentConfig={paymentConfig}
              selectedMethod={selectedMethod}
              onMethodChange={setSelectedMethod}
              isStubOnly={isStubOnly}
            />
          )}

          {/* 二维码显示 */}
          {qrCodeUrl && paymentStatus === 'PROCESSING' && (
            <PaymentQRCode
              qrCodeUrl={qrCodeUrl}
              paymentMethod={selectedMethod}
              orderNo={orderNo}
              onRefresh={() => {
                // 刷新二维码逻辑
                handlePayment()
              }}
              isRefreshing={isProcessing}
            />
          )}

          {/* 支付状态 */}
          {paymentStatus !== 'PENDING' && (
            <PaymentStatus
              status={paymentStatus}
              pollingCount={pollingCount}
              maxPollingTime={30}
              onRetry={handleRetry}
              onCancel={handleCancel}
            />
          )}
        </div>

        {/* 右侧：订单信息 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>订单信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">考试名称</p>
                <p className="font-semibold">{examTitle}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">报考岗位</p>
                <p className="font-semibold">{positionTitle}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">报名费用</p>
                <p className="text-2xl font-bold text-primary">
                  ¥{feeAmount.toFixed(2)}
                </p>
              </div>
              <Separator />
              {paymentStatus === 'PENDING' && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      立即支付
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 支付说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                支付说明
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• 支付成功后将自动生成准考证</p>
              <p>• 支付完成后请勿重复支付</p>
              <p>• 如有问题请联系客服</p>
              {isStubOnly && (
                <p className="text-yellow-600 mt-2">
                  • 当前为测试环境，仅支持模拟支付
                </p>
              )}
            </CardContent>
          </Card>

          {/* 订单详情卡片 */}
          {orderNo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  订单详情
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">订单号：</span>
                  <span className="font-mono">{orderNo}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">支付方式：</span>
                  <Badge variant="secondary">
                    {selectedMethod === 'ALIPAY' ? '支付宝' : selectedMethod === 'WECHAT' ? '微信' : '模拟支付'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
