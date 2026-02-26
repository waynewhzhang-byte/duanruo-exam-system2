/**
 * Auto-review rules configuration page
 * 自动审核规则配置页面
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { ArrowLeft, Save, Plus, Trash2, Play, AlertCircle, Check } from 'lucide-react'
import { useExamAutoReviewRules, useUpdateExamAutoReviewRules } from '@/lib/api-hooks'
import { useTenant } from '@/hooks/useTenant'
import { toast } from 'sonner'
import { PermissionCodes } from '@/lib/permissions-unified'
import {
  Rule,
  RuleAction,
  RuleType,
  RULE_TYPE_LABELS,
  RULE_ACTION_LABELS,
  RULE_TEMPLATES,
} from '@/types/auto-review-rules'
import { RouteGuard } from '@/components/auth/RouteGuard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function AutoReviewRulesPage() {
  return (
    <RouteGuard roles={['TENANT_ADMIN', 'EXAM_ADMIN']} permissions={[PermissionCodes.EXAM_EDIT]}>
      <AutoReviewRulesContent />
    </RouteGuard>
  )
}

function AutoReviewRulesContent() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string
  const { tenant } = useTenant()

  const { data: rulesData, isLoading } = useExamAutoReviewRules(examId, tenant?.id)
  const updateRules = useUpdateExamAutoReviewRules()

  const [rules, setRules] = useState<Rule[]>([])
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(null)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)

  // Initialize rules from API
  useEffect(() => {
    if (rulesData?.rules) {
      setRules(rulesData.rules as Rule[])
    }
  }, [rulesData])

  const handleAddRule = (template?: Partial<Rule>) => {
    const type = template?.type || 'field_equals'
    const newRule = {
      name: '新规则',
      type,
      action: 'REJECT',
      reason: '',
      enabled: true,
      ...(type === 'field_equals' ? { field: '', value: '' } : {}),
      ...(type === 'field_between' ? { field: '', min: 0, max: 0 } : {}),
      ...(type === 'field_gt' || type === 'field_gte' || type === 'field_lt' || type === 'field_lte' ? { field: '', value: 0 } : {}),
      ...(type === 'field_regex' ? { field: '', pattern: '' } : {}),
      ...(type === 'field_contains' ? { field: '', substring: '' } : {}),
      ...(type === 'field_in' ? { field: '', values: [] } : {}),
      ...(type === 'has_attachment' ? { fieldKey: '' } : {}),
      ...template,
    } as Rule

    setRules([...rules, newRule])
    setSelectedRuleIndex(rules.length)
    setIsTemplateDialogOpen(false)
  }

  const handleUpdateRule = (index: number, updatedRule: Partial<Rule>) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], ...updatedRule } as Rule
    setRules(newRules)
  }

  const handleDeleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
    if (selectedRuleIndex === index) {
      setSelectedRuleIndex(null)
    }
  }

  const handleSave = async () => {
    if (!tenant?.id) {
      toast.error('租户信息不可用')
      return
    }
    try {
      await updateRules.mutateAsync({
        examId,
        rules: { rules },
        tenantId: tenant.id,
      })
      toast.success('规则保存成功')
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
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
            <h1 className="text-2xl font-bold">自动审核规则配置</h1>
            <p className="text-sm text-muted-foreground">
              配置自动审核规则，系统将根据规则自动处理报名申请
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateRules.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateRules.isPending ? '保存中...' : '保存规则'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">规则列表</CardTitle>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      添加
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>选择规则模板</DialogTitle>
                      <DialogDescription>
                        从预设模板中选择，或创建空白规则
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto p-4"
                          onClick={() => {
                            handleAddRule()
                          }}
                        >
                          <div className="text-left">
                            <div className="font-medium">空白规则</div>
                            <div className="text-sm text-muted-foreground">
                              从头开始创建自定义规则
                            </div>
                          </div>
                        </Button>

                        {Object.entries(RULE_TEMPLATES).map(([key, template]) => (
                          <Button
                            key={key}
                            variant="outline"
                            className="w-full justify-start h-auto p-4"
                            onClick={() => handleAddRule(template)}
                          >
                            <div className="text-left">
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {template.description}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                共 {rules.length} 条规则
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无规则</p>
                    <p className="text-xs">点击上方按钮添加规则</p>
                  </div>
                ) : (
                  rules.map((rule, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRuleIndex === index
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                        }`}
                      onClick={() => setSelectedRuleIndex(index)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{rule.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {RULE_TYPE_LABELS[rule.type]}
                          </div>
                        </div>
                        <Badge variant={rule.action === 'REJECT' || rule.action === 'AUTO_REJECT' ? 'destructive' : 'default'} className="text-xs">
                          {RULE_ACTION_LABELS[rule.action]}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rule Editor */}
        <div className="lg:col-span-2">
          {selectedRuleIndex !== null && rules[selectedRuleIndex] ? (
            <RuleEditor
              rule={rules[selectedRuleIndex]}
              onUpdate={(updatedRule) => handleUpdateRule(selectedRuleIndex, updatedRule)}
              onDelete={() => handleDeleteRule(selectedRuleIndex)}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">未选择规则</h3>
                <p className="text-sm text-muted-foreground">
                  从左侧列表选择一条规则进行编辑，或添加新规则
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Rule Editor Component
function RuleEditor({
  rule,
  onUpdate,
  onDelete,
}: {
  rule: Rule
  onUpdate: (rule: Partial<Rule>) => void
  onDelete: () => void
}) {
  const [localRule, setLocalRule] = useState(rule)

  useEffect(() => {
    setLocalRule(rule)
  }, [rule])

  const handleChange = (field: string, value: any) => {
    const updated = { ...localRule, [field]: value }
    setLocalRule(updated)
    onUpdate(updated)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">编辑规则</CardTitle>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rule Name */}
        <div className="space-y-2">
          <Label htmlFor="rule-name">规则名称 *</Label>
          <Input
            id="rule-name"
            value={localRule.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="例如：年龄限制"
          />
        </div>

        {/* Rule Type */}
        <div className="space-y-2">
          <Label htmlFor="rule-type">规则类型 *</Label>
          <Select
            value={localRule.type}
            onValueChange={(value) => handleChange('type', value as RuleType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="field_equals">字段等于</SelectItem>
              <SelectItem value="field_gt">字段大于</SelectItem>
              <SelectItem value="field_gte">字段大于等于</SelectItem>
              <SelectItem value="field_lt">字段小于</SelectItem>
              <SelectItem value="field_lte">字段小于等于</SelectItem>
              <SelectItem value="field_between">字段在范围内</SelectItem>
              <SelectItem value="field_regex">正则匹配</SelectItem>
              <SelectItem value="field_contains">字段包含</SelectItem>
              <SelectItem value="field_in">字段在列表中</SelectItem>
              <SelectItem value="has_attachment">有附件</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rule Action */}
        <div className="space-y-2">
          <Label htmlFor="rule-action">触发动作 *</Label>
          <Select
            value={localRule.action}
            onValueChange={(value) => handleChange('action', value as RuleAction)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PASS">通过</SelectItem>
              <SelectItem value="AUTO_PASS">自动通过</SelectItem>
              <SelectItem value="REJECT">拒绝</SelectItem>
              <SelectItem value="AUTO_REJECT">自动拒绝</SelectItem>
              <SelectItem value="PENDING_REVIEW">人工审核</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type-specific fields */}
        <RuleTypeFields rule={localRule} onChange={handleChange} />

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="rule-reason">触发原因 *</Label>
          <Textarea
            id="rule-reason"
            value={localRule.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            placeholder="例如：年龄不符合要求（18-35岁）"
            rows={3}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="rule-description">规则说明（可选）</Label>
          <Textarea
            id="rule-description"
            value={localRule.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="描述此规则的用途和逻辑"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Type-specific fields component
function RuleTypeFields({ rule, onChange }: { rule: Rule; onChange: (field: string, value: any) => void }) {
  switch (rule.type) {
    case 'field_equals':
    case 'field_gt':
    case 'field_gte':
    case 'field_lt':
    case 'field_lte':
      return (
        <>
          <div className="space-y-2">
            <Label>字段名 *</Label>
            <Input
              value={(rule as any).field || ''}
              onChange={(e) => onChange('field', e.target.value)}
              placeholder="例如：age"
            />
          </div>
          <div className="space-y-2">
            <Label>比较值 *</Label>
            <Input
              type="number"
              value={(rule as any).value || ''}
              onChange={(e) => onChange('value', Number(e.target.value))}
              placeholder="例如：18"
            />
          </div>
        </>
      )

    case 'field_between':
      return (
        <>
          <div className="space-y-2">
            <Label>字段名 *</Label>
            <Input
              value={(rule as any).field || ''}
              onChange={(e) => onChange('field', e.target.value)}
              placeholder="例如：age"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>最小值 *</Label>
              <Input
                type="number"
                value={(rule as any).min || ''}
                onChange={(e) => onChange('min', Number(e.target.value))}
                placeholder="例如：18"
              />
            </div>
            <div className="space-y-2">
              <Label>最大值 *</Label>
              <Input
                type="number"
                value={(rule as any).max || ''}
                onChange={(e) => onChange('max', Number(e.target.value))}
                placeholder="例如：35"
              />
            </div>
          </div>
        </>
      )

    case 'field_regex':
      return (
        <>
          <div className="space-y-2">
            <Label>字段名 *</Label>
            <Input
              value={(rule as any).field || ''}
              onChange={(e) => onChange('field', e.target.value)}
              placeholder="例如：idNumber"
            />
          </div>
          <div className="space-y-2">
            <Label>正则表达式 *</Label>
            <Input
              value={(rule as any).pattern || ''}
              onChange={(e) => onChange('pattern', e.target.value)}
              placeholder="例如：^[1-9]\d{17}$"
            />
          </div>
        </>
      )

    case 'field_contains':
      return (
        <>
          <div className="space-y-2">
            <Label>字段名 *</Label>
            <Input
              value={(rule as any).field || ''}
              onChange={(e) => onChange('field', e.target.value)}
              placeholder="例如：address"
            />
          </div>
          <div className="space-y-2">
            <Label>包含文本 *</Label>
            <Input
              value={(rule as any).substring || ''}
              onChange={(e) => onChange('substring', e.target.value)}
              placeholder="例如：北京"
            />
          </div>
        </>
      )

    case 'field_in':
      return (
        <>
          <div className="space-y-2">
            <Label>字段名 *</Label>
            <Input
              value={(rule as any).field || ''}
              onChange={(e) => onChange('field', e.target.value)}
              placeholder="例如：education"
            />
          </div>
          <div className="space-y-2">
            <Label>允许的值（逗号分隔）*</Label>
            <Input
              value={((rule as any).values || []).join(',')}
              onChange={(e) => onChange('values', e.target.value.split(',').map(v => v.trim()))}
              placeholder="例如：BACHELOR,MASTER,PHD"
            />
          </div>
        </>
      )

    case 'has_attachment':
      return (
        <div className="space-y-2">
          <Label>附件字段键 *</Label>
          <Input
            value={(rule as any).fieldKey || ''}
            onChange={(e) => onChange('fieldKey', e.target.value)}
            placeholder="例如：id_card"
          />
        </div>
      )

    default:
      return null
  }
}
