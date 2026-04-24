'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bell, Mail, Check, Trash2, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPut, apiDelete } from '@/lib/api'

interface NotificationsPageProps {
  params: {
    tenantSlug: string
  }
}

export default function NotificationsPage({ params }: NotificationsPageProps) {
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 获取消息列表
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const response: any = await apiGet('/notification-histories/my')
      const items = response.items || []
      // 根据filter过滤
      if (filter === 'unread') {
        return items.filter((n: any) => !n.read)
      } else if (filter === 'read') {
        return items.filter((n: any) => n.read)
      }
      return items
    },
  })

  // 标记为已读
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiPut(`/notifications/${id}/read`, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // 标记全部为已读
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiPut('/notifications/mark-all-read', {})
    },
    onSuccess: () => {
      toast({ title: '已标记全部为已读' })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast({ title: '操作失败', variant: 'destructive' })
    },
  })

  // 删除消息
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiDelete(`/notifications/${id}`)
    },
    onSuccess: () => {
      toast({ title: '消息已删除' })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setSelectedNotification(null)
    },
    onError: () => {
      toast({ title: '删除失败', variant: 'destructive' })
    },
  })

  const handleViewNotification = (notification: any) => {
    setSelectedNotification(notification)
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条消息吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">站内消息</h1>
          <p className="text-muted-foreground mt-2">
            查看系统通知和消息
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} 条未读
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            全部已读
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          全部
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          未读
        </Button>
        <Button
          variant={filter === 'read' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('read')}
        >
          已读
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>消息列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无消息</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' ? '没有未读消息' : filter === 'read' ? '没有已读消息' : '您还没有收到任何消息'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                  onClick={() => handleViewNotification(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewNotification(notification); } }}
                  aria-label={notification.subject || '查看通知'}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-1 ${!notification.read ? 'text-blue-600' : 'text-muted-foreground'}`}>
                        {notification.type === 'EMAIL' ? (
                          <Mail className="h-5 w-5" />
                        ) : (
                          <Bell className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notification.title || notification.subject}
                          </h4>
                          {!notification.read && (
                            <Badge variant="destructive" className="text-xs">
                              新
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewNotification(notification)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title || selectedNotification?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedNotification?.createdAt && new Date(selectedNotification.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{selectedNotification?.content}</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedNotification(null)}
              >
                关闭
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(selectedNotification?.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

