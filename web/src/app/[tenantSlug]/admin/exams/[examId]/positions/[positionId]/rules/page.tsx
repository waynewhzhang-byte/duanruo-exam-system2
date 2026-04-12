/**
 * Position-level auto-review rules configuration page
 * 岗位级别自动审核规则配置页面
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
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, Info, Copy } from 'lucide-react'
import { usePositionAutoReviewRules, useUpdatePositionAutoReviewRules } from '@/lib/api-hooks'
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function PositionRulesPage() {
  return (
    <RouteGuard roles={['TENANT_ADMIN', 'EXAM_ADMIN']} permissions={[PermissionCodes.EXAM_EDIT]}>
      <PositionRulesContent />
    </RouteGuard>
  )
}

function PositionRulesContent() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string
  const positionId = params.positionId as string
  const tenantSlug = params.tenantSlug as string
  const { tenant } = useTenant()

  const { data: rulesData, isLoading } = usePositionAutoReviewRules(positionId, tenant?.id)
  const updateRules = useUpdatePositionAutoReviewRules()

  const [rules, setRules] = useState<Rule[]>([])
  const [usePositionRules, setUsePositionRules] = useState(false)
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(null)

  // Initialize rules from API
  useEffect(() => {
    if (rulesData?.rulesConfig) {
      try {
        const parsed = JSON.parse(rulesData.rulesConfig)
        if (parsed.rules) {
          setRules(parsed.rules as Rule[])
          setUsePositionRules(true)
        }
      } catch (e) {
        console.error('Failed to parse rules config:', e)
      }
    }
  }, [rulesData])

  const handleAddRule = (template?: Partial<Rule>) => {
    const baseRule = {
      name: template?.name || '新规则',
      type: (template?.type || 'field_equals') as RuleType,
      action: (template?.action || 'REJECT') as RuleAction,
      reason: template?.reason || '',
      description: template?.description,
      enabled: true,
    }

    // Merge with template, ensuring type safety
    const newRule = { ...baseRule, ...template } as Rule
    setRules([...rules, newRule])
    setSelectedRuleIndex(rules.length)
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
      const rulesConfig = usePositionRules ? JSON.stringify({ rules }) : null
      await updateRules.mutateAsync({
        positionId,
        rulesConfig,
        tenantId: tenant.id,
      })
      toast.success('岗位规则保存成功')
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    }
  }

  const handleCopyFromExam = () => {
    // Navigate to exam rules page to copy
    toast.info('请从考试级别规则页面复制规则配置')
    window.open(`/${tenantSlug}/admin/exams/${examId}/auto-review-rules`, '_blank')
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
            onClick={() => router.push(`/${tenantSlug}/admin/exams/${examId}/positions`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回岗位列表
          </Button>
          <div>
            <h1 className="text-2xl font-bold">岗位自动审核规则</h1>
            <p className="text-sm text-muted-foreground">
              为此岗位配置独立的自动审核规则，将覆盖考试级别规则
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateRules.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateRules.isPending ? '保存中...' : '保存规则'}
        </Button>
      </div>

      {/* Position Rules Toggle */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>岗位级别规则</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>启用后，此岗位的报名将使用独立的审核规则，而非考试级别的通用规则</span>
          <div className="flex items-center gap-2">
            <Switch
              checked={usePositionRules}
              onCheckedChange={setUsePositionRules}
            />
            <span className="text-sm">{usePositionRules ? '已启用' : '未启用'}</span>
          </div>
        </AlertDescription>
      </Alert>

      {!usePositionRules ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              当前使用考试级别的自动审核规则
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setUsePositionRules(true)}>
                启用岗位级别规则
              </Button>
              <Button variant="outline" onClick={handleCopyFromExam}>
                <Copy className="h-4 w-4 mr-2" />
                查看考试规则
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PositionRulesEditor
          rules={rules}
          selectedRuleIndex={selectedRuleIndex}
          onSelectRule={setSelectedRuleIndex}
          onAddRule={handleAddRule}
          onUpdateRule={handleUpdateRule}
          onDeleteRule={handleDeleteRule}
        />
      )}
    </div>
  )
}

// Rules Editor Component
interface PositionRulesEditorProps {
  rules: Rule[]
  selectedRuleIndex: number | null
  onSelectRule: (index: number | null) => void
  onAddRule: (template?: Partial<Rule>) => void
  onUpdateRule: (index: number, rule: Partial<Rule>) => void
  onDeleteRule: (index: number) => void
}

