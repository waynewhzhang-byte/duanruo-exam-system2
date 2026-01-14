'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiGetWithTenant, apiPostWithTenant } from '@/lib/api'
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

export default function CandidateExamApplyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const examId = params.id as string
  const tenantId = searchParams.get('tenantId')
  const positionId = searchParams.get('positionId')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)

  // Fetch exam details
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ['exam', examId, tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required')
      return apiGetWithTenant<Exam>(`/exams/${examId}`, tenantId)
    },
    enabled: !!examId && !!tenantId,
  })

  // Fetch position details
  const { data: position, isLoading: positionLoading } = useQuery<Position>({
    queryKey: ['position', positionId, tenantId],
    queryFn: async () => {
      if (!positionId || !tenantId) throw new Error('Position ID and Tenant ID required')
      return apiGetWithTenant<Position>(`/positions/${positionId}`, tenantId)
    },
    enabled: !!positionId && !!tenantId,
  })

  // Fetch form template
  const { data: formTemplate, isLoading: templateLoading } = useQuery<FormTemplate>({
    queryKey: ['form-template', examId, tenantId],
    queryFn: async () => {
      try {
        if (!tenantId) throw new Error('Tenant ID is required')
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
        }>(`/exams/${examId}/form-template`, tenantId)

        if (response.status !== 'PUBLISHED') {
          console.warn('Form template is not published yet')
          return BASIC_TEMPLATE
        }

        return convertBackendToUITemplate(response)
      } catch (error) {
        console.warn('Failed to load form template, using default:', error)
        return BASIC_TEMPLATE
      }
    },
    enabled: !!examId && !!tenantId,
  })

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

  const isAgreementField = (label: string, fieldKey: string): boolean => {
    const agreementKeywords = ['同意', '协议', '确认', '声明', '承诺', 'agree', 'confirm', 'terms', 'policy']
    const lowerLabel = label.toLowerCase()
    const lowerKey = fieldKey.toLowerCase()
    return agreementKeywords.some(keyword =>
      lowerLabel.includes(keyword) || lowerKey.includes(keyword)
    )
  }

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
    const fields = backendTemplate.fields
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(field => {
        let fieldType = mapBackendFieldType(field.fieldType)

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
          name: field.fieldKey,
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

        if (fieldType === 'file-upload') {
          return {
            ...baseField,
            fileConfig: {
              maxFiles: 5,
              maxSize: 10,
              accept: field.fieldType === 'FILE_IMAGE'
                ? '.jpg,.jpeg,.png,.gif'
                : '.pdf,.jpg,.jpeg,.png',
              category: field.fieldKey,
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

  const isLoading = examLoading || positionLoading || templateLoading

  useEffect(() => {
    if (!positionId && !isLoading) {
      toast.error('请先选择要报考的岗位')
      router.push(`/candidate/exams/${examId}?tenantId=${tenantId}`)
    }
  }, [positionId, isLoading, router, examId, tenantId])

  const handleSubmit = async (formData: Record<string, any>) => {
    // 【调试日志】记录从 DynamicForm 接收到的原始表单数据
    console.log('[APPLICATION_SUBMIT] Raw formData from DynamicForm:', formData)
    console.log('[APPLICATION_SUBMIT] fullName:', formData.fullName)
    console.log('[APPLICATION_SUBMIT] idNumber:', formData.idNumber)

    if (!positionId || !tenantId) {
      toast.error('缺少必要参数')
      return
    }

    setIsSubmitting(true)
    try {
      const attachments: { fileId: string; fieldKey: string }[] = []
      const payload: Record<string, any> = {}

      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0 && value[0]?.id) {
          value.forEach((file: { id: string }) => {
            if (file.id) {
              attachments.push({ fileId: file.id, fieldKey: key })
            }
          })
          payload[key] = value.map((f: { id: string }) => f.id)
        } else {
          payload[key] = value
        }
      })

      // 【调试日志】记录构建的 payload
      console.log('[APPLICATION_SUBMIT] Constructed payload:', payload)
      console.log('[APPLICATION_SUBMIT] payload.fullName:', payload.fullName)
      console.log('[APPLICATION_SUBMIT] payload.idNumber:', payload.idNumber)

      const response = await apiPostWithTenant<{ id: string; status: string }>('/applications', tenantId, {
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
    console.log('Save draft:', formData)
    toast.success('草稿保存成功')
  }

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">缺少租户信息</p>
        <Button onClick={() => router.push('/candidate')}>返回首页</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!exam || !position) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">考试或岗位不存在</p>
        <Button onClick={() => router.push('/candidate')}>返回首页</Button>
      </div>
    )
  }

  // Success page
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
              <Button variant="outline" className="flex-1" onClick={() => router.push('/candidate')}>
                返回首页
              </Button>
              <Button className="flex-1" onClick={() => router.push(`/candidate/applications/${applicationId}`)}>
                查看报名详情
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Application form page
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/candidate/exams/${examId}?tenantId=${tenantId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">报名申请</h1>
            <p className="text-muted-foreground mt-1">{exam.title} - {position.title}</p>
          </div>
        </div>
      </div>

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

      {formTemplate && (
        <DynamicForm
          template={formTemplate}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
          examId={examId}
          positionId={positionId || undefined}
          tenantId={tenantId || undefined}
        />
      )}
    </div>
  )
}

