'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Eye, Send, FileText, Plus, AlertCircle, Info } from 'lucide-react'
import { useTenant } from '@/hooks/useTenant'
import {
  useExamFormTemplate,
  useCreateFormTemplate,
  useBatchUpdateFormTemplate,
  usePublishFormTemplate,
  useAssignFormTemplateToExam,
  useExamStatistics,
  FormTemplateStatus,
  FormTemplate as FormTemplateType,
  BatchFieldRequest,
} from '@/lib/api-hooks'
import FormBuilder from '@/components/admin/form-builder/FormBuilder'
import { FormTemplate, FormField, FormSection } from '@/types/form-template'
import { BASIC_TEMPLATE } from '@/data/form-templates'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/loading'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ExamApplicationFormProps {
  examId: string
}

export default function ExamApplicationForm({ examId }: Readonly<ExamApplicationFormProps>) {
  const [activeView, setActiveView] = useState<'builder' | 'info'>('builder')
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { tenant } = useTenant()

  // Fetch exam's form template
  const { data: formTemplate, isLoading, error: formTemplateError, refetch } = useExamFormTemplate(examId, tenant?.id)

  // Fetch exam statistics to check if there are submitted applications
  const { data: examStats } = useExamStatistics(examId)
  const hasSubmittedApplications = examStats && (
    (examStats.totalApplications ?? 0) - (examStats.draftApplications ?? 0) > 0
  )

  // Mutations
  const createFormTemplate = useCreateFormTemplate()
  const batchUpdateFormTemplate = useBatchUpdateFormTemplate()
  const publishFormTemplate = usePublishFormTemplate()
  const assignFormTemplate = useAssignFormTemplateToExam()

  // Handler to manually create form template
  const handleCreateTemplate = async () => {
    if (!tenant?.id || !examId || isCreating) return

    setIsCreating(true)
    try {
      // Use timestamp to ensure unique template name
      const templateName = `考试报名表单 - ${examId.substring(0, 8)} - ${Date.now()}`
      const newTemplate = await createFormTemplate.mutateAsync({
        templateName,
        description: '报名表单模板',
        examId, // Pass examId so backend saves directly to exam
        tenantId: tenant.id,
      })

      await refetch()
      toast.success('报名表单模板创建成功')
    } catch (error: any) {
      console.error('Failed to create form template:', error)
      if (error?.message?.includes('模板名称已存在')) {
        toast.error('表单模板已存在，请刷新页面重试')
      } else if (error?.message?.includes('已有报名提交') || error?.message?.includes('FORM_TEMPLATE_LOCKED')) {
        toast.error('该考试已有报名提交，无法创建新的表单模板')
      } else {
        toast.error('创建表单模板失败：' + (error?.message || '未知错误'))
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Map UI field type to API field type
  const mapFieldType = (uiType: string): string => {
    const typeMap: Record<string, string> = {
      'text': 'TEXT_SHORT',
      'textarea': 'TEXT_LONG',
      'number': 'NUMBER_INTEGER',
      'email': 'EMAIL',
      'phone': 'PHONE',
      'date': 'DATE',
      'select': 'SELECT_SINGLE',
      'radio': 'SELECT_SINGLE',
      'checkbox': 'SELECT_MULTIPLE',
      'file': 'FILE_DOCUMENT',
      'file-upload': 'FILE_DOCUMENT',
      'agreement': 'SELECT_SINGLE',
    }
    return typeMap[uiType] || 'TEXT_SHORT'
  }

  const handleSaveTemplate = async (template: FormTemplate) => {
    if (!formTemplate || !tenant?.id) {
      toast.error('表单模板信息缺失')
      return
    }

    try {
      // Convert FormTemplate (UI type) to BatchFieldRequest[] (API type)
      const fields: BatchFieldRequest[] = template.sections.flatMap((section, sectionIndex) =>
        section.fields.map((field, fieldIndex) => {
          const batchField: BatchFieldRequest = {
            fieldKey: field.key || field.id,
            fieldType: mapFieldType(field.type),
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            required: field.required || false,
            displayOrder: sectionIndex * 1000 + fieldIndex,
          }

          // Add options for select/radio fields
          if (field.options && field.options.length > 0) {
            batchField.options = {
              allowCustomInput: false,
              options: field.options.map((opt: { value: string; label: string }) => ({
                value: opt.value,
                label: opt.label,
              })),
            }
          }

          return batchField
        })
      )

      await batchUpdateFormTemplate.mutateAsync({
        templateId: formTemplate.id,
        templateName: template.name,
        description: template.description,
        fields,
        examId, // Pass examId so backend knows which exam to update
        tenantId: tenant.id,
      })

      await refetch()
      toast.success('表单模板保存成功')
    } catch (error: any) {
      toast.error('保存失败：' + (error?.message || '未知错误'))
    }
  }

  const handlePublish = async () => {
    if (!formTemplate || !tenant?.id) {
      toast.error('表单模板信息缺失')
      return
    }

    try {
      await publishFormTemplate.mutateAsync({
        templateId: formTemplate.id,
        examId, // Pass examId so backend knows which exam to update
        tenantId: tenant.id,
      })

      await refetch()
      setPublishDialogOpen(false)
      toast.success('表单模板已发布！考生现在可以看到并填写报名表单。')
    } catch (error: any) {
      toast.error('发布失败：' + (error?.message || '未知错误'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const getStatusBadge = (status: FormTemplateStatus) => {
    switch (status) {
      case FormTemplateStatus.DRAFT:
        return <Badge variant="outline">草稿</Badge>
      case FormTemplateStatus.PUBLISHED:
        return <Badge variant="default">已发布</Badge>
      case FormTemplateStatus.ARCHIVED:
        return <Badge variant="secondary">已归档</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle>报名表单配置</CardTitle>
                <CardDescription>使用可视化设计器配置候选人报名表单</CardDescription>
              </div>
              {formTemplate && getStatusBadge(formTemplate.status)}
            </div>
            <div className="flex items-center gap-2">
              {formTemplate && formTemplate.status === FormTemplateStatus.DRAFT && (
                <Button onClick={() => setPublishDialogOpen(true)} variant="default">
                  <Send className="h-4 w-4 mr-2" />
                  发布表单
                </Button>
              )}
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
                <TabsList>
                  <TabsTrigger value="builder">
                    <Settings className="h-4 w-4 mr-2" />
                    表单设计器
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    <Eye className="h-4 w-4 mr-2" />
                    使用说明
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
      </Card>

      {formTemplate && formTemplate.status === FormTemplateStatus.PUBLISHED && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5" />
              <p className="text-sm font-medium">
                此表单已发布，考生可以看到并填写。已发布的表单为只读状态，如需修改请创建新版本。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'builder' ? (
        formTemplate ? (
          <FormBuilder
            examId={examId}
            initialTemplate={convertToUITemplate(formTemplate)}
            onSave={handleSaveTemplate}
            readOnly={formTemplate.status === FormTemplateStatus.PUBLISHED}
          />
        ) : hasSubmittedApplications ? (
          // 已有报名但没有关联表单模板的情况
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Info className="h-8 w-8 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">考试已有报名记录</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    该考试已有考生提交报名（共 {examStats?.totalApplications ?? 0} 条报名记录），
                    考生使用的是系统默认表单或之前配置的表单模板进行报名。
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    为保护已提交的报名数据，无法再修改或创建新的表单模板。
                  </p>
                </div>
                <Alert className="max-w-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>提示</AlertTitle>
                  <AlertDescription>
                    如需查看考生的报名信息，请前往"报名考生"页签查看详细的报名数据。
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        ) : (
          // 没有报名也没有表单模板的情况 - 可以创建
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">暂无报名表单</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    该考试尚未配置报名表单。点击下方按钮创建报名表单模板，配置考生报名时需要填写的信息。
                  </p>
                </div>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={isCreating}
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      创建报名表单
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>表单设计器使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">功能特点</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>可视化拖拽设计，无需编写代码</li>
                <li>支持多种字段类型：文本、数字、日期、选择、文件上传等</li>
                <li>灵活的分区管理，可折叠、可排序</li>
                <li>字段属性配置：必填、默认值、验证规则等</li>
                <li>实时预览，所见即所得</li>
                <li>支持条件显示，根据其他字段值动态显示/隐藏</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">使用步骤</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>点击"添加分区"创建表单分区</li>
                <li>从左侧字段库选择需要的字段类型</li>
                <li>点击字段添加到选中的分区</li>
                <li>在右侧配置面板设置字段属性</li>
                <li>切换到"预览"标签查看实际效果</li>
                <li>点击"保存模板"保存配置</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">字段类型说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">基础字段</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>单行文本：姓名、地址等短文本</li>
                    <li>多行文本：自我介绍、备注等长文本</li>
                    <li>数字：年龄、分数等数值</li>
                    <li>邮箱：电子邮箱地址</li>
                    <li>手机号：手机号码</li>
                    <li>日期：出生日期、入职日期等</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">选择字段</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>下拉选择：单选下拉框</li>
                    <li>单选按钮：单选按钮组</li>
                    <li>复选框：是/否选择</li>
                    <li>多选下拉：多选下拉框</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">特殊字段</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>文件上传：证件、证书等文件</li>
                    <li>身份证号：自动验证格式</li>
                    <li>地址：详细地址输入</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">复合字段</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>教育背景：学校、专业、学历等</li>
                    <li>工作经历：公司、职位、时间等</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">提示</h4>
              <p className="text-sm text-muted-foreground">
                • 建议先使用基础模板，然后根据实际需求调整
                <br />
                • 合理设置必填字段，避免过多必填导致用户体验不佳
                <br />
                • 使用分区功能将相关字段分组，提高表单可读性
                <br />
                • 定期在预览模式下测试表单，确保用户体验良好
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认发布表单模板？</AlertDialogTitle>
            <AlertDialogDescription>
              发布后，考生将能够看到并填写此报名表单。已发布的表单将变为只读状态，无法再修改。
              <br />
              <br />
              如果需要修改，您需要创建新版本的表单模板。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>确认发布</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * Convert API FormTemplate to UI FormTemplate
 * If the template has no fields, use the default BASIC_TEMPLATE
 */
function convertToUITemplate(apiTemplate: FormTemplateType): FormTemplate {
  // If template has no fields, use the default BASIC_TEMPLATE with the API template's metadata
  if (!apiTemplate.fields || apiTemplate.fields.length === 0) {
    const defaultTemplate = JSON.parse(JSON.stringify(BASIC_TEMPLATE)) as FormTemplate
    return {
      ...defaultTemplate,
      id: apiTemplate.id,
      name: apiTemplate.templateName,
      description: apiTemplate.description || defaultTemplate.description,
      version: String(apiTemplate.version),
      createdAt: apiTemplate.createdAt,
      updatedAt: apiTemplate.updatedAt,
    }
  }

  // Group fields by section (using order / 1000 as section index)
  const fieldsBySection = new Map<number, any[]>()

  apiTemplate.fields.forEach((field) => {
    // Handle both displayOrder and order fields
    const orderValue = field.displayOrder ?? field.order ?? 0
    const sectionIndex = Math.floor(orderValue / 1000)
    if (!fieldsBySection.has(sectionIndex)) {
      fieldsBySection.set(sectionIndex, [])
    }
    fieldsBySection.get(sectionIndex)!.push(field)
  })

  // Convert to UI format
  const sections = Array.from(fieldsBySection.entries())
    .sort(([a], [b]) => a - b)
    .map(([sectionIndex, fields]) => ({
      id: `section-${sectionIndex}`,
      title: `分区 ${sectionIndex + 1}`,
      description: '',
      collapsible: true,
      collapsed: false,
      order: sectionIndex,
      fields: fields
        .sort((a, b) => {
          const orderA = a.displayOrder ?? a.order ?? 0
          const orderB = b.displayOrder ?? b.order ?? 0
          return orderA - orderB
        })
        .map((field) => ({
          id: field.id,
          key: field.fieldKey,
          name: field.fieldKey || field.id,
          label: field.label || field.fieldName || '',
          type: mapApiFieldTypeToUI(field.fieldType) as any,
          required: field.required ?? false,
          disabled: false,
          placeholder: field.placeholder,
          defaultValue: field.defaultValue,
          options: field.options,
          validation: field.validationRules,
          order: field.displayOrder ?? field.order ?? 0,
          width: 'full' as const,
        })),
    }))

  return {
    id: apiTemplate.id,
    name: apiTemplate.templateName,
    description: apiTemplate.description || '',
    version: String(apiTemplate.version),
    category: 'custom',
    sections,
    fileRequirements: [],
    createdAt: apiTemplate.createdAt,
    updatedAt: apiTemplate.updatedAt,
    createdBy: '',
    isActive: true,
    allowSaveDraft: true,
    allowMultipleSubmissions: false,
    submitButtonText: '提交报名',
  }
}

/**
 * Map API field type to UI field type
 */
function mapApiFieldTypeToUI(apiType: any): string {
  const typeMap: Record<string, string> = {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    NUMBER: 'number',
    EMAIL: 'email',
    PHONE: 'phone',
    DATE: 'date',
    SELECT: 'select',
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    FILE: 'file',
  }
  return typeMap[apiType] || 'text'
}