function PositionRulesEditor({
  rules,
  selectedRuleIndex,
  onSelectRule,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
}: PositionRulesEditorProps) {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const selectedRule = selectedRuleIndex !== null ? rules[selectedRuleIndex] : null

  const handleAddRule = (template?: Partial<Rule>) => {
    onAddRule(template)
    setIsTemplateDialogOpen(false)
  }

  return (
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
                        onClick={() => handleAddRule()}
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
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无规则，点击添加
                </p>
              ) : (
                rules.map((rule, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRuleIndex === index
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSelectRule(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRule(index); } }}
                    aria-label={`规则 ${rule.name}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{rule.name}</span>
                        {rule.enabled === false && (
                          <Badge variant="secondary" className="text-xs">
                            已禁用
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant={
                          rule.action === 'REJECT' || rule.action === 'AUTO_REJECT'
                            ? 'destructive'
                            : rule.action === 'PASS' || rule.action === 'AUTO_PASS'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {RULE_ACTION_LABELS[rule.action]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {RULE_TYPE_LABELS[rule.type]}
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
        {selectedRule && selectedRuleIndex !== null ? (
          <RuleEditor
            rule={selectedRule}
            onUpdate={(updatedRule) => onUpdateRule(selectedRuleIndex, updatedRule)}
            onDelete={() => onDeleteRule(selectedRuleIndex)}
          />
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                选择一条规则进行编辑
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Rule Editor Component
interface RuleEditorProps {
  rule: Rule
  onUpdate: (rule: Partial<Rule>) => void
  onDelete: () => void
}

function RuleEditor({ rule, onUpdate, onDelete }: RuleEditorProps) {
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
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>规则名称</Label>
            <Input
              value={rule.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="输入规则名称"
            />
          </div>
          <div className="space-y-2">
            <Label>规则类型</Label>
            <Select value={rule.type} onValueChange={(value) => onUpdate({ type: value as RuleType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rule Action */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>匹配时动作</Label>
            <Select value={rule.action} onValueChange={(value) => onUpdate({ action: value as RuleAction })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RULE_ACTION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex items-end">
            <div className="flex items-center gap-2">
              <Switch
                checked={rule.enabled !== false}
                onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              />
              <Label>启用规则</Label>
            </div>
          </div>
        </div>

        {/* Field Configuration based on rule type */}
        {(rule.type === 'field_equals' || rule.type === 'field_gt' ||
          rule.type === 'field_gte' || rule.type === 'field_lt' ||
          rule.type === 'field_lte' || rule.type === 'field_regex' ||
          rule.type === 'field_contains' || rule.type === 'field_in') && (
          <div className="space-y-2">
            <Label>字段名</Label>
            <Input
              value={(rule as any).field || ''}
              onChange={(e) => onUpdate({ field: e.target.value } as any)}
              placeholder="例如: age, gender, education"
            />
          </div>
        )}

        {(rule.type === 'field_equals') && (
          <div className="space-y-2">
            <Label>期望值</Label>
            <Input
              value={(rule as any).value || ''}
              onChange={(e) => onUpdate({ value: e.target.value } as any)}
              placeholder="输入期望值"
            />
          </div>
        )}

        {(rule.type === 'field_gt' || rule.type === 'field_gte' ||
          rule.type === 'field_lt' || rule.type === 'field_lte') && (
          <div className="space-y-2">
            <Label>比较值</Label>
            <Input
              type="number"
              value={(rule as any).value || ''}
              onChange={(e) => onUpdate({ value: Number(e.target.value) } as any)}
              placeholder="输入数值"
            />
          </div>
        )}

        {rule.type === 'field_regex' && (
          <div className="space-y-2">
            <Label>正则表达式</Label>
            <Input
              value={(rule as any).pattern || ''}
              onChange={(e) => onUpdate({ pattern: e.target.value } as any)}
              placeholder="输入正则表达式"
            />
          </div>
        )}

        {rule.type === 'field_contains' && (
          <div className="space-y-2">
            <Label>包含的子字符串</Label>
            <Input
              value={(rule as any).substring || ''}
              onChange={(e) => onUpdate({ substring: e.target.value } as any)}
              placeholder="输入要包含的字符串"
            />
          </div>
        )}

        {rule.type === 'field_in' && (
          <div className="space-y-2">
            <Label>值列表（多个值用英文逗号分隔）</Label>
            <Input
              value={Array.isArray((rule as any).values) ? (rule as any).values.join(', ') : ''}
              onChange={(e) => {
                const values = e.target.value.split(',').map(v => v.trim()).filter(v => v)
                onUpdate({ values } as any)
              }}
              placeholder="例如: BACHELOR, MASTER, DOCTORATE"
            />
            <p className="text-xs text-muted-foreground">
              学历示例：BACHELOR（本科）, MASTER（硕士）, DOCTORATE（博士）
            </p>
          </div>
        )}

        {rule.type === 'field_between' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>最小值</Label>
              <Input
                type="number"
                value={(rule as any).min || ''}
                onChange={(e) => onUpdate({ min: Number(e.target.value) } as any)}
                placeholder="输入最小值"
              />
            </div>
            <div className="space-y-2">
              <Label>最大值</Label>
              <Input
                type="number"
                value={(rule as any).max || ''}
                onChange={(e) => onUpdate({ max: Number(e.target.value) } as any)}
                placeholder="输入最大值"
              />
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <Label>拒绝/通过原因</Label>
          <Textarea
            value={rule.reason}
            onChange={(e) => onUpdate({ reason: e.target.value })}
            placeholder="输入原因说明，将显示给考生"
            rows={3}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>规则描述（可选）</Label>
          <Textarea
            value={rule.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="输入规则描述，便于管理"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  )
}

