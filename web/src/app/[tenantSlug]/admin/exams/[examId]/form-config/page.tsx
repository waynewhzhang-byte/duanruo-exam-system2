'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/loading'
import { ArrowLeft, Save, FileText } from 'lucide-react'
import { useExamFormTemplate, useUpdateExamFormTemplate } from '@/lib/api-hooks'
import FormBuilder from '@/components/admin/form-builder/FormBuilder'
import { FormTemplate } from '@/types/form-template'
import { BASIC_TEMPLATE, COMPREHENSIVE_TEMPLATE } from '@/data/form-templates'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ExamFormConfigPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string
  const tenantSlug = params.tenantSlug as string

  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const { data: formTemplateData, isLoading } = useExamFormTemplate(examId)
  const updateFormTemplate = useUpdateExamFormTemplate()

  // Initialize template from backend or use default
  useEffect(() => {
    if (!isLoading && !isInitialized) {
      if (formTemplateData?.templateJson) {
        try {
          const parsedTemplate = JSON.parse(formTemplateData.templateJson)
          setTemplate(parsedTemplate)
        } catch (error) {
          console.error('Failed to parse form template:', error)
          setTemplate(BASIC_TEMPLATE)
        }
      } else {
        // No template exists, use basic template as default
        setTemplate(BASIC_TEMPLATE)
      }
      setIsInitialized(true)
    }
  }, [formTemplateData, isLoading, isInitialized])

  const handleSave = async (updatedTemplate: FormTemplate) => {
    try {
      const templateJson = JSON.stringify(updatedTemplate, null, 2)
      await updateFormTemplate.mutateAsync({ examId, templateJson })
      toast.success('表单模板保存成功')
      setTemplate(updatedTemplate)
    } catch (error: any) {
      console.error('Failed to save form template:', error)
      toast.error(error?.message || '保存失败，请重试')
    }
  }

  const handleLoadTemplate = (templateType: 'basic' | 'comprehensive') => {
    const selectedTemplate = templateType === 'basic' ? BASIC_TEMPLATE : COMPREHENSIVE_TEMPLATE
    setTemplate(selectedTemplate)
    toast.info(`已加载${templateType === 'basic' ? '基础' : '完整'}模板`)
  }

  if (isLoading || !isInitialized) {
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
            onClick={() => router.push(`/${tenantSlug}/admin/exams`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回考试列表
          </Button>
          <div>
            <h1 className="text-2xl font-bold">配置报名表单</h1>
            <p className="text-sm text-muted-foreground">
              自定义考试报名表单的字段和布局
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => handleLoadTemplate(value as 'basic' | 'comprehensive')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="加载模板" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  基础模板
                </div>
              </SelectItem>
              <SelectItem value="comprehensive">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  完整模板
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Builder */}
      <Card>
        <CardHeader>
          <CardTitle>表单设计器</CardTitle>
          <CardDescription>
            拖拽字段到画布，配置字段属性，预览表单效果
          </CardDescription>
        </CardHeader>
        <CardContent>
          {template && (
            <FormBuilder
              examId={examId}
              initialTemplate={template}
              onSave={handleSave}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

