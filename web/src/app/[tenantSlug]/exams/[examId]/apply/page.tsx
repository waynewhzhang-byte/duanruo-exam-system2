'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGet, apiPost, apiGetWithTenant, apiPostWithTenant } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react'
import DynamicForm from '@/components/forms/DynamicForm'
import { FormTemplate } from '@/types/form-template'
import { BASIC_TEMPLATE } from '@/data/form-templates'
import { toast } from 'sonner'

interface Exam {
  id: string
  code: string
  title: string
  description: string
  status: string
  feeRequired: boolean
  feeAmount: number
}

interface Position {
  id: string
  code: string
  title: string
  description: string
  requirements: string
}

export default function ExamApplicationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string
  const positionId = searchParams.get('positionId')
  const { tenant, isLoading: tenantLoading } = useTenant()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)

  // Fetch exam details (需要传递租户ID以访问租户内的考试数据)
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ['exam', examId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiGetWithTenant<Exam>(`/exams/${examId}`, tenant.id)
    },
    enabled: !!examId && !!tenant?.id,
  })

  // Fetch position details (需要传递租户ID以访问租户内的岗位数据)
  const { data: position, isLoading: positionLoading } = useQuery<Position>({
    queryKey: ['position', positionId, tenant?.id],
    queryFn: async () => {
      if (!positionId) throw new Error('No position selected')
      if (!tenant?.id) throw new Error('Tenant ID is required')
      return apiGetWithTenant<Position>(`/positions/${positionId}`, tenant.id)
    },
    enabled: !!positionId && !!tenant?.id,
  })

  // Fetch form template from exam level (not position level)
  const { data: formTemplate, isLoading: templateLoading } = useQuery<FormTemplate>({
    queryKey: ['form-template', examId, tenant?.id],
    queryFn: async () => {
      try {
        if (!tenant?.id) throw new Error('Tenant ID is required')
        // 后端返回 FormTemplateDetailResponse 格式（需要传递租户ID）
        const response = await apiGetWithTenant<{
          id: string
          templateName: string
          description?: string
          status: string
          fields: Array<{
            id: string
            fieldKey: string
            fieldType: string
            label: string
            placeholder?: string
            helpText?: string
            required: boolean
            displayOrder: number
            options?: {
              allowCustomInput?: boolean
              options?: Array<{ value: string; label: string }>
            }
          }>
        }>(`/exams/${examId}/form-template`, tenant.id)

        // 检查模板是否已发布
        if (response.status !== 'PUBLISHED') {
          console.warn('Form template is not published yet')
          return BASIC_TEMPLATE
        }

        // 转换后端格式为前端 FormTemplate 格式
        return convertBackendToUITemplate(response)
      } catch (error) {
        console.warn('Failed to load form template, using default:', error)
        return BASIC_TEMPLATE
      }
    },
    enabled: !!examId && !!tenant?.id,
  })

  // 将后端字段类型映射为前端字段类型
  const mapBackendFieldType = (backendType: string): string => {
    const typeMap: Record<string, string> = {
      'TEXT_SHORT': 'text',
      'TEXT_LONG': 'textarea',
      'NUMBER_INTEGER': 'number',
      'NUMBER_DECIMAL': 'number',
      'EMAIL': 'email',
      'PHONE': 'phone',
      'DATE': 'date',
      'DATETIME': 'date',
      'SELECT_SINGLE': 'select',
      'SELECT_MULTIPLE': 'multi-select',
      'CHECKBOX': 'checkbox',
      'FILE_IMAGE': 'file-upload',
      'FILE_DOCUMENT': 'file-upload',
      'FILE_PDF': 'file-upload',
      'AGREEMENT': 'agreement',
      'BOOLEAN': 'checkbox',
    }
    return typeMap[backendType] || 'text'
  }

  // 转换后端模板格式为前端UI格式
  const convertBackendToUITemplate = (backendTemplate: {
    id: string
    templateName: string
    description?: string
    fields: Array<{
      id: string
      fieldKey: string
      fieldType: string
      label: string
      placeholder?: string
      helpText?: string
      required: boolean
      displayOrder: number
      options?: {
        allowCustomInput?: boolean
        options?: Array<{ value: string; label: string }>
      }
    }>
  }): FormTemplate => {
    // 智能识别协议/确认类字段（基于标签或字段键）
    const isAgreementField = (label: string, fieldKey: string): boolean => {
      const agreementKeywords = ['同意', '协议', '确认', '声明', '承诺', 'agree', 'confirm', 'terms', 'policy']
      const lowerLabel = label.toLowerCase()
      const lowerKey = fieldKey.toLowerCase()
      return agreementKeywords.some(keyword =>
        lowerLabel.includes(keyword) || lowerKey.includes(keyword)
      )
    }

    // 将所有字段放在一个默认分区中
    const fields = backendTemplate.fields
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(field => {
        let fieldType = mapBackendFieldType(field.fieldType)

        // 如果是 SELECT_SINGLE 但没有选项，且标签包含协议相关关键词，识别为协议字段
        if ((field.fieldType === 'SELECT_SINGLE' || field.fieldType === 'CHECKBOX') &&
          (!field.options?.options || field.options.options.length === 0) &&
          isAgreementField(field.label, field.fieldKey)) {
          fieldType = 'agreement'
        }

        // 根据 required 字段生成验证规则
        const validation: Array<{ type: string; value?: string | number; message: string }> = []
        if (field.required) {
          validation.push({
            type: 'required',
            message: `${field.label}为必填项`,
          })
        }

        const baseField = {
          id: field.id,
          name: field.fieldKey, // 使用 fieldKey 作为 name（react-hook-form 需要 name 属性）
          type: fieldType as any,
          label: field.label,
          placeholder: field.placeholder,
          helpText: field.helpText,
          description: field.helpText,
          required: field.required,
          disabled: false,
          width: 'full' as const,
          order: field.displayOrder,
          validation: validation.length > 0 ? validation as any[] : undefined,
          options: field.options?.options?.map(opt => ({
            value: opt.value,
            label: opt.label,
          })),
        }

        // 为文件上传类型添加默认的 fileConfig
        if (fieldType === 'file-upload') {
          return {
            ...baseField,
            fileConfig: {
              maxFiles: 5,
              maxSize: 10, // 10MB（单位是 MB）
              accept: field.fieldType === 'FILE_IMAGE'
                ? '.jpg,.jpeg,.png,.gif'
                : '.pdf,.jpg,.jpeg,.png',
              category: field.fieldKey, // 使用字段key作为分类
              required: field.required,
            },
          }
        }

        return baseField
      })

    return {
      id: backendTemplate.id,
      name: backendTemplate.templateName,
      description: backendTemplate.description || '',
      sections: [
        {
          id: 'main-section',
          title: '报名信息',
          description: '请填写以下信息',
          fields,
          order: 0,
          collapsible: false,
          collapsed: false,
        },
      ],
      version: '1.0',
      category: 'custom',
      fileRequirements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isActive: true,
      allowSaveDraft: true,
      allowMultipleSubmissions: false,
      submitButtonText: '提交报名',
    }
  }

  const isLoading = tenantLoading || examLoading || positionLoading || templateLoading

  // 如果没有选择岗位，跳转回考试详情页
  useEffect(() => {
    if (!positionId && !isLoading) {
      toast.error('请先选择要报考的岗位')
      router.push(`/${tenantSlug}/exams/${examId}`)
    }
  }, [positionId, isLoading, router, tenantSlug, examId])

  const handleSubmit = async (formData: Record<string, any>) => {
    // 【调试日志】记录从 DynamicForm 接收到的原始表单数据
    console.log('[APPLICATION_SUBMIT] Raw formData from DynamicForm:', formData)
    console.log('[APPLICATION_SUBMIT] fullName:', formData.fullName)
    console.log('[APPLICATION_SUBMIT] idNumber:', formData.idNumber)

    if (!positionId) {
      toast.error('未选择岗位')
      return
    }

    setIsSubmitting(true)
    try {
      // 分离附件和其他数据
      // 后端期望 attachments 格式: [{fileId: UUID, fieldKey: string}]
      const attachments: { fileId: string; fieldKey: string }[] = []
      const payload: Record<string, any> = {}

      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0 && value[0]?.id) {
          // 这是文件上传字段，提取 fileId
          value.forEach((file: { id: string }) => {
            if (file.id) {
              attachments.push({
                fileId: file.id,
                fieldKey: key,
              })
            }
          })
          // 也将文件ID列表放入 payload（可选，根据后端需求）
          payload[key] = value.map((f: { id: string }) => f.id)
        } else {
          payload[key] = value
        }
      })

      // 【调试日志】记录构建的 payload
      console.log('[APPLICATION_SUBMIT] Constructed payload:', payload)
      console.log('[APPLICATION_SUBMIT] payload.fullName:', payload.fullName)
      console.log('[APPLICATION_SUBMIT] payload.idNumber:', payload.idNumber)

      // 提交报名（需要传递租户ID）
      // 后端端点是 POST /applications（不是 /applications/submit）
      if (!tenant?.id) throw new Error('Tenant ID is required')
      const response = await apiPostWithTenant<{ id: string; status: string }>('/applications', tenant.id, {
        examId,
        positionId,
        payload,
        attachments,
      })

      setApplicationId(response.id)
      toast.success('报名提交成功！')
    } catch (error: any) {
      toast.error(error?.message || '提交失败，请重试')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async (formData: Record<string, any>) => {
    // TODO: 实现保存草稿功能
    console.log('Save draft:', formData)
    toast.success('草稿保存成功')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!exam || !position) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">考试或岗位不存在</p>
        <Button onClick={() => router.push(`/${tenantSlug}/exams`)}>返回考试列表</Button>
      </div>
    )
  }

  // 提交成功页面
  if (applicationId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">报名提交成功！</CardTitle>
            <CardDescription>您的报名申请已成功提交，请等待审核</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">报名编号</span>
                <span className="font-mono font-semibold">{applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">考试名称</span>
                <span className="font-medium">{exam.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">报考岗位</span>
                <span className="font-medium">{position.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">当前状态</span>
                <Badge variant="outline">待审核</Badge>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>下一步：</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>您的报名申请将进入初审阶段</li>
                  <li>初审通过后将进入复审阶段</li>
                  {exam.feeRequired && <li>复审通过后需要缴纳报名费 ¥{exam.feeAmount}</li>}
                  <li>缴费成功后可下载准考证</li>
                  <li>查看考场和座位安排</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/${tenantSlug}/exams`)}
              >
                返回考试列表
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push(`/${tenantSlug}/my-applications/${applicationId}`)}
              >
                查看报名详情
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 报名表单页面
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/${tenantSlug}/exams/${examId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">报名申请</h1>
            <p className="text-muted-foreground mt-1">
              {exam.title} - {position.title}
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>重要提示：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>请确保填写的信息真实准确，虚假信息将导致报名无效</li>
            <li>标记为 <span className="text-destructive">*</span> 的字段为必填项</li>
            <li>请按要求上传清晰的证件照片和证明材料</li>
            <li>提交后无法修改，请仔细检查后再提交</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Form */}
      {formTemplate && (
        <DynamicForm
          template={formTemplate}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
          examId={examId}
          positionId={positionId || undefined}
        />
      )}
    </div>
  )
}

