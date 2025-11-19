'use client'

import { useState } from 'react'
import { usePaymentConfig } from '@/lib/api-hooks'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Bell,
  Save,
  AlertCircle,
  Mail,
  MessageSquare,
  Settings as SettingsIcon
} from 'lucide-react'

export default function SettingsPage() {
  const { data: paymentConfig, isLoading, error } = usePaymentConfig()

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    currency: 'CNY',
    stubOnly: true,
    alipayEnabled: false,
    wechatEnabled: false,
    qrcodeEnabled: false,
    alipayAppId: '',
    alipayPrivateKey: '',
    wechatAppId: '',
    wechatMerchantId: '',
    wechatApiKey: '',
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    smtpHost: 'smtp.example.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: 'noreply@example.com',
    smsProvider: 'aliyun',
    smsAccessKey: '',
    smsAccessSecret: '',
    smsSignName: '',
  })

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  const handleSavePaymentSettings = async () => {
    setSaveStatus('saving')
    try {
      // TODO: Call API to save payment settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleSaveNotificationSettings = async () => {
    setSaveStatus('saving')
    try {
      // TODO: Call API to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="text-gray-600">配置系统级别的支付和通知设置</p>
      </div>

      {/* Status Alert */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          设置保存成功
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          保存失败，请重试
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payment" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            支付设置
          </TabsTrigger>
          <TabsTrigger value="notification" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            通知设置
          </TabsTrigger>
        </TabsList>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-6">
          {/* Current Config (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                当前支付配置（只读）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <div className="text-gray-500">加载中…</div>}
              {error && <div className="text-red-600">加载失败</div>}
              {paymentConfig && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">币种</div>
                    <div className="font-medium">{paymentConfig.currency}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">仅模拟</div>
                    <div className="font-medium">{paymentConfig.stubOnly ? '是' : '否'}</div>
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <div className="text-sm text-gray-500">渠道</div>
                    <div className="flex gap-3 text-sm">
                      <span>支付宝：<b className={paymentConfig.channels.alipayEnabled ? 'text-green-600' : 'text-gray-500'}>{paymentConfig.channels.alipayEnabled ? '启用' : '关闭'}</b></span>
                      <span>微信：<b className={paymentConfig.channels.wechatEnabled ? 'text-green-600' : 'text-gray-500'}>{paymentConfig.channels.wechatEnabled ? '启用' : '关闭'}</b></span>
                      <span>二维码：<b className={paymentConfig.channels.qrcodeEnabled ? 'text-green-600' : 'text-gray-500'}>{paymentConfig.channels.qrcodeEnabled ? '启用' : '关闭'}</b></span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle>支付配置管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">基础设置</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">币种</Label>
                    <Input
                      id="currency"
                      value={paymentSettings.currency}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                      placeholder="CNY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stubOnly" className="flex items-center justify-between">
                      <span>仅使用模拟支付</span>
                      <Switch
                        id="stubOnly"
                        checked={paymentSettings.stubOnly}
                        onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, stubOnly: checked })}
                      />
                    </Label>
                    <p className="text-xs text-gray-500">启用后将忽略真实支付渠道配置</p>
                  </div>
                </div>
              </div>

              {/* Payment Channels */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">支付渠道</h3>

                {/* Alipay */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alipayEnabled" className="text-base font-medium">支付宝</Label>
                    <Switch
                      id="alipayEnabled"
                      checked={paymentSettings.alipayEnabled}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, alipayEnabled: checked })}
                    />
                  </div>

                  {paymentSettings.alipayEnabled && (
                    <div className="grid grid-cols-1 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="alipayAppId">应用ID (App ID)</Label>
                        <Input
                          id="alipayAppId"
                          value={paymentSettings.alipayAppId}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, alipayAppId: e.target.value })}
                          placeholder="输入支付宝应用ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alipayPrivateKey">应用私钥 (Private Key)</Label>
                        <Input
                          id="alipayPrivateKey"
                          type="password"
                          value={paymentSettings.alipayPrivateKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, alipayPrivateKey: e.target.value })}
                          placeholder="输入应用私钥"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* WeChat Pay */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="wechatEnabled" className="text-base font-medium">微信支付</Label>
                    <Switch
                      id="wechatEnabled"
                      checked={paymentSettings.wechatEnabled}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, wechatEnabled: checked })}
                    />
                  </div>

                  {paymentSettings.wechatEnabled && (
                    <div className="grid grid-cols-1 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="wechatAppId">应用ID (App ID)</Label>
                        <Input
                          id="wechatAppId"
                          value={paymentSettings.wechatAppId}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, wechatAppId: e.target.value })}
                          placeholder="输入微信应用ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wechatMerchantId">商户号 (Merchant ID)</Label>
                        <Input
                          id="wechatMerchantId"
                          value={paymentSettings.wechatMerchantId}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, wechatMerchantId: e.target.value })}
                          placeholder="输入商户号"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wechatApiKey">API密钥 (API Key)</Label>
                        <Input
                          id="wechatApiKey"
                          type="password"
                          value={paymentSettings.wechatApiKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, wechatApiKey: e.target.value })}
                          placeholder="输入API密钥"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="qrcodeEnabled" className="text-base font-medium">二维码支付</Label>
                      <p className="text-xs text-gray-500 mt-1">支持扫码支付功能</p>
                    </div>
                    <Switch
                      id="qrcodeEnabled"
                      checked={paymentSettings.qrcodeEnabled}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, qrcodeEnabled: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSavePaymentSettings}
                  disabled={saveStatus === 'saving'}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveStatus === 'saving' ? '保存中...' : '保存支付设置'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通知渠道配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">启用的通知渠道</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-blue-600 mr-2" />
                        <Label htmlFor="emailEnabled" className="font-medium">邮件通知</Label>
                      </div>
                      <Switch
                        id="emailEnabled"
                        checked={notificationSettings.emailEnabled}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailEnabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
                        <Label htmlFor="smsEnabled" className="font-medium">短信通知</Label>
                      </div>
                      <Switch
                        id="smsEnabled"
                        checked={notificationSettings.smsEnabled}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsEnabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-purple-600 mr-2" />
                        <Label htmlFor="inAppEnabled" className="font-medium">站内通知</Label>
                      </div>
                      <Switch
                        id="inAppEnabled"
                        checked={notificationSettings.inAppEnabled}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, inAppEnabled: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Configuration */}
              {notificationSettings.emailEnabled && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    邮件服务器配置 (SMTP)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP服务器地址</Label>
                      <Input
                        id="smtpHost"
                        value={notificationSettings.smtpHost}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpHost: e.target.value })}
                        placeholder="smtp.example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP端口</Label>
                      <Input
                        id="smtpPort"
                        value={notificationSettings.smtpPort}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpPort: e.target.value })}
                        placeholder="587"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP用户名</Label>
                      <Input
                        id="smtpUser"
                        value={notificationSettings.smtpUser}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpUser: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP密码</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={notificationSettings.smtpPassword}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpPassword: e.target.value })}
                        placeholder="输入SMTP密码"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="smtpFrom">发件人地址</Label>
                      <Input
                        id="smtpFrom"
                        value={notificationSettings.smtpFrom}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpFrom: e.target.value })}
                        placeholder="noreply@example.com"
                      />
                      <p className="text-xs text-gray-500">系统发送邮件时使用的发件人地址</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">常用SMTP配置参考</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>QQ邮箱: smtp.qq.com:587 (需要开启SMTP服务并使用授权码)</li>
                          <li>163邮箱: smtp.163.com:465</li>
                          <li>Gmail: smtp.gmail.com:587 (需要开启两步验证并使用应用专用密码)</li>
                          <li>阿里云邮件推送: smtpdm.aliyun.com:80 或 :25</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS Configuration */}
              {notificationSettings.smsEnabled && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    短信服务配置
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smsProvider">短信服务商</Label>
                      <select
                        id="smsProvider"
                        value={notificationSettings.smsProvider}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsProvider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="aliyun">阿里云短信</option>
                        <option value="tencent">腾讯云短信</option>
                        <option value="huawei">华为云短信</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smsSignName">短信签名</Label>
                      <Input
                        id="smsSignName"
                        value={notificationSettings.smsSignName}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsSignName: e.target.value })}
                        placeholder="【考试系统】"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smsAccessKey">Access Key ID</Label>
                      <Input
                        id="smsAccessKey"
                        value={notificationSettings.smsAccessKey}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsAccessKey: e.target.value })}
                        placeholder="输入Access Key ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smsAccessSecret">Access Key Secret</Label>
                      <Input
                        id="smsAccessSecret"
                        type="password"
                        value={notificationSettings.smsAccessSecret}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsAccessSecret: e.target.value })}
                        placeholder="输入Access Key Secret"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">短信服务注意事项</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>需要在对应云服务商控制台开通短信服务</li>
                          <li>短信签名和模板需要提前申请并通过审核</li>
                          <li>建议设置每日发送上限，避免恶意调用</li>
                          <li>短信服务会产生费用，请注意账户余额</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSaveNotificationSettings}
                  disabled={saveStatus === 'saving'}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveStatus === 'saving' ? '保存中...' : '保存通知设置'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
