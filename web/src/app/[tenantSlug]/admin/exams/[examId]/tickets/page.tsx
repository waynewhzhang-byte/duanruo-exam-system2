/**
 * Ticket Template Configuration and Management Page
 * 准考证模板配置和管理页面
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Ticket,
  FileText,
  Settings,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  useTicketTemplate,
  useUpdateTicketTemplate,
  useResetTicketTemplate,
  useBatchGenerateTickets,
  useTicketStatistics,
} from '@/lib/api-hooks'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { PermissionCodes } from '@/lib/permissions-unified'
import { toast } from 'sonner'
import { useTenant } from '@/hooks/useTenant'
import type {
  TicketTemplate,
} from '@/types/ticket'
import {
  TICKET_NUMBER_RULE_PRESETS,
  DEFAULT_TICKET_TEMPLATE_STYLE,
} from '@/types/ticket'

interface TicketsPageProps {
  params: {
    tenantSlug: string
    examId: string
  }
}

export default function TicketsPage({ params }: TicketsPageProps) {
  return (
    <RouteGuard roles={['TENANT_ADMIN', 'EXAM_ADMIN']} permissions={[PermissionCodes.EXAM_ADMIN_MANAGE]}>
      <TicketTemplateContent params={params} />
    </RouteGuard>
  )
}

function TicketTemplateContent({ params }: TicketsPageProps) {
  const { tenantSlug, examId } = params
  const router = useRouter()
  const { tenant } = useTenant()

  const { data: template, isLoading: templateLoading } = useTicketTemplate(examId, tenant?.id)
  const { data: statistics } = useTicketStatistics(examId, tenant?.id)
  const updateTemplate = useUpdateTicketTemplate()
  const resetTemplate = useResetTicketTemplate()
  const batchGenerate = useBatchGenerateTickets()

  const [editedTemplate, setEditedTemplate] = useState<Partial<TicketTemplate> | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [batchOptions, setBatchOptions] = useState({
    overwriteExisting: false,
  })

  useEffect(() => {
    if (template) {
      setEditedTemplate(template)
    }
  }, [template])

  const handleSaveTemplate = async () => {
    if (!editedTemplate || !examId) return

    try {
      await updateTemplate.mutateAsync({
        examId,
        template: editedTemplate as TicketTemplate,
      })
      toast.success('模板配置已保存')
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    }
  }

  const handleResetTemplate = async () => {
    try {
      await resetTemplate.mutateAsync(examId)
      toast.success('模板已重置为默认设置')
      setShowResetDialog(false)
    } catch (error: any) {
      toast.error(error?.message || '重置失败')
    }
  }

  const handleBatchGenerate = async () => {
    try {
      const result = await batchGenerate.mutateAsync({
        examId,
        overwriteExisting: batchOptions.overwriteExisting,
      })
      toast.success(
        `批量生成完成：成功 ${result.successCount} 张，失败 ${result.failureCount} 张，跳过 ${result.skippedCount} 张`
      )
      setShowBatchDialog(false)
    } catch (error: any) {
      toast.error(error?.message || '批量生成失败')
    }
  }

  const handleNumberRulePresetChange = (presetKey: string) => {
    if (!editedTemplate) return
    const preset = TICKET_NUMBER_RULE_PRESETS[presetKey]
    if (preset) {
      setEditedTemplate({
        ...editedTemplate,
        ticketNumberRule: preset,
      })
    }
  }

  if (templateLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!editedTemplate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">未找到模板配置</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/detail`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回考试详情
          </Button>
          <div>
            <h1 className="text-2xl font-bold">准考证管理</h1>
            <p className="text-sm text-muted-foreground">
              配置准考证模板并批量生成准考证
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置为默认
          </Button>
          <Button
            onClick={handleSaveTemplate}
            disabled={updateTemplate.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateTemplate.isPending ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                已生成总数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalGenerated}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                有效
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.validCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                已使用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.usedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                失效/取消
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.expiredCount + statistics.cancelledCount + statistics.revokedCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            批量生成准考证
          </CardTitle>
          <CardDescription>
            为所有符合条件的报名申请批量生成准考证
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              批量生成说明
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>只会为状态为"已通过审核并支付"的申请生成准考证</li>
              <li>如果申请已有准考证，默认会跳过（可选择覆盖）</li>
              <li>准考证号按照配置的编号规则自动生成</li>
              <li>生成后会自动生成PDF文件并保存</li>
            </ul>
          </div>

          <div className="flex items-center justify-center">
            <Button
              size="lg"
              onClick={() => setShowBatchDialog(true)}
              disabled={batchGenerate.isPending}
            >
              <Send className="h-5 w-5 mr-2" />
              {batchGenerate.isPending ? '生成中...' : '开始批量生成'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Configuration Tabs */}
      <Tabs defaultValue="number-rule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="number-rule">
            <FileText className="h-4 w-4 mr-2" />
            编号规则
          </TabsTrigger>
          <TabsTrigger value="content">
            <Ticket className="h-4 w-4 mr-2" />
            内容配置
          </TabsTrigger>
          <TabsTrigger value="style">
            <Settings className="h-4 w-4 mr-2" />
            样式设置
          </TabsTrigger>
        </TabsList>

        {/* Number Rule Tab */}
        <TabsContent value="number-rule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>准考证编号规则</CardTitle>
              <CardDescription>
                配置准考证编号的生成规则
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>选择预设规则</Label>
                <Select
                  onValueChange={handleNumberRulePresetChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择预设规则或自定义" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_NUMBER_RULE_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col py-2">
                          <span className="font-medium">{preset.name}</span>
                          <span className="text-xs text-muted-foreground">{preset.description}</span>
                          <span className="text-xs text-blue-600 mt-1">示例: {preset.example}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>当前规则</Label>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{editedTemplate.ticketNumberRule?.name}</span>
                    {editedTemplate.ticketNumberRule?.example && (
                      <Badge variant="secondary">
                        示例: {editedTemplate.ticketNumberRule.example}
                      </Badge>
                    )}
                  </div>
                  {editedTemplate.ticketNumberRule?.description && (
                    <p className="text-sm text-muted-foreground">
                      {editedTemplate.ticketNumberRule.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    组件: {editedTemplate.ticketNumberRule?.components?.length || 0} 个
                    {editedTemplate.ticketNumberRule?.separator && (
                      <> · 分隔符: "{editedTemplate.ticketNumberRule.separator}"</>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* 高级编号配置 */}
              <div className="space-y-4">
                <Label className="text-base font-medium">编号组成部分</Label>
                <p className="text-sm text-muted-foreground">
                  选择准考证编号中要包含的信息
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm">包含考试代码</Label>
                      <p className="text-xs text-muted-foreground">如: EXAM001</p>
                    </div>
                    <Switch
                      checked={editedTemplate.includeExamCode ?? true}
                      onCheckedChange={(checked) =>
                        setEditedTemplate({ ...editedTemplate, includeExamCode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm">包含考试名称</Label>
                      <p className="text-xs text-muted-foreground">如: 2024年公务员考试</p>
                    </div>
                    <Switch
                      checked={editedTemplate.includeExamName ?? false}
                      onCheckedChange={(checked) =>
                        setEditedTemplate({ ...editedTemplate, includeExamName: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm">包含岗位代码</Label>
                      <p className="text-xs text-muted-foreground">如: POS001</p>
                    </div>
                    <Switch
                      checked={editedTemplate.includePositionCode ?? true}
                      onCheckedChange={(checked) =>
                        setEditedTemplate({ ...editedTemplate, includePositionCode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm">包含岗位名称</Label>
                      <p className="text-xs text-muted-foreground">如: 综合管理岗</p>
                    </div>
                    <Switch
                      checked={editedTemplate.includePositionName ?? false}
                      onCheckedChange={(checked) =>
                        setEditedTemplate({ ...editedTemplate, includePositionName: checked })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>分隔符</Label>
                    <Input
                      value={editedTemplate.separator || '-'}
                      onChange={(e) =>
                        setEditedTemplate({ ...editedTemplate, separator: e.target.value })
                      }
                      placeholder="默认: -"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>自定义前缀</Label>
                    <Input
                      value={editedTemplate.customPrefix || ''}
                      onChange={(e) =>
                        setEditedTemplate({ ...editedTemplate, customPrefix: e.target.value })
                      }
                      placeholder="如: 2024"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>准考证内容配置</CardTitle>
              <CardDescription>
                选择准考证上要显示的信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>包含考生照片</Label>
                    <p className="text-sm text-muted-foreground">
                      在准考证上显示考生照片
                    </p>
                  </div>
                  <Switch
                    checked={editedTemplate.includePhoto || false}
                    onCheckedChange={(checked) =>
                      setEditedTemplate({ ...editedTemplate, includePhoto: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>包含考试信息</Label>
                    <p className="text-sm text-muted-foreground">
                      显示考试名称、时间等信息
                    </p>
                  </div>
                  <Switch
                    checked={editedTemplate.includeExamInfo || false}
                    onCheckedChange={(checked) =>
                      setEditedTemplate({ ...editedTemplate, includeExamInfo: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>包含考场信息</Label>
                    <p className="text-sm text-muted-foreground">
                      显示考场、座位号等信息
                    </p>
                  </div>
                  <Switch
                    checked={editedTemplate.includeVenueInfo || false}
                    onCheckedChange={(checked) =>
                      setEditedTemplate({ ...editedTemplate, includeVenueInfo: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>包含考生信息</Label>
                    <p className="text-sm text-muted-foreground">
                      显示姓名、身份证号等个人信息
                    </p>
                  </div>
                  <Switch
                    checked={editedTemplate.includeCandidateInfo || false}
                    onCheckedChange={(checked) =>
                      setEditedTemplate({ ...editedTemplate, includeCandidateInfo: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用二维码</Label>
                    <p className="text-sm text-muted-foreground">
                      生成二维码用于扫码验证
                    </p>
                  </div>
                  <Switch
                    checked={editedTemplate.qrCodeEnabled || false}
                    onCheckedChange={(checked) =>
                      setEditedTemplate({ ...editedTemplate, qrCodeEnabled: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用条形码</Label>
                    <p className="text-sm text-muted-foreground">
                      生成条形码用于快速识别
                    </p>
                  </div>
                  <Switch
                    checked={editedTemplate.barcodeEnabled || false}
                    onCheckedChange={(checked) =>
                      setEditedTemplate({ ...editedTemplate, barcodeEnabled: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>页眉文本（可选）</Label>
                  <Input
                    value={editedTemplate.headerText || ''}
                    onChange={(e) =>
                      setEditedTemplate({ ...editedTemplate, headerText: e.target.value })
                    }
                    placeholder="例如：XX省XX考试准考证"
                  />
                </div>

                <div className="space-y-2">
                  <Label>页脚文本（可选）</Label>
                  <Input
                    value={editedTemplate.footerText || ''}
                    onChange={(e) =>
                      setEditedTemplate({ ...editedTemplate, footerText: e.target.value })
                    }
                    placeholder="例如：请妥善保管，考试当天携带入场"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo URL（可选）</Label>
                  <Input
                    value={editedTemplate.logoUrl || ''}
                    onChange={(e) =>
                      setEditedTemplate({ ...editedTemplate, logoUrl: e.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>准考证样式设置</CardTitle>
              <CardDescription>
                配置准考证PDF的页面样式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>页面大小</Label>
                  <Select
                    value={editedTemplate.templateStyle?.pageSize || 'A4'}
                    onValueChange={(value) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        templateStyle: {
                          ...DEFAULT_TICKET_TEMPLATE_STYLE,
                          ...editedTemplate.templateStyle,
                          pageSize: value as 'A4' | 'A5' | 'LETTER',
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                      <SelectItem value="LETTER">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>页面方向</Label>
                  <Select
                    value={editedTemplate.templateStyle?.orientation || 'PORTRAIT'}
                    onValueChange={(value) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        templateStyle: {
                          ...DEFAULT_TICKET_TEMPLATE_STYLE,
                          ...editedTemplate.templateStyle,
                          orientation: value as 'PORTRAIT' | 'LANDSCAPE',
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PORTRAIT">纵向</SelectItem>
                      <SelectItem value="LANDSCAPE">横向</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>字体大小</Label>
                  <Input
                    type="number"
                    min={8}
                    max={24}
                    value={editedTemplate.templateStyle?.fontSize || 12}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        templateStyle: {
                          ...DEFAULT_TICKET_TEMPLATE_STYLE,
                          ...editedTemplate.templateStyle,
                          fontSize: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>字体</Label>
                  <Select
                    value={editedTemplate.templateStyle?.fontFamily || 'SimSun'}
                    onValueChange={(value) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        templateStyle: {
                          ...DEFAULT_TICKET_TEMPLATE_STYLE,
                          ...editedTemplate.templateStyle,
                          fontFamily: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SimSun">宋体</SelectItem>
                      <SelectItem value="SimHei">黑体</SelectItem>
                      <SelectItem value="KaiTi">楷体</SelectItem>
                      <SelectItem value="FangSong">仿宋</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>主要颜色</Label>
                  <Input
                    type="color"
                    value={editedTemplate.templateStyle?.primaryColor || '#000000'}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        templateStyle: {
                          ...DEFAULT_TICKET_TEMPLATE_STYLE,
                          ...editedTemplate.templateStyle,
                          primaryColor: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>次要颜色</Label>
                  <Input
                    type="color"
                    value={editedTemplate.templateStyle?.secondaryColor || '#666666'}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        templateStyle: {
                          ...DEFAULT_TICKET_TEMPLATE_STYLE,
                          ...editedTemplate.templateStyle,
                          secondaryColor: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用边框</Label>
                  <p className="text-sm text-muted-foreground">
                    在准考证周围显示边框
                  </p>
                </div>
                <Switch
                  checked={editedTemplate.templateStyle?.borderEnabled || false}
                  onCheckedChange={(checked) =>
                    setEditedTemplate({
                      ...editedTemplate,
                      templateStyle: {
                        ...DEFAULT_TICKET_TEMPLATE_STYLE,
                        ...editedTemplate.templateStyle,
                        borderEnabled: checked,
                      },
                    })
                  }
                />
              </div>

              {editedTemplate.templateStyle?.borderEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>边框颜色</Label>
                    <Input
                      type="color"
                      value={editedTemplate.templateStyle?.borderColor || '#000000'}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          templateStyle: {
                            ...DEFAULT_TICKET_TEMPLATE_STYLE,
                            ...editedTemplate.templateStyle,
                            borderColor: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>边框宽度 (px)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={editedTemplate.templateStyle?.borderWidth || 1}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          templateStyle: {
                            ...DEFAULT_TICKET_TEMPLATE_STYLE,
                            ...editedTemplate.templateStyle,
                            borderWidth: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重置</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要将准考证模板重置为默认设置吗？此操作将清除所有自定义配置。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Generation Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量生成准考证</DialogTitle>
            <DialogDescription>
              为所有符合条件的报名申请批量生成准考证
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>覆盖已有准考证</Label>
                <p className="text-sm text-muted-foreground">
                  如果申请已有准考证，是否重新生成覆盖
                </p>
              </div>
              <Switch
                checked={batchOptions.overwriteExisting}
                onCheckedChange={(checked) =>
                  setBatchOptions({ ...batchOptions, overwriteExisting: checked })
                }
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">注意事项：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>批量生成可能需要较长时间，请耐心等待</li>
                    <li>只会为已支付且审核通过的申请生成准考证</li>
                    <li>准考证号一旦生成不建议修改</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
              取消
            </Button>
            <Button onClick={handleBatchGenerate} disabled={batchGenerate.isPending}>
              {batchGenerate.isPending ? '生成中...' : '开始生成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
