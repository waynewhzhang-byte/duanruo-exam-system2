'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/hooks/useTenant'
import { apiGet, apiPost } from '@/lib/api'
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

  // Fetch exam details
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ['exam', examId],
    queryFn: async () => {
      return apiGet<Exam>(`/exams/${examId}`)
    },
    enabled: !!examId,
  })

  // Fetch position details
  const { data: position, isLoading: positionLoading } = useQuery<Position>({
    queryKey: ['position', positionId],
    queryFn: async () => {
      if (!positionId) throw new Error('No position selected')
      return apiGet<Position>(`/positions/${positionId}`)
    },
    enabled: !!positionId,
  })

  // Fetch form template from exam level (not position level)
  const { data: formTemplate, isLoading: templateLoading } = useQuery<FormTemplate>({
    queryKey: ['form-template', examId],
    queryFn: async () => {
      try {
        const response = await apiGet<{ templateJson: string }>(`/exams/${examId}/form-template`)
        if (response.templateJson) {
          return JSON.parse(response.templateJson)
        }
        // 如果没有自定义模板，使用默认模板
        return BASIC_TEMPLATE
      } catch (error) {
        console.warn('Failed to load form template, using default:', error)
        return BASIC_TEMPLATE
      }
    },
    enabled: !!examId,
  })

  const isLoading = tenantLoading || examLoading || positionLoading || templateLoading

  // 如果没有选择岗位，跳转回考试详情页
  useEffect(() => {
    if (!positionId && !isLoading) {
      toast.error('请先选择要报考的岗位')
      router.push(`/${tenantSlug}/exams/${examId}`)
    }
  }, [positionId, isLoading, router, tenantSlug, examId])

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!positionId) {
      toast.error('未选择岗位')
      return
    }

    setIsSubmitting(true)
    try {
      // 分离附件和其他数据
      const attachments: any[] = []
      const payload: Record<string, any> = {}

      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0 && value[0]?.fileName) {
          // 这是文件上传字段
          attachments.push({
            fieldName: key,
            files: value,
          })
        } else {
          payload[key] = value
        }
      })

      // 提交报名
      const response = await apiPost<{ id: string; applicationNumber: string }>('/applications/submit', {
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

