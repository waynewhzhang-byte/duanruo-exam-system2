'use client'

import { NotificationTemplatesPanel } from '@/components/notifications/notification-templates-panel'

interface NotificationTemplatesPageProps {
  params: {
    tenantSlug: string
  }
}

export default function NotificationTemplatesPage({ params }: NotificationTemplatesPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">通知模板管理</h1>
        <p className="text-muted-foreground mt-2">管理邮件、短信和站内消息模板</p>
      </div>
      <NotificationTemplatesPanel />
    </div>
  )
}
