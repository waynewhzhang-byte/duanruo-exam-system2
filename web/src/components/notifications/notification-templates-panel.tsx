'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Edit, Trash2, Mail, MessageSquare, Bell } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/use-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api'

const templateSchema = z.object({
  name: z.string().min(1, '模板名称不能为空'),
  type: z.enum(['EMAIL', 'SMS', 'IN_APP']),
  subject: z.string().optional(),
  content: z.string().min(1, '模板内容不能为空'),
  variables: z.string().optional(),
})

type TemplateFormData = z.infer<typeof templateSchema>

export interface NotificationTemplateRow {
  id: string
  name: string
  type: string
  subject?: string | null
  content: string
  variables?: string | null
}

function normalizeTemplatesPayload(raw: unknown): NotificationTemplateRow[] {
  if (Array.isArray(raw)) {
    return raw as NotificationTemplateRow[]
  }
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const inner = (raw as { data: unknown }).data
    if (Array.isArray(inner)) {
      return inner as NotificationTemplateRow[]
    }
  }
  return []
}

const tenantRequestOpts = (tenantId?: string) => (tenantId ? { tenantId } : {})

export interface NotificationTemplatesPanelProps {
  /**
   * 非租户路由（如超管后台）必须传入目标租户的 id，请求才会带上 X-Tenant-ID。
   * 租户管理后台省略即可，由路径 / localStorage 解析租户上下文。
   */
  impersonateTenantId?: string
}

export function NotificationTemplatesPanel({ impersonateTenantId }: NotificationTemplatesPanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateRow | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const tenantOpts = tenantRequestOpts(impersonateTenantId)

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      type: 'EMAIL',
      subject: '',
      content: '',
      variables: '',
    },
  })

  const templateQueryKey = ['notification-templates', impersonateTenantId ?? '__default__'] as const

  const { data: templates, isLoading } = useQuery({
    queryKey: templateQueryKey,
    queryFn: async () => {
      const response = await apiGet<unknown>('/notifications/templates', tenantOpts)
      return normalizeTemplatesPayload(response)
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return apiPost('/notifications/templates', data, tenantOpts)
    },
    onSuccess: () => {
      toast({ title: '模板创建成功' })
      void queryClient.invalidateQueries({ queryKey: templateQueryKey })
      setIsCreateDialogOpen(false)
      form.reset()
    },
    onError: () => {
      toast({ title: '模板创建失败', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      return apiPut(`/notifications/templates/${id}`, data, tenantOpts)
    },
    onSuccess: () => {
      toast({ title: '模板更新成功' })
      void queryClient.invalidateQueries({ queryKey: templateQueryKey })
      setEditingTemplate(null)
      form.reset()
    },
    onError: () => {
      toast({ title: '模板更新失败', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiDelete(`/notifications/templates/${id}`, tenantOpts)
    },
    onSuccess: () => {
      toast({ title: '模板删除成功' })
      void queryClient.invalidateQueries({ queryKey: templateQueryKey })
    },
    onError: () => {
      toast({ title: '模板删除失败', variant: 'destructive' })
    },
  })

  const handleSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (template: NotificationTemplateRow) => {
    setEditingTemplate(template)
    form.reset({
      name: template.name,
      type: template.type as TemplateFormData['type'],
      subject: template.subject || '',
      content: template.content,
      variables: template.variables || '',
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个模板吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />
      case 'IN_APP':
        return <Bell className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      EMAIL: { label: '邮件', variant: 'default' },
      SMS: { label: '短信', variant: 'secondary' },
      IN_APP: { label: '站内', variant: 'outline' },
    }
    const { label, variant } = config[type] || { label: type, variant: 'default' as const }
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">通知模板管理</h2>
          <p className="text-muted-foreground mt-1 text-sm">管理邮件、短信和站内消息模板</p>
        </div>
        <Dialog
          open={isCreateDialogOpen || !!editingTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false)
              setEditingTemplate(null)
              form.reset()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新建模板
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? '编辑模板' : '新建模板'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>模板名称</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：报名成功通知" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>通知类型</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMAIL">邮件</SelectItem>
                          <SelectItem value="SMS">短信</SelectItem>
                          <SelectItem value="IN_APP">站内消息</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('type') === 'EMAIL' && (
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>邮件主题</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：您的报名已成功提交" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>模板内容</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="支持变量：{{name}}, {{examTitle}}, {{positionTitle}}, {{applicationNo}}"
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="variables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>可用变量（逗号分隔）</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：name,examTitle,positionTitle,applicationNo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setEditingTemplate(null)
                      form.reset()
                    }}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTemplate ? '更新' : '创建'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>模板列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !templates || templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无模板</h3>
              <p className="text-sm text-muted-foreground mb-4">创建您的第一个通知模板</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新建模板
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>模板名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>主题</TableHead>
                    <TableHead>可用变量</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          {getTypeBadge(template.type)}
                        </div>
                      </TableCell>
                      <TableCell>{template.subject || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{template.variables || '-'}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(template.id)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
